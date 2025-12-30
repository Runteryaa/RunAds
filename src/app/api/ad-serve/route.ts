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
    return NextResponse.json({ error: "Missing ID" }, { status: 400, headers: corsHeaders });
  }

  try {
    const adminDb = getAdminDb();
    
    const sourceDoc = await adminDb.collection("websites").doc(sourceSiteId).get();
    
    if (!sourceDoc.exists) {
      return NextResponse.json({ error: "Invalid Site ID" }, { status: 404, headers: corsHeaders });
    }

    const sourceData = sourceDoc.data();
    
    // Check if the user has disabled ads on their own site
    if (sourceData?.showAds === false) {
        return NextResponse.json({ ad: null, config: { refreshInterval: 60, disabled: true } }, { headers: corsHeaders });
    }

    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    const registeredDomain = sourceData?.domain || "";

    if (referer && !referer.includes(registeredDomain) && !origin?.includes(registeredDomain)) {
        // Domain mismatch logic (optional)
    }

    const category = sourceData?.category || "general";
    
    const snapshot = await adminDb.collection("websites")
      .where("category", "==", category)
      .where("active", "==", true)
      .where("hasCredits", "==", true)
      .limit(20) 
      .get();

    if (snapshot.empty) {
        return NextResponse.json({ ad: null, config: { refreshInterval: 60 } }, { headers: corsHeaders });
    }

    const candidates = snapshot.docs
        .filter(doc => doc.id !== sourceSiteId)
        .map(doc => ({ id: doc.id, ...doc.data() }));

    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    let selectedAd = candidates.length > 0 ? candidates[0] : null;

    const refreshInterval = sourceData?.refreshInterval || 30;

    if (!selectedAd) {
       return NextResponse.json({ ad: null, config: { refreshInterval } }, { headers: corsHeaders });
    }

    await adminDb.collection("websites").doc(sourceSiteId).update({
        views: FieldValue.increment(1)
    });

    return NextResponse.json({ 
        ad: {
            id: selectedAd.id,
            domain: (selectedAd as any).domain,
            category: (selectedAd as any).category,
            description: (selectedAd as any).description || "Best for website traffic"
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
