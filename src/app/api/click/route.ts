import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceSiteId = searchParams.get("id");
  const targetSiteId = searchParams.get("target");

  // 1. Validate Inputs
  if (!sourceSiteId || !targetSiteId) {
    return NextResponse.json({ error: "Missing Parameters" }, { status: 400 });
  }

  // IP Address Detection
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  try {
    const adminDb = getAdminDb();

    // 2. Fetch & Validate Source (The Publisher)
    const sourceDocRef = adminDb.collection("websites").doc(sourceSiteId);
    const sourceDoc = await sourceDocRef.get();

    if (!sourceDoc.exists) {
        return NextResponse.json({ error: "Invalid Source Site" }, { status: 404 });
    }
    const sourceData = sourceDoc.data();

    // 3. Fetch Target (The Advertiser)
    const targetDocRef = adminDb.collection("websites").doc(targetSiteId);
    const targetDoc = await targetDocRef.get();

    if (!targetDoc.exists) {
        if (targetSiteId === "system-promo") {
             return NextResponse.redirect("https://runads.onrender.com");
        }
        return NextResponse.json({ error: "Target Site Not Found" }, { status: 404 });
    }
    const targetData = targetDoc.data();

    // 4. Calculate Destination URL
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
    
    // B. System Promos (No credit)
    if (targetSiteId === "system-promo") {
         return NextResponse.redirect(destinationUrl);
    }

    // C. RATE LIMITING (1 Click per IP per Source per 24h)
    // We check if this IP has already clicked on THIS source website recently.
    // Note: We don't care which Target they clicked. We limit the Publisher's ability to generate credits from one person.
    
    // Calculate timestamp for 24 hours ago
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const logsRef = adminDb.collection("click_logs");
    const existingLogQuery = await logsRef
        .where("ip", "==", ip)
        .where("sourceSiteId", "==", sourceSiteId)
        .where("timestamp", ">", yesterday)
        .limit(1)
        .get();

    if (!existingLogQuery.empty) {
        console.log(`[Click] Rate Limit: IP ${ip} already clicked on site ${sourceSiteId} in last 24h.`);
        // Redirect the user but DO NOT transfer credits.
        return NextResponse.redirect(destinationUrl);
    }

    // 6. EXECUTE TRANSACTION & LOGGING
    let shouldDisableTarget = false;
    let shouldEnableSource = false;
    const targetUserId = targetData?.userId;
    const sourceUserId = sourceData?.userId;

    await adminDb.runTransaction(async (t) => {
        const targetUserRef = adminDb.collection("users").doc(targetUserId);
        const sourceUserRef = adminDb.collection("users").doc(sourceUserId);

        const targetUserDoc = await t.get(targetUserRef);
        const sourceUserDoc = await t.get(sourceUserRef);

        const currentTargetCredits = targetUserDoc.data()?.credits || 0;
        const currentSourceCredits = sourceUserDoc.data()?.credits || 0;

        if (currentTargetCredits > 0) {
            // Transfer Credits
            t.update(targetUserRef, { credits: FieldValue.increment(-1) });
            t.update(sourceUserRef, { credits: FieldValue.increment(1) });
            
            // Update Stats
            t.update(sourceDocRef, { clicks: FieldValue.increment(1) });
            t.update(targetDocRef, { visitors: FieldValue.increment(1) });
            
            // Log this click to enforce rate limit
            // We use a new doc ID composed of IP + Source + Day? No, random ID is fine with timestamp index.
            const logDocRef = logsRef.doc();
            t.set(logDocRef, {
                ip: ip,
                sourceSiteId: sourceSiteId,
                targetSiteId: targetSiteId,
                timestamp: FieldValue.serverTimestamp()
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
