import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceSiteId = searchParams.get("id"); // The site WHERE the ad was shown
  const targetSiteId = searchParams.get("target"); // The site THAT was clicked

  if (!sourceSiteId || !targetSiteId) {
    return NextResponse.json({ error: "Missing Parameters" }, { status: 400 });
  }

  // --- DEMO CLICK HANDLER ---
  if (sourceSiteId === "DEMO" || targetSiteId === "RUNADS_OFFICIAL") {
      // Just redirect to home, no transaction logic needed for demo
      return NextResponse.redirect(new URL('/', request.url));
  }
  // --------------------------

  try {
    const adminDb = getAdminDb();
    const FieldValue = (await import('firebase-admin/firestore')).FieldValue;

    // 1. Get Source Site (Earner)
    const sourceDocRef = adminDb.collection("websites").doc(sourceSiteId);
    const sourceDoc = await sourceDocRef.get();
    
    // 2. Get Target Site (Payer)
    const targetDocRef = adminDb.collection("websites").doc(targetSiteId);
    const targetDoc = await targetDocRef.get();

    if (sourceDoc.exists && targetDoc.exists) {
        const sourceData = sourceDoc.data();
        const targetData = targetDoc.data();

        // Transaction for balance transfer
        await adminDb.runTransaction(async (t) => {
            // Check target user balance again
            const targetUserRef = adminDb.collection("users").doc(targetData?.userId);
            const targetUserDoc = await t.get(targetUserRef);
            const targetBalance = targetUserDoc.data()?.credits || 0;

            if (targetBalance > 0) {
                // Deduct from Target (Advertiser)
                t.update(targetUserRef, { credits: FieldValue.increment(-1) });

                // Add to Source (Publisher)
                const sourceUserRef = adminDb.collection("users").doc(sourceData?.userId);
                t.update(sourceUserRef, { credits: FieldValue.increment(1) });
                
                // Update metrics
                t.update(sourceDocRef, { clicks: FieldValue.increment(1) });
            }
        });

        // Redirect user to target website
        // Ensure protocol
        let url = targetData?.domain;
        if (!url.startsWith("http")) {
            url = `https://${url}`;
        }
        
        return NextResponse.redirect(url);
    }

    return NextResponse.json({ error: "Site not found" }, { status: 404 });

  } catch (error) {
    console.error("Click Tracking Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
