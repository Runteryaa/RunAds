import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore"; 

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceSiteId = searchParams.get("id");

  // Server-side Log
  const categoryLog = sourceSiteId ? `(Site ID: ${sourceSiteId})` : "";
  console.log(`[AdServe] ------------------------------------------------`);
  console.log(`[AdServe] Request Start ${categoryLog}`);

  const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers: corsHeaders });
  }

  if (!sourceSiteId) {
    console.error("[AdServe] Error: Missing ID");
    return NextResponse.json({ error: "Missing ID" }, { status: 400, headers: corsHeaders });
  }

  try {
    const adminDb = getAdminDb();
    
    // Fetch Source Site
    const sourceDoc = await adminDb.collection("websites").doc(sourceSiteId).get();
    if (!sourceDoc.exists) {
      console.error("[AdServe] Error: Invalid Site ID");
      return NextResponse.json({ error: "Invalid Site ID" }, { status: 404, headers: corsHeaders });
    }
    const sourceData = sourceDoc.data();
    
    // Check if disabled by owner
    if (sourceData?.showAds === false) {
        console.log("[AdServe] Ads disabled by owner.");
        return NextResponse.json({ ad: null, config: { refreshInterval: 60, disabled: true } }, { headers: corsHeaders });
    }

    const category = sourceData?.category || "general";
    const refreshInterval = sourceData?.refreshInterval || 30;

    console.log(`[AdServe] Source Category: ${category}`);

    // Helper function to pick a random candidate
    const pickRandom = (docs: any[], stageName: string) => {
        // Filter out self
        const filtered = docs
            .filter(doc => doc.id !== sourceSiteId)
            .map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`[AdServe] ${stageName}: Found ${docs.length} raw, ${filtered.length} after filtering self.`);
            
        if (filtered.length === 0) return null;
        return filtered[Math.floor(Math.random() * filtered.length)];
    };

    let selectedAd: any = null;
    let selectionLevel = "None";

    // --- HIERARCHY LEVEL 1: Paid Ad (Same Category) ---
    // hasCredits: true, category: match
    if (!selectedAd) {
        const snapshot = await adminDb.collection("websites")
            .where("category", "==", category)
            .where("active", "==", true)
            .where("hasCredits", "==", true)
            .limit(20)
            .get();
        selectedAd = pickRandom(snapshot.docs, "L1 (Paid/Same)");
        if (selectedAd) selectionLevel = "L1 (Paid/Same)";
    }

    // --- HIERARCHY LEVEL 2: Paid Ad (Any Category) ---
    // hasCredits: true, category: any
    if (!selectedAd) {
        const snapshot = await adminDb.collection("websites")
            .where("active", "==", true)
            .where("hasCredits", "==", true)
            .limit(20)
            .get();
        selectedAd = pickRandom(snapshot.docs, "L2 (Paid/Any)");
        if (selectedAd) selectionLevel = "L2 (Paid/Any)";
    }

    // --- HIERARCHY LEVEL 3: Any Ad (Same Category) ---
    // hasCredits: ignored, category: match
    if (!selectedAd) {
        const snapshot = await adminDb.collection("websites")
            .where("category", "==", category)
            .where("active", "==", true)
            .limit(20)
            .get();
        selectedAd = pickRandom(snapshot.docs, "L3 (Free/Same)");
        if (selectedAd) selectionLevel = "L3 (Free/Same)";
    }

    // --- HIERARCHY LEVEL 4: Any Ad (Any Category) ---
    // hasCredits: ignored, category: any
    if (!selectedAd) {
        const snapshot = await adminDb.collection("websites")
            .where("active", "==", true)
            .limit(20)
            .get();
        selectedAd = pickRandom(snapshot.docs, "L4 (Free/Any)");
        if (selectedAd) selectionLevel = "L4 (Free/Any)";
    }

    // --- HIERARCHY LEVEL 5: System Promo ---
    if (!selectedAd) {
        selectionLevel = "L5 (System Promo)";
        selectedAd = {
            id: "system-promo", 
            domain: "runads.onrender.com",
            category: "Technology",
            description: "Advertise your website here! Join the RunAds network today.",
            userId: "system"
        };
        console.log("[AdServe] L5: Using System Promo");
    }

    console.log(`[AdServe] SUCCESS. Serving Level: ${selectionLevel}, Ad ID: ${selectedAd.id}`);

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
            refreshInterval,
            debugInfo: selectionLevel
        }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("[AdServe] Critical Error:", error);
    return NextResponse.json({ ad: null, config: { refreshInterval: 60 } }, { headers: corsHeaders });
  }
}
