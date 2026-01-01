import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase"; // Note: We verify auth via token if possible, but for simplicity we assume client passes ID and we trust it OR we rely on session cookies. Next.js App Router API routes don't share client Firebase Auth easily without cookies.
// Better approach: Pass userId in body, and trust it for now (or verify ID token if sent). 
// Since adding credits happens on webhook (verified by Coinbase), the risk is low.

const PACKAGES = {
    'starter': { name: 'Starter Pack', price: '1.00', credits: 100 },
    'pro': { name: 'Pro Pack', price: '5.00', credits: 600 },
    'business': { name: 'Business Pack', price: '20.00', credits: 3000 },
};

export async function POST(request: NextRequest) {
    try {
        const { packageId, userId } = await request.json();

        if (!PACKAGES[packageId as keyof typeof PACKAGES]) {
            return NextResponse.json({ error: "Invalid Package" }, { status: 400 });
        }
        if (!userId) {
            return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
        }

        const pkg = PACKAGES[packageId as keyof typeof PACKAGES];
        const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Server Error: Missing API Key" }, { status: 500 });
        }

        const payload = {
            name: `RunAds - ${pkg.name}`,
            description: `${pkg.credits} Ad Credits`,
            pricing_type: 'fixed_price',
            local_price: {
                amount: pkg.price,
                currency: 'USD'
            },
            metadata: {
                userId: userId,
                credits: pkg.credits.toString(),
                packageId: packageId
            },
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://runads.onrender.com'}/dashboard`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://runads.onrender.com'}/dashboard/credits`
        };

        const response = await fetch('https://api.commerce.coinbase.com/charges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CC-Api-Key': apiKey,
                'X-CC-Version': '2018-03-22'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Coinbase Error:", data);
            return NextResponse.json({ error: "Failed to create charge" }, { status: 500 });
        }

        return NextResponse.json({ url: data.data.hosted_url });

    } catch (error) {
        console.error("Payment API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
