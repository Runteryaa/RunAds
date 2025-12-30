import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore"; 

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceSiteId = searchParams.get("id");

  const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers: corsHeaders });
  }

  if (!sourceSiteId) {
    console.error("RunAds Serve: Missing ID");
    return NextResponse.json({ error: "Missing ID" }, { status: 400, headers: corsHeaders });
  }

  try {
    const adminDb = getAdminDb();
    
    // Fetch Source Site
    const sourceDoc = await adminDb.collection("websites").doc(sourceSiteId).get();
    if (!sourceDoc.exists) {
      console.error(`RunAds Serve: Invalid Site ID ${sourceSiteId}`);
      return NextResponse.json({ error: "Invalid Site ID" }, { status: 404, headers: corsHeaders });
    }
    const sourceData = sourceDoc.data();
    
    // Check if disabled by owner
    if (sourceData?.showAds === false) {
        console.log(`RunAds Serve: Ads disabled by owner for ${sourceSiteId}`);
        return NextResponse.json({ ad: null, config: { refreshInterval: 60, disabled: true } }, { headers: corsHeaders });
    }

    const category = sourceData?.category || "general";
    const refreshInterval = sourceData?.refreshInterval || 30;

    console.log(`RunAds Serve: Processing request for ${sourceSiteId} (Category: ${category})`);

    // Helper function to pick a random candidate
    const pickRandom = (docs: any[]) => {
        const filtered = docs
            .filter(doc => doc.id !== sourceSiteId)
            .map(doc => ({ id: doc.id, ...doc.data() }));
            
        if (filtered.length === 0) return null;
        return filtered[Math.floor(Math.random() * filtered.length)];
    };

    let selectedAd: any = null;

    // --- HIERARCHY LEVEL 1: Paid Ad (Same Category) ---
    // hasCredits: true, category: match
    if (!selectedAd) {
        const snapshot = await adminDb.collection("websites")
            .where("category", "==", category)
            .where("active", "==", true)
            .where("hasCredits", "==", true)
            .limit(20)
            .get();
        selectedAd = pickRandom(snapshot.docs);
        if (selectedAd) console.log("RunAds Serve: Selected Level 1 (Paid / Same Category)");
    }

    // --- HIERARCHY LEVEL 2: Paid Ad (Any Category) ---
    // hasCredits: true, category: any
    if (!selectedAd) {
        const snapshot = await adminDb.collection("websites")
            .where("active", "==", true)
            .where("hasCredits", "==", true)
            .limit(20)
            .get();
        selectedAd = pickRandom(snapshot.docs);
        if (selectedAd) console.log("RunAds Serve: Selected Level 2 (Paid / Any Category)");
    }

    // --- HIERARCHY LEVEL 3: Any Ad (Same Category) ---
    // hasCredits: ignored (true OR false), category: match
    if (!selectedAd) {
        const snapshot = await adminDb.collection("websites")
            .where("category", "==", category)
            .where("active", "==", true)
            // .where("hasCredits", "==", true) // REMOVED
            .limit(20)
            .get();
        selectedAd = pickRandom(snapshot.docs);
        if (selectedAd) console.log("RunAds Serve: Selected Level 3 (Free / Same Category)");
    }

    // --- HIERARCHY LEVEL 4: Any Ad (Any Category) ---
    // hasCredits: ignored, category: any
    if (!selectedAd) {
        const snapshot = await adminDb.collection("websites")
            .where("active", "==", true)
            // .where("hasCredits", "==", true) // REMOVED
            .limit(20)
            .get();
        selectedAd = pickRandom(snapshot.docs);
        if (selectedAd) console.log("RunAds Serve: Selected Level 4 (Free / Any Category)");
    }

    // --- HIERARCHY LEVEL 5: System Promo ---
    if (!selectedAd) {
        console.log("RunAds Serve: Selected Level 5 (System Promo)");
        selectedAd = {
            id: "system-promo", 
            domain: "runads.onrender.com",
            category: "Technology",
            description: "Advertise your website here! Join the RunAds network today.",
            userId: "system"
        };
    }

    // Count View (only if it's a real ad)
    if (selectedAd.id !== "system-promo") {
        await adminDb.collection("websites").doc(sourceSiteId).update({
            views: FieldValue.increment(1)
        });
    }

    return NextResponse.json({ 
        ad: {
            id: selectedAd.id,
            domain: selectedAd.domain,
            category: selectedAd.category,
            description: selectedAd.description
        },
        config: {
            refreshInterval
        }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Ad Serve Error:", error);
    return NextResponse.json({ ad: null, config: { refreshInterval: 60 } }, { headers: corsHeaders });
  }
}
