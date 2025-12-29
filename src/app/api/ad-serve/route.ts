import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceSiteId = searchParams.get("id");

  if (!sourceSiteId) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

// --- DEMO MODE HANDLER ---
  if (sourceSiteId === "DEMO") {
      return NextResponse.json({
          ad: {
              id: "RUNADS", 
              domain: "RunAds.com",
              category: "DEMO",
              isDemo: true
          },
          config: {
              refreshInterval: 30 // Demo defaults to 30s
          }
      });
  }
  // -------------------------
  
  try {
    const adminDb = getAdminDb();
    
    // 1. Validate the source website
    const sourceDoc = await adminDb.collection("websites").doc(sourceSiteId).get();
    
    if (!sourceDoc.exists) {
      return NextResponse.json({ error: "Invalid Site ID" }, { status: 404 });
    }

    const sourceData = sourceDoc.data();
    
    // 2. Find a target ad
    const category = sourceData?.category;
    
    const snapshot = await adminDb.collection("websites")
      .where("category", "==", category)
      .where("active", "==", true)
      .limit(20) 
      .get();

    const candidates: any[] = [];
    
    for (const doc of snapshot.docs) {
       if (doc.id === sourceSiteId) continue; 
       
       const data = doc.data();
       const userDoc = await adminDb.collection("users").doc(data.userId).get();
       if (userDoc.exists && (userDoc.data()?.credits || 0) > 0) {
          candidates.push({ id: doc.id, ...data });
       }
    }

    const refreshInterval = sourceData?.refreshInterval || 30;

    if (candidates.length === 0) {
        // Return null ad but still config so client knows when to retry
        return NextResponse.json({ 
            ad: null,
            config: { refreshInterval }
        }); 
    }

    const randomAd = candidates[Math.floor(Math.random() * candidates.length)];

    const FieldValue = (await import('firebase-admin/firestore')).FieldValue;
    
    await adminDb.collection("websites").doc(sourceSiteId).update({
        views: FieldValue.increment(1)
    });

    return NextResponse.json({ 
        ad: {
            id: randomAd.id,
            domain: randomAd.domain,
            category: randomAd.category
        },
        config: {
            refreshInterval
        }
    });

  } catch (error) {
    console.error("Ad Serve Error:", error);
    return NextResponse.json({ ad: null, config: { refreshInterval: 60 } });
  }
}
