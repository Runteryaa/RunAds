import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: "Missing Token" }, { status: 400 });
        }

        const adminDb = getAdminDb();
        const pendingRef = adminDb.collection("pending_clicks").doc(token);
        const pendingDoc = await pendingRef.get();

        if (!pendingDoc.exists) {
            // Token likely already used or expired
            return NextResponse.json({ error: "Invalid or Expired Token" }, { status: 400 });
        }

        const data = pendingDoc.data();
        if (!data) return NextResponse.json({ error: "No Data" }, { status: 500 });

        const { sourceUserId, targetUserId, sourceSiteId, targetSiteId } = data;

        // Variables for post-transaction updates
        let shouldDisableTarget = false;
        let shouldEnableSource = false;

        // --- EXECUTE TRANSACTION ---
        await adminDb.runTransaction(async (t) => {
            const targetUserRef = adminDb.collection("users").doc(targetUserId);
            const sourceUserRef = adminDb.collection("users").doc(sourceUserId);
            const targetSiteRef = adminDb.collection("websites").doc(targetSiteId);
            const sourceSiteRef = adminDb.collection("websites").doc(sourceSiteId);

            const targetUserDoc = await t.get(targetUserRef);
            const sourceUserDoc = await t.get(sourceUserRef); // Read source too for reactivation logic

            const currentTargetCredits = targetUserDoc.data()?.credits || 0;
            const currentSourceCredits = sourceUserDoc.data()?.credits || 0;

            if (currentTargetCredits > 0) {
                // 1. Charge Advertiser
                t.update(targetUserRef, { credits: FieldValue.increment(-1) });
                // 2. Pay Publisher
                t.update(sourceUserRef, { credits: FieldValue.increment(1) });
                
                // 3. Update Stats
                t.update(sourceSiteRef, { clicks: FieldValue.increment(1) });
                t.update(targetSiteRef, { visitors: FieldValue.increment(1) });

                // 4. Check Credit Thresholds (Campaign Management)
                if (currentTargetCredits - 1 <= 0) {
                    shouldDisableTarget = true;
                }
                if (currentSourceCredits <= 0) {
                    shouldEnableSource = true;
                }
            } else {
                // Advertiser has no money!
                shouldDisableTarget = true;
                throw new Error("Insufficient Credits");
            }
        });

        // --- CLEAN UP ---
        // Delete the pending click so it can't be reused
        await pendingRef.delete();

        // --- POST-TRANSACTION UPDATES ---
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

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ success: false, error: "Verification Failed" }, { status: 500 });
    }
}
