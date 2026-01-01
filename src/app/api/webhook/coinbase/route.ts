import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const signature = request.headers.get("x-cc-webhook-signature");
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
        return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    try {
        // Verify Signature
        const hmac = crypto.createHmac('sha256', webhookSecret);
        const digest = hmac.update(rawBody).digest('hex');

        if (signature !== digest) {
            return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
        }

        const event = JSON.parse(rawBody);
        const { type, data } = event;

        // Handle successful payments
        if (type === 'charge:confirmed') {
            const metadata = data.metadata;
            const userId = metadata?.userId;
            const credits = parseInt(metadata?.credits || '0');

            if (userId && credits > 0) {
                const db = getAdminDb();
                await db.collection("users").doc(userId).update({
                    credits: FieldValue.increment(credits)
                });
                console.log(`[Coinbase] Added ${credits} credits to user ${userId}`);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Webhook Failed" }, { status: 500 });
    }
}
