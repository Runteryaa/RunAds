// src/lib/firebase-admin.ts - One-off script runner approach (conceptual)
// Since we can't easily run a one-off node script with full env vars in this environment without setup
// We will modify the API to handle the creation if it doesn't exist, lazily.

// However, user asked to "add demo tag to our db as DEMO".
// I will create a temporary API route that I can trigger to seed the DB.

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
    try {
        const db = getAdminDb();
        
        // 1. Create the DEMO website entry if it doesn't exist
        await db.collection("websites").doc("DEMO").set({
            domain: "runads.com", // Official demo domain
            category: "Technology",
            adTitle: "RunAds Official Demo",
            adDescription: "This is a demo of the RunAds network. See how it drives traffic!",
            active: true,
            userId: "ADMIN", // Special user
            createdAt: new Date(),
            views: 0,
            clicks: 0
        }, { merge: true });

        return NextResponse.json({ message: "Demo data seeded successfully." });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
