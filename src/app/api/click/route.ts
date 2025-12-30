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

  try {
    const adminDb = getAdminDb();

    // 3. Fetch & Validate Source (The Publisher)
    const sourceDocRef = adminDb.collection("websites").doc(sourceSiteId);
    const sourceDoc = await sourceDocRef.get();

    if (!sourceDoc.exists) {
        return NextResponse.json({ error: "Invalid Source Site" }, { status: 404 });
    }
    const sourceData = sourceDoc.data();

    // 🔒 SECURITY: Referer Check (Prevent Bot/Direct Link Abuse)
    const referer = request.headers.get('referer');
    const registeredDomain = sourceData?.domain;
    
    // 4. Fetch Target (The Advertiser)
    const targetDocRef = adminDb.collection("websites").doc(targetSiteId);
    const targetDoc = await targetDocRef.get();

    if (!targetDoc.exists) {
        return NextResponse.json({ error: "Target Site Not Found" }, { status: 404 });
    }
    const targetData = targetDoc.data();

    // 5. Calculate Destination URL
    let destinationUrl = targetData?.domain || "https://google.com";
    destinationUrl = destinationUrl.trim();
    if (!destinationUrl.startsWith("http://") && !destinationUrl.startsWith("https://")) {
        destinationUrl = `https://${destinationUrl}`;
    }

    // 🛡️ ANTI-FRAUD: Prevent Self-Clicking
    if (process.env.IS_BETA !== 'true' && sourceData?.userId === targetData?.userId) {
        console.log("Self-click prevented in production.");
        return NextResponse.redirect(destinationUrl);
    }

    // Variables to track if we need to update website statuses after transaction
    let shouldDisableTarget = false;
    let shouldEnableSource = false;
    const targetUserId = targetData?.userId;
    const sourceUserId = sourceData?.userId;

    // 6. EXECUTE TRANSACTION
    await adminDb.runTransaction(async (t) => {
        const targetUserRef = adminDb.collection("users").doc(targetUserId);
        const sourceUserRef = adminDb.collection("users").doc(sourceUserId);

        const targetUserDoc = await t.get(targetUserRef);
        // We read source user too, to check if we need to reactivate their sites
        const sourceUserDoc = await t.get(sourceUserRef);

        const currentTargetCredits = targetUserDoc.data()?.credits || 0;
        const currentSourceCredits = sourceUserDoc.data()?.credits || 0;

        // Check if Advertiser can pay
        if (currentTargetCredits > 0) {
            // 1. Charge Advertiser
            t.update(targetUserRef, { credits: FieldValue.increment(-1) });

            // 2. Pay Publisher (1:1 Ratio)
            t.update(sourceUserRef, { credits: FieldValue.increment(1) });
            
            // 3. Update Stats
            t.update(sourceDocRef, { clicks: FieldValue.increment(1) }); // Publisher gets a "Click"
            t.update(targetDocRef, { visitors: FieldValue.increment(1) }); // Advertiser gets a "Visitor"

            // CHECK LOGIC:
            // If advertiser drops to 0 (or less), disable their campaigns.
            if (currentTargetCredits - 1 <= 0) {
                shouldDisableTarget = true;
            }

            // If publisher had <= 0 but now gets +1, re-enable their campaigns.
            if (currentSourceCredits <= 0) {
                shouldEnableSource = true;
            }
        } else {
           // User out of credits. We can't charge them.
           // Ideally we shouldn't have served this ad, but if we did, we ensure they are disabled now.
           shouldDisableTarget = true;
        }
    });

    // 7. POST-TRANSACTION UPDATES (Sync hasCredits flag on websites)
    // We do this outside the transaction to avoid read-after-write limitations and keep the transaction fast.
    
    if (shouldDisableTarget) {
        // Find all websites for this user and set hasCredits = false
        const sitesSnapshot = await adminDb.collection("websites").where("userId", "==", targetUserId).get();
        if (!sitesSnapshot.empty) {
            const batch = adminDb.batch();
            sitesSnapshot.docs.forEach(doc => {
                // Only update if it's currently true to save writes
                if (doc.data().hasCredits !== false) {
                    batch.update(doc.ref, { hasCredits: false });
                }
            });
            await batch.commit();
            console.log(`Disabled campaigns for user ${targetUserId} due to low credits.`);
        }
    }

    if (shouldEnableSource) {
        // Find all websites for this user and set hasCredits = true
        const sitesSnapshot = await adminDb.collection("websites").where("userId", "==", sourceUserId).get();
        if (!sitesSnapshot.empty) {
            const batch = adminDb.batch();
            sitesSnapshot.docs.forEach(doc => {
                if (doc.data().hasCredits !== true) {
                    batch.update(doc.ref, { hasCredits: true });
                }
            });
            await batch.commit();
            console.log(`Re-enabled campaigns for user ${sourceUserId} (credits earned).`);
        }
    }

    // 8. Redirect User
    return NextResponse.redirect(destinationUrl);

  } catch (error) {
    console.error("Click Tracking Error:", error);
    // Always fail open: Send the user to the destination so UX isn't broken
    return NextResponse.redirect("https://google.com"); 
  }
}
