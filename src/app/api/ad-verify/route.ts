// /app/api/ad-verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
    const { token } = await request.json();

    // 1. Decrypt/Validate Token
    // In V1, you can just store pending clicks in a "pending_transactions" collection
    const db = getAdminDb();
    const pendingDoc = await db.collection("pending_clicks").doc(token).get();

    if (!pendingDoc.exists) {
        return NextResponse.json({ error: "Invalid or Expired Token" }, { status: 400 });
    }

    const data = pendingDoc.data(); // Contains { sourceUserId, targetUserId, etc. }

    // 2. Run the Transaction (Deduct Credits)
    await db.runTransaction(async (t) => {
        // ... (Same logic as your current click route) ...
        // Deduct from Target, Add to Source
    });

    // 3. Delete the pending doc so it can't be used twice
    await db.collection("pending_clicks").doc(token).delete();

    return NextResponse.json({ success: true });
}
