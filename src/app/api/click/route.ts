import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceSiteId = searchParams.get("id");
  const targetSiteId = searchParams.get("target");

  // 1. Validate Inputs
  if (!sourceSiteId || !targetSiteId) {
    return NextResponse.json({ error: "Missing Parameters" }, { status: 400 });
  }

  // IP Address Detection (Sanitize dots/colons for Doc ID usage)
  const rawIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ip = rawIp.replace(/[^a-zA-Z0-9]/g, "_"); 

  // Parse User Agent
  const userAgentString = request.headers.get("user-agent") || "";
  const parser = new UAParser(userAgentString);
  const deviceType = parser.getDevice().type || "desktop"; // 'mobile', 'tablet', 'console', 'smarttv', 'wearable', 'embedded'
  const browserName = parser.getBrowser().name || "unknown";
  const osName = parser.getOS().name || "unknown";

  // Parse Geo Location
  const geo = geoip.lookup(rawIp);
  const country = geo?.country || "Unknown";

  try {
    const adminDb = getAdminDb();

    // 2. Fetch & Validate Source
    const sourceDocRef = adminDb.collection("websites").doc(sourceSiteId);
    const sourceDoc = await sourceDocRef.get();

    if (!sourceDoc.exists) {
        return NextResponse.json({ error: "Invalid Source Site" }, { status: 404 });
    }
    const sourceData = sourceDoc.data();

    // 3. Fetch Target
    const targetDocRef = adminDb.collection("websites").doc(targetSiteId);
    const targetDoc = await targetDocRef.get();

    if (!targetDoc.exists) {
        if (targetSiteId === "system-promo") {
             return NextResponse.redirect("https://runads.onrender.com");
        }
        return NextResponse.json({ error: "Target Site Not Found" }, { status: 404 });
    }
    const targetData = targetDoc.data();

    let destinationUrl = targetData?.domain || "https://google.com";
    destinationUrl = destinationUrl.trim();
    if (!destinationUrl.startsWith("http://") && !destinationUrl.startsWith("https://")) {
        destinationUrl = `https://${destinationUrl}`;
    }

    // 5. ANTI-FRAUD CHECKS
    
    // A. Self-Click Prevention
    if (process.env.IS_BETA !== 'true' && sourceData?.userId === targetData?.userId) {
        console.log(`[Click] Fraud: Self-click detected (IP: ${ip})`);
        return NextResponse.redirect(destinationUrl);
    }
    
    // B. System Promos
    if (targetSiteId === "system-promo") {
         return NextResponse.redirect(destinationUrl);
    }

    // C. RATE LIMITING (Index-Free Approach)
    // We enforce 1 click per Calendar Day (UTC).
    // Doc ID: click_logs / {sourceSiteId}_{ip}_{YYYY-MM-DD}
    // This allows us to use a direct .get() which is fast and needs no index.
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logId = `${sourceSiteId}_${ip}_${today}`;
    const logDocRef = adminDb.collection("click_logs").doc(logId);
    
    const logDoc = await logDocRef.get();

    if (logDoc.exists) {
        console.log(`[Click] Rate Limit: IP ${ip} already clicked on site ${sourceSiteId} today.`);
        return NextResponse.redirect(destinationUrl);
    }

    // 6. EXECUTE TRANSACTION
    let shouldDisableTarget = false;
    let shouldEnableSource = false;
    const targetUserId = targetData?.userId;
    const sourceUserId = sourceData?.userId;

    await adminDb.runTransaction(async (t) => {
        const targetUserRef = adminDb.collection("users").doc(targetUserId);
        const sourceUserRef = adminDb.collection("users").doc(sourceUserId);

        const targetUserDoc = await t.get(targetUserRef);
        const sourceUserDoc = await t.get(sourceUserRef);
        
        // References for daily stats
        const sourceDailyStatsRef = sourceDocRef.collection("daily_stats").doc(today);

        // References for aggregated Analytics
        const analyticsRef = sourceDocRef.collection("analytics").doc(today);


        const currentTargetCredits = targetUserDoc.data()?.credits || 0;
        const currentSourceCredits = sourceUserDoc.data()?.credits || 0;

        if (currentTargetCredits > 0) {
            // Transfer Credits
            t.update(targetUserRef, { credits: FieldValue.increment(-1) });
            t.update(sourceUserRef, { credits: FieldValue.increment(1) });
            
            // Update Stats (Total)
            t.update(sourceDocRef, { clicks: FieldValue.increment(1) });
            t.update(targetDocRef, { visitors: FieldValue.increment(1) });
            
            // Update Stats (Daily)
            t.set(sourceDailyStatsRef, { 
                date: today,
                clicks: FieldValue.increment(1) 
            }, { merge: true });

            // Update Granular Analytics (Device/Country)
            t.set(analyticsRef, {
                date: today,
                [`countries.${country}`]: FieldValue.increment(1),
                [`devices.${deviceType}`]: FieldValue.increment(1),
                [`browsers.${browserName}`]: FieldValue.increment(1),
                [`os.${osName}`]: FieldValue.increment(1),
                totalClicks: FieldValue.increment(1)
            }, { merge: true });

            // Log this click to enforce rate limit (Create the daily lock)
            t.set(logDocRef, {
                ip: rawIp,
                sourceSiteId: sourceSiteId,
                targetSiteId: targetSiteId,
                timestamp: FieldValue.serverTimestamp(),
                day: today,
                country: country,
                device: deviceType,
                browser: browserName,
                os: osName
            });

            // Campaign Logic
            if (currentTargetCredits - 1 <= 0) shouldDisableTarget = true;
            if (currentSourceCredits <= 0) shouldEnableSource = true;
        } else {
           shouldDisableTarget = true;
        }
    });

    // 7. POST-TRANSACTION UPDATES
    if (shouldDisableTarget) {
        const sitesSnapshot = await adminDb.collection("websites").where("userId", "==", targetUserId).get();
        if (!sitesSnapshot.empty) {
            const batch = adminDb.batch();
            sitesSnapshot.docs.forEach(doc => {
                if (doc.data().hasCredits !== false) batch.update(doc.ref, { hasCredits: false });
            });
            await batch.commit();
        }
    }

    if (shouldEnableSource) {
        const sitesSnapshot = await adminDb.collection("websites").where("userId", "==", sourceUserId).get();
        if (!sitesSnapshot.empty) {
            const batch = adminDb.batch();
            sitesSnapshot.docs.forEach(doc => {
                if (doc.data().hasCredits !== true) batch.update(doc.ref, { hasCredits: true });
            });
            await batch.commit();
        }
    }

    return NextResponse.redirect(destinationUrl);

  } catch (error) {
    console.error("Click Tracking Error:", error);
    return NextResponse.redirect("https://google.com"); 
  }
}
