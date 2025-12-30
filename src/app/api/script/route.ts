import { NextRequest, NextResponse } from "next/server";
import { minify } from "terser";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("console.error('RunAds: Missing ID');", { 
        status: 400,
        headers: { "Content-Type": "application/javascript" }
    });
  }

  const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://runads.onrender.com";

  // The raw script code
  const rawScript = `
(function() {
  console.log("RunAds: Script initializing for Site ID:", "${id}");
  const SITE_ID = "${id}";
  const API_BASE = "${API_BASE}";
  const CONTAINER_ID = 'runads-widget-container';

  (function verifyVisit() {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyToken = urlParams.get('runads_verify');

      if (verifyToken) {
          console.log("RunAds: Verification token found, processing...");
          setTimeout(() => {
              fetch(API_BASE + '/api/ad-verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: verifyToken })
              })
              .then(res => res.json())
              .then(data => {
                  if (data.success) {
                      console.log("RunAds: Visit verified successfully.");
                      const newUrl = window.location.href.split('?')[0];
                      window.history.replaceState({}, document.title, newUrl);
                  } else {
                      console.warn("RunAds: Verification failed:", data.error);
                  }
              })
              .catch(err => console.error("RunAds Verification Failed", err));
          }, 3000); 
      }
  })();

  if (document.getElementById(CONTAINER_ID)) {
      console.warn("RunAds: Widget already exists, skipping initialization.");
      return;
  }

  function escapeHTML(str) {
      if (!str) return '';
      return str.replace(/[&<>'"]/g, 
          tag => ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              "'": '&#39;',
              '"': '&quot;'
          }[tag]));
  }

  const containerStyle = "position: fixed; bottom: 20px; right: 20px; width: 300px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease; transform: translateY(150%); background: white; pointer-events: none; opacity: 0;";
  
  const btnStyle = "position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; z-index: 2147483646; background: linear-gradient(135deg, #4f46e5, #8b5cf6); border-radius: 50%; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease; transform: scale(0) rotate(-180deg); opacity: 0; pointer-events: none;";

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = containerStyle;

  const minimizedBtn = document.createElement('div');
  minimizedBtn.id = CONTAINER_ID + '-min';
  minimizedBtn.style.cssText = btnStyle;
  minimizedBtn.innerHTML = '<span style="color: white; font-weight: 800; font-family: system-ui, -apple-system, sans-serif; font-size: 28px; line-height: 1;">R</span>';

  let refreshTimer = null;
  let currentInterval = 30000;
  let isManuallyClosed = false;

  function openAd() {
      console.log("RunAds: Opening ad widget.");
      isManuallyClosed = false;
      minimizedBtn.style.transform = 'scale(0) rotate(-180deg)';
      minimizedBtn.style.opacity = '0';
      minimizedBtn.style.pointerEvents = 'none';

      container.style.transform = 'translateY(0)';
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
  }

  function closeAd() {
      console.log("RunAds: User closed ad widget.");
      isManuallyClosed = true;
      if (refreshTimer) clearTimeout(refreshTimer);

      container.style.transform = 'translateY(150%)';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      
      minimizedBtn.style.transform = 'scale(1) rotate(0deg)';
      minimizedBtn.style.opacity = '1';
      minimizedBtn.style.pointerEvents = 'auto';
  }

  container.addEventListener('click', function(e) {
      if (e.target.closest('#runads-close-btn')) {
          e.preventDefault();
          e.stopPropagation();
          closeAd();
      }
  });

  minimizedBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openAd();
      fetchAd(); 
  });

  function renderAd(data) {
      if (!data) {
          console.error("RunAds: No data received for renderAd.");
          return;
      }

      if (data.config?.disabled) {
          console.log("RunAds: Ads disabled by publisher config.");
          container.style.transform = 'translateY(150%)';
          container.style.opacity = '0';
          container.style.pointerEvents = 'none';
          return;
      }

      if (!data.ad) {
          console.log("RunAds: No ads available to fill request.");
          container.style.transform = 'translateY(150%)';
          container.style.opacity = '0';
          container.style.pointerEvents = 'none';
          return;
      }

      const ad = data.ad;
      console.log("RunAds: Rendering ad for domain:", ad.domain);

      if (data.config && data.config.refreshInterval) {
          currentInterval = data.config.refreshInterval * 1000;
      }

      container.innerHTML = \`
        <div style="pointer-events: auto; position: relative; display: flex; flex-direction: column;">
          
          <a href="\${API_BASE}/api/click?id=\${SITE_ID}&target=\${escapeHTML(ad.id)}" target="_blank" rel="noopener" style="text-decoration: none; color: inherit; display: block; flex-grow: 1;">
            
            <div style="background: linear-gradient(135deg, #4f46e5, #8b5cf6); padding: 12px; display: flex; align-items: center; justify-content: space-between;">
               <div style="display: flex; align-items: center; gap: 6px;">
                 <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; color: white; font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Ad</span>
                 <span style="color: white; font-weight: 600; font-size: 13px;">RunAds Network</span>
               </div>
               <div id="runads-close-btn" style="color: rgba(255,255,255,0.8); cursor: pointer; padding: 4px; line-height: 1; font-size: 18px; border-radius: 4px; transition: color 0.2s; z-index: 10;">&times;</div>
            </div>

            <div style="padding: 16px; background: #fff;">
               <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 16px; font-weight: 700; line-height: 1.4;">\${escapeHTML(ad.domain)}</h3>
               <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">\${escapeHTML(ad.description || 'Best for website traffic')}</p>
            </div>
          </a>

          <div style="padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
             <span style="color: #94a3b8; font-size: 11px;">
               Powered by <a href="https://runads.onrender.com" target="_blank" rel="noopener" style="color: #94a3b8; text-decoration: underline;">RunAds</a>
             </span>
             <a href="\${API_BASE}/api/click?id=\${SITE_ID}&target=\${escapeHTML(ad.id)}" target="_blank" rel="noopener" style="color: #4f46e5; font-size: 12px; font-weight: 600; text-decoration: none;">Visit Site &rarr;</a>
          </div>

        </div>
      \`;

      if (!isManuallyClosed) {
          openAd();
      } else {
          minimizedBtn.style.transform = 'scale(1) rotate(0deg)';
          minimizedBtn.style.opacity = '1';
          minimizedBtn.style.pointerEvents = 'auto';
      }
  }

  function fetchAd() {
    if (isManuallyClosed) return;

    console.log("RunAds: Fetching ad from server...");
    fetch(API_BASE + '/api/ad-serve?id=' + SITE_ID)
      .then(res => res.json())
      .then(data => {
        renderAd(data);
        if (refreshTimer) clearTimeout(refreshTimer);
        
        if (!isManuallyClosed && !data.config?.disabled) {
            console.log("RunAds: Scheduling next refresh in " + (currentInterval / 1000) + "s");
            refreshTimer = setTimeout(fetchAd, currentInterval);
        }
      })
      .catch(err => {
         console.error("RunAds: Failed to fetch ad", err);
         if (refreshTimer) clearTimeout(refreshTimer);
         if (!isManuallyClosed) {
             refreshTimer = setTimeout(fetchAd, 60000); 
         }
      });
  }

  function init() {
    console.log("RunAds: Creating Shadow DOM...");
    const host = document.createElement('div');
    host.id = 'runads-root';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    
    shadow.appendChild(container);
    shadow.appendChild(minimizedBtn);
    
    fetchAd();
  }

  if (document.body) {
      init();
  } else {
      document.addEventListener('DOMContentLoaded', init);
  }

})();
  `;

  try {
      // Minify and obfuscate
      const result = await minify(rawScript, {
          mangle: {
              toplevel: true, // Mangle top-level variable names
          },
          compress: {
              drop_console: false, // Keep console logs
          }
      });

      return new NextResponse(result.code || rawScript, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=600", 
        },
      });
  } catch (err) {
      console.error("Minification Error:", err);
      // Fallback to raw script if minification fails
      return new NextResponse(rawScript, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=600", 
        },
      });
  }
}
