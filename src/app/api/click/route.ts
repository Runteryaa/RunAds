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
    // We check if the request actually came from the Source Site's domain.
    const referer = request.headers.get('referer');
    const registeredDomain = sourceData?.domain;
    
    // NOTE: In strict production, uncomment the lines below. 
    // For localhost testing, keep them commented or add 'localhost' to the check.
    /*
    if (registeredDomain && referer && !referer.includes(registeredDomain) && !referer.includes('localhost')) {
         console.warn(`Click fraud detected? Referer: ${referer}, Expected: ${registeredDomain}`);
         // Fail safely: Redirect to home or target without counting the click
         return NextResponse.redirect("https://yillik75.com.tr"); 
    }
    */

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
    // If the Publisher and Advertiser are the same person, don't move credits.
    if (sourceData?.userId === targetData?.userId) {
        return NextResponse.redirect(destinationUrl);
    }

    // 6. EXECUTE TRANSACTION
    await adminDb.runTransaction(async (t) => {
        const targetUserRef = adminDb.collection("users").doc(targetData?.userId);
        const sourceUserRef = adminDb.collection("users").doc(sourceData?.userId);

        const targetUserDoc = await t.get(targetUserRef);
        const currentCredits = targetUserDoc.data()?.credits || 0;

        // Check if Advertiser can pay
        if (currentCredits > 0) {
            // 1. Charge Advertiser
            t.update(targetUserRef, { credits: FieldValue.increment(-1) });

            // 2. Pay Publisher (1:1 Ratio)
            // Tip: Change to 0.8 to create a "Platform Fee" later
            t.update(sourceUserRef, { credits: FieldValue.increment(1) });
            
            // 3. Update Stats
            t.update(sourceDocRef, { clicks: FieldValue.increment(1) }); // Publisher gets a "Click"
            t.update(targetDocRef, { visitors: FieldValue.increment(1) }); // Advertiser gets a "Visitor"
        } else {
            // Optional: Mark advertiser as inactive if out of credits
            // t.update(targetDocRef, { active: false });
        }
    });

    // 7. Redirect User
    return NextResponse.redirect(destinationUrl);

  } catch (error) {
    console.error("Click Tracking Error:", error);
    // Always fail open: Send the user to the destination so UX isn't broken
    return NextResponse.redirect("https://yillik75.com.tr"); 
  }
}
