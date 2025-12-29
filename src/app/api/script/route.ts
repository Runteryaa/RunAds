import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing ID", { status: 400 });
  }

  const scriptContent = `
(function() {
  const SITE_ID = "${id}";
  // Dynamically detect base URL from script tag or fallback
  let API_BASE = "";
  try {
     const scripts = document.getElementsByTagName('script');
     for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('/api/script')) {
            const url = new URL(scripts[i].src);
            API_BASE = url.origin;
            break;
        }
     }
  } catch(e) { console.error("RunAds origin detect failed", e); }
  
  if (!API_BASE) API_BASE = "${process.env.NEXT_PUBLIC_BASE_URL || 'https://runads-demo.web.app'}"; // Fallback

  // Unique container ID to prevent duplicates
  const CONTAINER_ID = 'runads-widget-container';

  // Prevent double loading
  if (document.getElementById(CONTAINER_ID)) {
      console.log("RunAds already loaded");
      return;
  }

  // Create container
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = "position: fixed; bottom: 20px; right: 20px; width: 300px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translateY(150%); background: white; pointer-events: none; opacity: 0;";
  
  let refreshTimer = null;
  let currentInterval = 30000;

  function closeAd() {
      container.style.transform = 'translateY(150%)';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
  }

  function renderAd(data) {
      if (!data || !data.ad) {
          closeAd();
          return;
      }

      const ad = data.ad;
      // Update config if present
      if (data.config && data.config.refreshInterval) {
          currentInterval = data.config.refreshInterval * 1000;
      }

      container.innerHTML = \`
        <div style="pointer-events: auto; position: relative;">
          <a href="\${API_BASE}/api/click?id=\${SITE_ID}&target=\${ad.id}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
            <div style="background: linear-gradient(135deg, #4f46e5, #8b5cf6); padding: 12px; display: flex; align-items: center; justify-content: space-between;">
               <div style="display: flex; align-items: center; gap: 6px;">
                 <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; color: white; font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Ad</span>
                 <span style="color: white; font-weight: 600; font-size: 13px;">RunAds Network</span>
               </div>
               <div id="runads-close-btn" style="color: rgba(255,255,255,0.8); cursor: pointer; padding: 4px; line-height: 1; font-size: 18px; border-radius: 4px;">&times;</div>
            </div>
            <div style="padding: 16px; background: #fff;">
               <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 16px; font-weight: 700; line-height: 1.4;">\${ad.domain}</h3>
               <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">Check out this website in the \${ad.category} category.</p>
            </div>
            <div style="padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
               <span style="color: #94a3b8; font-size: 11px;">Powered by RunAds</span>
               <span style="color: #4f46e5; font-size: 12px; font-weight: 600;">Visit Site &rarr;</span>
            </div>
          </a>
        </div>
      \`;

      // Re-attach close event because innerHTML wiped it
      setTimeout(() => {
          const btn = document.getElementById('runads-close-btn');
          if (btn) {
              btn.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeAd();
              };
          }
      }, 0);
      
      // Animate In
      container.style.transform = 'translateY(0)';
      container.style.opacity = '1';
  }

  function fetchAd() {
    fetch(API_BASE + '/api/ad-serve?id=' + SITE_ID)
      .then(res => res.json())
      .then(data => {
        renderAd(data);
        // Schedule next fetch
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(fetchAd, currentInterval);
      })
      .catch(err => {
          console.error('RunAds Error:', err);
          // Retry later on error
          if (refreshTimer) clearTimeout(refreshTimer);
          refreshTimer = setTimeout(fetchAd, 60000); 
      });
  }

  function init() {
      document.body.appendChild(container);
      fetchAd();
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

})();
  `;

  return new NextResponse(scriptContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
