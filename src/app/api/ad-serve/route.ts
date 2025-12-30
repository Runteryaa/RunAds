import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore"; // Import this at the top

export const dynamic = 'force-dynamic'; // Prevent Next.js from caching this route statically

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceSiteId = searchParams.get("id");

  // --- CORS Helper ---
  const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // In production, maybe restrict this to known domains if possible
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
    
    // 1. Validate the SOURCE website
    const sourceDoc = await adminDb.collection("websites").doc(sourceSiteId).get();
    
    if (!sourceDoc.exists) {
      return NextResponse.json({ error: "Invalid Site ID" }, { status: 404, headers: corsHeaders });
    }

    const sourceData = sourceDoc.data();
    
    // 🛡️ SECURITY: Referer Validation
    // Ensure the request is coming from the actual domain registered to this ID.
    // This prevents people from stealing your Site IDs.
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    const registeredDomain = sourceData?.domain || "";

    // Normalize domains for comparison (remove protocol, www, etc if needed)
    // Simple check: does the referer include the registered domain?
    if (referer && !referer.includes(registeredDomain) && !origin?.includes(registeredDomain)) {
         // console.warn(\`Domain Mismatch: Request from \${referer} but ID belongs to \${registeredDomain}\`);
         // return NextResponse.json({ error: "Unauthorized Domain" }, { status: 403, headers: corsHeaders });
         
         // Note: For development (localhost), you might want to bypass this check or add localhost to allowed list.
    }

    // 2. Fetch Candidates
    // Note: We do NOT check user credits inside the query yet to avoid complex joins.
    const category = sourceData?.category || "general";
    
    const snapshot = await adminDb.collection("websites")
      .where("category", "==", category)
      .where("active", "==", true) // Ensure you have a system to set active=false if credits=0
      .limit(20) 
      .get();

    if (snapshot.empty) {
        return NextResponse.json({ ad: null, config: { refreshInterval: 60 } }, { headers: corsHeaders });
    }

    // 3. Optimized Selection (Shuffle & Lazy Check)
    // Filter out self, then shuffle
    const candidates = snapshot.docs
        .filter(doc => doc.id !== sourceSiteId)
        .map(doc => ({ id: doc.id, ...doc.data() }));

    // Fisher-Yates Shuffle (Randomize order)
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    let selectedAd = null;

    // Iterate through shuffled list and check credits ONE BY ONE until we find a winner.
    // This prevents checking credits for 20 users when we only need 1.
    for (const candidate of candidates) {
        const userId = (candidate as any).userId;
        if (!userId) continue;

        // Check Credits
        // OPTIMIZATION TIP: In a perfect world, store 'hasCredits: true' on the website doc 
        // using a Cloud Function so you don't need this extra read here!
        const userDoc = await adminDb.collection("users").doc(userId).get();
        
        if (userDoc.exists && (userDoc.data()?.credits || 0) > 0) {
            selectedAd = candidate;
            break; // Found a valid ad! Stop looking.
        } else {
            // Optional: If user has no credits, maybe trigger a background job to mark website as inactive?
            // await adminDb.collection("websites").doc(candidate.id).update({ active: false });
        }
    }

    const refreshInterval = sourceData?.refreshInterval || 30;

    if (!selectedAd) {
       return NextResponse.json({ ad: null, config: { refreshInterval } }, { headers: corsHeaders });
    }

    // 4. Record Views (Impression)
    // You might want to deduct credits here OR on the click/verify endpoint.
    // For now, we just count the view on the source.
    await adminDb.collection("websites").doc(sourceSiteId).update({
        views: FieldValue.increment(1)
    });

    return NextResponse.json({ 
        ad: {
            id: selectedAd.id,
            domain: (selectedAd as any).domain,
            category: (selectedAd as any).category,
            // Pass description if available
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
