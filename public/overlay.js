(function () {
  'use strict';

  // Prevent double initialization
  if (window._mmOverlayActive) {
    console.log('[mmmetric] Overlay already active');
    return;
  }
  window._mmOverlayActive = true;

  // Configuration
  var API_BASE = 'https://lckjlefupqlblfcwhbom.supabase.co/functions/v1';
  var DASHBOARD_URL = 'https://mmmetric.lovable.app';

  // Get tracking ID from existing mmmetric script or URL param
  var trackingId = null;
  
  // Try to find from existing mmmetric configuration
  if (window.mmmetric && window.mmmetric.trackingId) {
    trackingId = window.mmmetric.trackingId;
  }
  
  // Try to find from script tag data attribute
  if (!trackingId) {
    var scripts = document.querySelectorAll('script[data-site-id], script[data-tracking-id]');
    scripts.forEach(function(s) {
      if (!trackingId) {
        trackingId = s.getAttribute('data-tracking-id') || s.getAttribute('data-site-id');
      }
    });
  }

  // Try URL parameter as fallback
  if (!trackingId) {
    var urlParams = new URLSearchParams(window.location.search);
    trackingId = urlParams.get('mm_tracking_id');
  }

  // Styles
  var STYLES = '\n    #mm-overlay-container {\n      position: fixed;\n      bottom: 20px;\n      right: 20px;\n      width: 360px;\n      max-height: 80vh;\n      background: #ffffff;\n      border-radius: 12px;\n      box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);\n      z-index: 2147483647;\n      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n      font-size: 14px;\n      color: #1e293b;\n      overflow: hidden;\n      transition: all 0.3s ease;\n    }\n    #mm-overlay-container.mm-minimized {\n      width: 56px;\n      height: 56px;\n      border-radius: 50%;\n      cursor: pointer;\n    }\n    #mm-overlay-container.mm-minimized #mm-overlay-content,\n    #mm-overlay-container.mm-minimized #mm-overlay-header-text {\n      display: none;\n    }\n    #mm-overlay-header {\n      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);\n      color: white;\n      padding: 14px 16px;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      cursor: move;\n    }\n    #mm-overlay-container.mm-minimized #mm-overlay-header {\n      padding: 16px;\n      justify-content: center;\n      border-radius: 50%;\n    }\n    #mm-overlay-logo {\n      width: 24px;\n      height: 24px;\n      background: white;\n      border-radius: 6px;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      font-weight: bold;\n      color: #6366f1;\n      font-size: 12px;\n      flex-shrink: 0;\n    }\n    #mm-overlay-header-text {\n      flex: 1;\n      margin-left: 12px;\n    }\n    #mm-overlay-header-text h3 {\n      margin: 0;\n      font-size: 14px;\n      font-weight: 600;\n    }\n    #mm-overlay-header-text p {\n      margin: 2px 0 0;\n      font-size: 11px;\n      opacity: 0.85;\n    }\n    .mm-header-btn {\n      background: rgba(255,255,255,0.2);\n      border: none;\n      width: 28px;\n      height: 28px;\n      border-radius: 6px;\n      cursor: pointer;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      color: white;\n      font-size: 16px;\n      transition: background 0.2s;\n      margin-left: 6px;\n    }\n    .mm-header-btn:hover {\n      background: rgba(255,255,255,0.3);\n    }\n    #mm-overlay-content {\n      max-height: calc(80vh - 56px);\n      overflow-y: auto;\n    }\n    .mm-stats-grid {\n      display: grid;\n      grid-template-columns: 1fr 1fr;\n      gap: 12px;\n      padding: 16px;\n    }\n    .mm-stat-card {\n      background: #f8fafc;\n      border-radius: 8px;\n      padding: 14px;\n      text-align: center;\n    }\n    .mm-stat-value {\n      font-size: 24px;\n      font-weight: 700;\n      color: #1e293b;\n      line-height: 1.2;\n    }\n    .mm-stat-label {\n      font-size: 11px;\n      color: #64748b;\n      text-transform: uppercase;\n      letter-spacing: 0.5px;\n      margin-top: 4px;\n    }\n    .mm-section {\n      padding: 0 16px 16px;\n    }\n    .mm-section-title {\n      font-size: 11px;\n      font-weight: 600;\n      color: #64748b;\n      text-transform: uppercase;\n      letter-spacing: 0.5px;\n      margin-bottom: 10px;\n    }\n    .mm-page-list {\n      list-style: none;\n      margin: 0;\n      padding: 0;\n    }\n    .mm-page-item {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      padding: 8px 10px;\n      background: #f8fafc;\n      border-radius: 6px;\n      margin-bottom: 6px;\n      font-size: 13px;\n    }\n    .mm-page-item:last-child {\n      margin-bottom: 0;\n    }\n    .mm-page-url {\n      flex: 1;\n      white-space: nowrap;\n      overflow: hidden;\n      text-overflow: ellipsis;\n      color: #475569;\n      margin-right: 8px;\n    }\n    .mm-page-url.mm-current {\n      color: #6366f1;\n      font-weight: 500;\n    }\n    .mm-page-count {\n      font-weight: 600;\n      color: #1e293b;\n      white-space: nowrap;\n    }\n    .mm-period-select {\n      display: flex;\n      gap: 6px;\n      padding: 12px 16px;\n      border-bottom: 1px solid #e2e8f0;\n    }\n    .mm-period-btn {\n      flex: 1;\n      padding: 6px 10px;\n      border: 1px solid #e2e8f0;\n      border-radius: 6px;\n      background: white;\n      font-size: 12px;\n      cursor: pointer;\n      transition: all 0.2s;\n      color: #64748b;\n    }\n    .mm-period-btn:hover {\n      border-color: #6366f1;\n      color: #6366f1;\n    }\n    .mm-period-btn.active {\n      background: #6366f1;\n      border-color: #6366f1;\n      color: white;\n    }\n    .mm-loading {\n      text-align: center;\n      padding: 40px 16px;\n      color: #64748b;\n    }\n    .mm-error {\n      text-align: center;\n      padding: 24px 16px;\n      color: #ef4444;\n    }\n    .mm-footer {\n      padding: 12px 16px;\n      border-top: 1px solid #e2e8f0;\n      text-align: center;\n    }\n    .mm-footer a {\n      color: #6366f1;\n      text-decoration: none;\n      font-size: 12px;\n      font-weight: 500;\n    }\n    .mm-footer a:hover {\n      text-decoration: underline;\n    }\n    .mm-no-tracking {\n      text-align: center;\n      padding: 24px 16px;\n    }\n    .mm-no-tracking p {\n      color: #64748b;\n      margin: 0 0 12px;\n      font-size: 13px;\n    }\n    .mm-setup-btn {\n      background: #6366f1;\n      color: white;\n      border: none;\n      padding: 8px 16px;\n      border-radius: 6px;\n      font-size: 13px;\n      cursor: pointer;\n      font-weight: 500;\n    }\n    .mm-setup-btn:hover {\n      background: #4f46e5;\n    }\n  ';

  // Inject styles
  var styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  // Create container
  var container = document.createElement('div');
  container.id = 'mm-overlay-container';
  
  // Build UI
  function buildUI() {
    container.innerHTML = '\n      <div id="mm-overlay-header">\n        <div id="mm-overlay-logo">M</div>\n        <div id="mm-overlay-header-text">\n          <h3>mmmetric</h3>\n          <p id="mm-site-name">Loading...</p>\n        </div>\n        <button class="mm-header-btn" id="mm-minimize-btn" title="Minimize">−</button>\n        <button class="mm-header-btn" id="mm-close-btn" title="Close">×</button>\n      </div>\n      <div id="mm-overlay-content">\n        <div class="mm-loading">Loading analytics...</div>\n      </div>\n    ';
    document.body.appendChild(container);

    // Event handlers
    document.getElementById('mm-close-btn').onclick = closeOverlay;
    document.getElementById('mm-minimize-btn').onclick = toggleMinimize;
    container.onclick = function(e) {
      if (container.classList.contains('mm-minimized') && e.target.closest('#mm-overlay-header')) {
        toggleMinimize();
      }
    };

    // Make draggable
    makeDraggable(container, document.getElementById('mm-overlay-header'));
  }

  function toggleMinimize() {
    container.classList.toggle('mm-minimized');
  }

  function closeOverlay() {
    container.remove();
    styleEl.remove();
    window._mmOverlayActive = false;
  }

  function makeDraggable(element, handle) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (e.target.closest('button')) return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      var newTop = element.offsetTop - pos2;
      var newLeft = element.offsetLeft - pos1;
      
      // Keep within viewport
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - element.offsetHeight));
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - element.offsetWidth));
      
      element.style.top = newTop + 'px';
      element.style.left = newLeft + 'px';
      element.style.bottom = 'auto';
      element.style.right = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function renderStats(data) {
    var content = document.getElementById('mm-overlay-content');
    var siteName = document.getElementById('mm-site-name');
    
    siteName.textContent = data.site.name || data.site.domain || 'Your Site';

    var currentPath = window.location.pathname;
    var periodLabel = data.period === 'today' ? 'Today' : data.period === '30d' ? 'Last 30 days' : 'Last 7 days';

    var html = '\n      <div class="mm-period-select">\n        <button class="mm-period-btn ' + (data.period === 'today' ? 'active' : '') + '" data-period="today">Today</button>\n        <button class="mm-period-btn ' + (data.period === '7d' ? 'active' : '') + '" data-period="7d">7 Days</button>\n        <button class="mm-period-btn ' + (data.period === '30d' ? 'active' : '') + '" data-period="30d">30 Days</button>\n      </div>\n      <div class="mm-stats-grid">\n        <div class="mm-stat-card">\n          <div class="mm-stat-value">' + formatNumber(data.overall.visitors) + '</div>\n          <div class="mm-stat-label">Visitors</div>\n        </div>\n        <div class="mm-stat-card">\n          <div class="mm-stat-value">' + formatNumber(data.overall.pageviews) + '</div>\n          <div class="mm-stat-label">Pageviews</div>\n        </div>\n      </div>\n    ';

    if (data.currentPage) {
      html += '\n        <div class="mm-section">\n          <div class="mm-section-title">This Page (' + periodLabel + ')</div>\n          <div class="mm-stats-grid" style="padding:0;">\n            <div class="mm-stat-card">\n              <div class="mm-stat-value">' + formatNumber(data.currentPage.visitors) + '</div>\n              <div class="mm-stat-label">Visitors</div>\n            </div>\n            <div class="mm-stat-card">\n              <div class="mm-stat-value">' + data.currentPage.percentage + '%</div>\n              <div class="mm-stat-label">Of Total</div>\n            </div>\n          </div>\n        </div>\n      ';

      if (data.currentPage.topReferrers && data.currentPage.topReferrers.length > 0) {
        html += '\n          <div class="mm-section">\n            <div class="mm-section-title">Top Referrers</div>\n            <ul class="mm-page-list">\n        ';
        data.currentPage.topReferrers.forEach(function(ref) {
          html += '<li class="mm-page-item"><span class="mm-page-url">' + ref.source + '</span><span class="mm-page-count">' + ref.count + '</span></li>';
        });
        html += '</ul></div>';
      }
    }

    if (data.topPages && data.topPages.length > 0) {
      html += '\n        <div class="mm-section">\n          <div class="mm-section-title">Top Pages</div>\n          <ul class="mm-page-list">\n      ';
      data.topPages.slice(0, 5).forEach(function(page) {
        var isCurrent = page.url === currentPath || page.url === window.location.href;
        html += '<li class="mm-page-item"><span class="mm-page-url ' + (isCurrent ? 'mm-current' : '') + '">' + page.url + '</span><span class="mm-page-count">' + formatNumber(page.pageviews) + '</span></li>';
      });
      html += '</ul></div>';
    }

    html += '\n      <div class="mm-footer">\n        <a href="' + DASHBOARD_URL + '/dashboard" target="_blank">Open Full Dashboard →</a>\n      </div>\n    ';

    content.innerHTML = html;

    // Add period button handlers
    content.querySelectorAll('.mm-period-btn').forEach(function(btn) {
      btn.onclick = function() {
        loadStats(btn.dataset.period);
      };
    });
  }

  function renderNoTracking() {
    var content = document.getElementById('mm-overlay-content');
    var siteName = document.getElementById('mm-site-name');
    siteName.textContent = 'Not Configured';

    content.innerHTML = '\n      <div class="mm-no-tracking">\n        <p>No mmmetric tracking detected on this page.</p>\n        <p style="font-size:12px;color:#94a3b8;">Add the tracking script or use ?mm_tracking_id=YOUR_ID</p>\n        <a href="' + DASHBOARD_URL + '/dashboard" target="_blank" class="mm-setup-btn">Get Tracking Code</a>\n      </div>\n    ';
  }

  function renderError(message) {
    var content = document.getElementById('mm-overlay-content');
    content.innerHTML = '<div class="mm-error">' + message + '</div>';
  }

  function loadStats(period) {
    period = period || '7d';
    var content = document.getElementById('mm-overlay-content');
    content.innerHTML = '<div class="mm-loading">Loading analytics...</div>';

    var params = new URLSearchParams({
      tracking_id: trackingId,
      url: window.location.href,
      period: period
    });

    fetch(API_BASE + '/overlay-stats?' + params.toString())
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json();
      })
      .then(function(data) {
        data.period = period;
        renderStats(data);
      })
      .catch(function(err) {
        console.error('[mmmetric] Error loading stats:', err);
        renderError('Failed to load analytics');
      });
  }

  // Initialize
  buildUI();
  
  if (trackingId) {
    loadStats('7d');
  } else {
    renderNoTracking();
  }

})();
