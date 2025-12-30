import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing ID", { status: 400 });
  }

  // 1. Detect the actual Ad Server Origin on the server side
  // This ensures API_BASE is always your server, never the publisher's.
  const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://runads.onrender.com";

  const scriptContent = `
(function() {
  const SITE_ID = "${id}";
  const API_BASE = "${API_BASE}"; // Hardcoded correct origin
  const CONTAINER_ID = 'runads-widget-container';

  (function verifyVisit() {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyToken = urlParams.get('runads_verify');

      if (verifyToken) {
          console.log("RunAds: valid token detected, verifying in 3s...");
          
          // Wait 3 seconds to ensure high-quality traffic (not a bot/bounce)
          setTimeout(() => {
              fetch(API_BASE + '/api/ad-verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: verifyToken })
              })
              .then(res => res.json())
              .then(data => {
                  if (data.success) {
                      console.log("RunAds: Visit Verified & Paid ✅");
                      // Remove the ugly token from the URL bar
                      const newUrl = window.location.href.split('?')[0];
                      window.history.replaceState({}, document.title, newUrl);
                  }
              })
              .catch(err => console.error("RunAds Verification Failed", err));
          }, 3000); 
      }
  })();

  // Prevent double loading
  if (document.getElementById(CONTAINER_ID)) return;

  // --- HTML Sanitization Helper ---
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

  // --- Styles ---
  const containerStyle = "position: fixed; bottom: 20px; right: 20px; width: 300px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease; transform: translateY(150%); background: white; pointer-events: none; opacity: 0;";
  
  const btnStyle = "position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; z-index: 2147483646; background: linear-gradient(135deg, #4f46e5, #8b5cf6); border-radius: 50%; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease; transform: scale(0) rotate(-180deg); opacity: 0; pointer-events: none;";

  // --- Create Elements ---
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = containerStyle;

  const minimizedBtn = document.createElement('div');
  minimizedBtn.id = CONTAINER_ID + '-min';
  minimizedBtn.style.cssText = btnStyle;
  minimizedBtn.innerHTML = '<span style="color: white; font-weight: 800; font-family: system-ui, -apple-system, sans-serif; font-size: 28px; line-height: 1;">R</span>';

  // --- State ---
  let refreshTimer = null;
  let currentInterval = 30000;
  let isManuallyClosed = false;

  // --- Actions ---
  function openAd() {
      isManuallyClosed = false;
      minimizedBtn.style.transform = 'scale(0) rotate(-180deg)';
      minimizedBtn.style.opacity = '0';
      minimizedBtn.style.pointerEvents = 'none';

      container.style.transform = 'translateY(0)';
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
  }

  function closeAd() {
      isManuallyClosed = true;

      // ✅ SLEEP: Stop the timer completely
      if (refreshTimer) clearTimeout(refreshTimer);

      container.style.transform = 'translateY(150%)';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      
      minimizedBtn.style.transform = 'scale(1) rotate(0deg)';
      minimizedBtn.style.opacity = '1';
      minimizedBtn.style.pointerEvents = 'auto';
  }

  // --- Event Delegation (Cleaner than setTimeout) ---
  container.addEventListener('click', function(e) {
      // Check if the clicked element (or its parent) is the close button
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
      if (!data || !data.ad) {
          // If no ad is returned, stay hidden (or hide if open)
          container.style.transform = 'translateY(150%)';
          container.style.opacity = '0';
          container.style.pointerEvents = 'none';
          return;
      }

      const ad = data.ad;
      if (data.config && data.config.refreshInterval) {
          currentInterval = data.config.refreshInterval * 1000;
      }

      // Safe rendering using escaped HTML
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

      // UI State Logic
      if (!isManuallyClosed) {
          openAd();
      } else {
          // Keep minimized
          minimizedBtn.style.transform = 'scale(1) rotate(0deg)';
          minimizedBtn.style.opacity = '1';
          minimizedBtn.style.pointerEvents = 'auto';
      }
  }

  function fetchAd() {
    // ✅ SAFETY CHECK: If closed, stop. Do not set a timeout.
    if (isManuallyClosed) return;

    fetch(API_BASE + '/api/ad-serve?id=' + SITE_ID)
      .then(res => res.json())
      .then(data => {
        renderAd(data);
        if (refreshTimer) clearTimeout(refreshTimer);
        
        // Only schedule next fetch if the ad is STILL open
        if (!isManuallyClosed) {
            refreshTimer = setTimeout(fetchAd, currentInterval);
        }
      })
      .catch(err => {
         if (refreshTimer) clearTimeout(refreshTimer);
         // Retry only if still open
         if (!isManuallyClosed) {
             refreshTimer = setTimeout(fetchAd, 60000); 
         }
      });
  }

  // ... existing init logic
  function init() {
    // Create a host element
    const host = document.createElement('div');
    host.id = 'runads-root';
    document.body.appendChild(host);

    // Create shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });
    
    // Append your container and button to the shadow root, not document.body
    shadow.appendChild(container);
    shadow.appendChild(minimizedBtn);
    
    // Note: You will need to update your event listeners to listen within 'shadow', not 'document'
    fetchAd();
  }

  // Fast init: Check if body exists, otherwise wait for DOMContentLoaded (faster than load)
  if (document.body) {
      init();
  } else {
      document.addEventListener('DOMContentLoaded', init);
  }

  

})();
  `;

  
  return new NextResponse(scriptContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=600", 
    },
  });
}
