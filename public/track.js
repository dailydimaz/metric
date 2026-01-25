/**
 * mmmetric Analytics - Lightweight Tracking Script
 * Privacy-focused, cookie-less analytics with UTM and outbound tracking
 * 
 * Usage: 
 *   <script defer src="https://your-instance.com/track.js" 
 *           data-site="YOUR_TRACKING_ID" 
 *           data-api="https://your-supabase.co/functions/v1/track"></script>
 * 
 * The data-api attribute is required and should point to your Supabase Edge Function URL.
 * 
 * Pixel tracking:
 *   <img src="https://your-supabase.co/functions/v1/pixel?site_id=YOUR_TRACKING_ID" alt="" />
 */
(function () {
  'use strict';

  // Configuration
  var script = document.currentScript || document.querySelector('script[data-site]');
  var siteId = script && script.getAttribute('data-site');
  var crossDomains = (script && script.getAttribute('data-cross-domain') || '').split(',').map(function (d) { return d.trim(); }).filter(Boolean);

  // Get API URL from data-api attribute (required for self-hosted instances)
  var apiUrl = script && script.getAttribute('data-api');

  // If no explicit API URL, try to derive from script source
  if (!apiUrl && script && script.src) {
    try {
      var scriptUrl = new URL(script.src);
      // Check if script is served from a Supabase functions URL
      if (scriptUrl.hostname.includes('supabase.co') || scriptUrl.hostname.includes('supabase.in')) {
        // Script is on Supabase, use same origin for track endpoint
        apiUrl = scriptUrl.origin + '/functions/v1/track';
      } else {
        // Script is on app domain, look for data-supabase-url attribute
        var supabaseUrl = script.getAttribute('data-supabase-url');
        if (supabaseUrl) {
          apiUrl = supabaseUrl + '/functions/v1/track';
        }
      }
    } catch (e) {
      console.warn('mmmetric: Could not parse script URL');
    }
  }

  // Debug logging (can be removed in production)
  console.log('mmmetric: Initializing with site ID:', siteId);

  if (!siteId) {
    console.warn('mmmetric: Missing data-site attribute. Add data-site="YOUR_TRACKING_ID" to the script tag.');
    return;
  }

  if (!apiUrl) {
    console.warn('mmmetric: Missing data-api attribute. Add data-api="https://your-supabase.co/functions/v1/track" to the script tag.');
    return;
  }

  // Validate site ID format
  if (typeof siteId !== 'string' || !siteId.startsWith('st_')) {
    console.warn('mmmetric: Invalid site ID format. Expected format: st_xxxxxxxxxxxx');
    return;
  }

  // Respect Do Not Track
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    console.warn('mmmetric: Do Not Track is enabled; tracking is disabled in this browser.');
    return;
  }

  // Session management (in-memory, no cookies)
  var sessionId = null;
  var lastActivity = Date.now();
  var SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  function getSessionId() {
    var now = Date.now();

    // Check for session in URL params (Cross-domain tracking)
    var params = new URLSearchParams(window.location.search);
    var urlSessionId = params.get('_mm_sid');

    if (urlSessionId && !sessionId) {
      sessionId = urlSessionId;
      lastActivity = now;
    }

    if (!sessionId || (now - lastActivity) > SESSION_TIMEOUT) {
      sessionId = Math.random().toString(36).substring(2) + now.toString(36);
    }
    lastActivity = now;
    return sessionId;
  }

  // Parse UTM parameters from URL
  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    var utm = {};
    var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    utmKeys.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        utm[key] = value;
      }
    });

    return Object.keys(utm).length > 0 ? utm : null;
  }

  // Get referrer (clean it up)
  function getReferrer() {
    var ref = document.referrer;
    if (!ref) return null;
    try {
      var refUrl = new URL(ref);
      // Ignore same-origin referrers
      if (refUrl.hostname === window.location.hostname) return null;
      return ref;
    } catch (e) {
      return null;
    }
  }

  // Get current URL (without query params for privacy, unless needed)
  function getCurrentUrl() {
    // We strip query params to protect PII, but we could optionally keep them
    return window.location.pathname;
  }

  // Send event to API
  function track(eventName, properties) {
    var utm = getUtmParams();
    var mergedProperties = Object.assign({}, properties || {});


    // Include UTM params in properties if present
    if (utm) {
      mergedProperties.utm = utm;
    }

    // Add screen resolution to properties
    if (window.screen) {
      mergedProperties.screen = window.screen.width + 'x' + window.screen.height;
    }

    var payload = {
      site_id: siteId,
      event_name: eventName || 'pageview',
      url: getCurrentUrl(),
      referrer: getReferrer(),
      session_id: getSessionId(), // Ensure session ID is active/generated
      language: navigator.language || navigator.userLanguage,
      properties: Object.keys(mergedProperties).length > 0 ? mergedProperties : {}
    };

    console.log('mmmetric: Sending event:', eventName, 'to', apiUrl);

    // Use sendBeacon if available for reliability
    // Use text/plain to avoid CORS preflight (simple request)
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
      var result = navigator.sendBeacon(apiUrl, blob);
      console.log('mmmetric: sendBeacon result:', result);

      // Some browsers/extensions can cause sendBeacon to return false.
      // Fall back to fetch to maximize delivery reliability.
      if (!result) {
        fetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify(payload),
          keepalive: true
        }).then(function (res) {
          console.log('mmmetric: fetch fallback result:', res.status);
        }).catch(function (err) {
          console.error('mmmetric: fetch fallback error:', err);
        });
      }
    } else {
      // Fallback to fetch without Content-Type to avoid preflight
      fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true
      }).then(function (res) {
        console.log('mmmetric: fetch result:', res.status);
      }).catch(function (err) {
        console.error('mmmetric: fetch error:', err);
      });
    }
  }

  // Track pageview
  function trackPageview() {
    track('pageview');
  }

  // Track outbound links automatically
  function setupOutboundTracking() {
    document.addEventListener('click', function (e) {
      var target = e.target;

      // Find closest anchor element
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target || target.tagName !== 'A') return;

      var href = target.getAttribute('href');
      if (!href) return;

      try {
        var url = new URL(href, window.location.origin);

        // Check if it's an outbound link
        if (url.hostname !== window.location.hostname) {
          // Track the click
          track('outbound', {
            href: href,
            text: target.innerText.substring(0, 100)
          });

          // Cross-domain linking
          if (crossDomains.length > 0 && crossDomains.some(function (d) { return url.hostname.includes(d); })) {
            // Append session ID to the URL
            // We use separator based on existing query params
            var separator = href.includes('?') ? '&' : '?';
            target.setAttribute('href', href + separator + '_mm_sid=' + getSessionId());
          }
        }
      } catch (e) {
        // Invalid URL, ignore
      }
    }, true);
  }

  // Track file downloads
  function setupFileDownloadTracking() {
    var extensions = ['.pdf', '.docx', '.xlsx', '.zip', '.rar', '.csv', '.mp3', '.mp4', '.dmg', '.exe', '.pptx', '.jpg', '.png', '.gif', '.svg'];

    document.addEventListener('click', function (e) {
      var target = e.target;

      // Find closest anchor element
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target || target.tagName !== 'A') return;

      var href = target.getAttribute('href');
      if (!href) return;

      // Check for extensions
      var lowerHref = href.toLowerCase().split('?')[0]; // Remove query params for check
      var ext = extensions.find(function (ex) { return lowerHref.endsWith(ex); });

      if (ext) {
        var filename = href.split('/').pop().split('?')[0] || 'details';

        track('file_download', {
          href: href,
          filename: filename,
          extension: ext.replace('.', '')
        });
      }
    }, true);
  }

  // Track scroll depth
  function setupScrollTracking() {
    var milestones = [25, 50, 75, 90, 100];
    var sent = {};
    var cleanup = null;

    function handleScroll() {
      var scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
      var url = window.location.pathname; // Store locally to check against current page

      milestones.forEach(function (milestone) {
        if (scrollPercent >= milestone && !sent[milestone]) {
          sent[milestone] = true;
          track('scroll_depth', {
            percent: milestone,
            url: url
          });
        }
      });
    }

    // Debounce scroll event
    var timeout;
    function debouncedScroll() {
      clearTimeout(timeout);
      timeout = setTimeout(handleScroll, 200);
    }

    // Reset on navigation
    function reset() {
      sent = {};
    }

    // Hook into existing navigation handler if possible, or just observe location
    // Since we have SPA support via pushState override above, we can piggyback or add a new listener.
    // The verify simple way is to reset 'sent' when URL changes.
    var lastUrl = window.location.pathname;

    // We'll use a MutationObserver or just check on scroll if URL changed (simple)
    // Or we rely on the handleNavigation we defined earlier? 
    // Let's hook into the global navigation handling we essentially did with pushState/popstate.
    // But since that logic is inside init() scope (or global IIFE scope), we can just add a check inside debouncedScroll

    function checkUrl() {
      if (window.location.pathname !== lastUrl) {
        lastUrl = window.location.pathname;
        reset();
      }
    }

    window.addEventListener('scroll', function () {
      checkUrl();
      debouncedScroll();
    });

    // Also reset on initial load? No, it's empty.
  }

  // Track 404 errors
  function track404() {
    // Check if page might be a 404
    if (document.title.toLowerCase().includes('404') ||
      document.title.toLowerCase().includes('not found')) {
      track('404', {
        url: window.location.href,
        referrer: document.referrer
      });
    }
  }

  // Handle SPA navigation
  var lastPath = window.location.pathname;

  function handleNavigation() {
    var currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      trackPageview();
    }
  }

  // Listen for history changes (SPA support)
  if (window.history && window.history.pushState) {
    var originalPushState = window.history.pushState;
    window.history.pushState = function () {
      originalPushState.apply(this, arguments);
      handleNavigation();
    };

    var originalReplaceState = window.history.replaceState;
    window.history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      handleNavigation();
    };

    window.addEventListener('popstate', handleNavigation);
  }

  // Track Core Web Vitals
  function measureWebVitals() {
    function getRating(metric, value) {
      if (metric === 'LCP') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      if (metric === 'CLS') return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      if (metric === 'INP') return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
      return 'unknown';
    }

    function sendVital(metric, value) {
      // Round values for consistency
      var val = metric === 'CLS' ? Math.round(value * 1000) / 1000 : Math.round(value);

      track('web_vitals', {
        metric: metric,
        value: val,
        rating: getRating(metric, value)
      });
    }

    if (typeof PerformanceObserver === 'function') {
      // LCP
      try {
        new PerformanceObserver(function (entryList) {
          var entries = entryList.getEntries();
          var lastEntry = entries[entries.length - 1];
          // Determine when to report (simplified: just keep updating locally, report on visibility hidden could be complex without library)
          // For simplicity in this lightweight script, we'll report the candidate on pagehide
          if (lastEntry) {
            window._mm_lcp = lastEntry.startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) { }

      // CLS
      try {
        window._mm_cls = 0;
        new PerformanceObserver(function (entryList) {
          entryList.getEntries().forEach(function (entry) {
            if (!entry.hadRecentInput) {
              window._mm_cls += entry.value;
            }
          });
        }).observe({ type: 'layout-shift', buffered: true });
      } catch (e) { }

      // INP (Simplified: observing long interactions)
      try {
        window._mm_inp = 0;
        new PerformanceObserver(function (entryList) {
          entryList.getEntries().forEach(function (entry) {
            if (entry.interactionId && entry.duration > window._mm_inp) {
              window._mm_inp = entry.duration;
            }
          });
        }).observe({ type: 'event', durationThreshold: 16, buffered: true });
      } catch (e) { }

      // Report on page hide / unload
      var reported = false;
      function reportMetrics() {
        if (reported) return;
        reported = true;

        if (window._mm_lcp !== undefined) sendVital('LCP', window._mm_lcp);
        if (window._mm_cls !== undefined) sendVital('CLS', window._mm_cls);
        if (window._mm_inp !== undefined && window._mm_inp > 0) sendVital('INP', window._mm_inp);
      }

      window.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
          reportMetrics();
        }
      });

      // Safari support for pagehide
      window.addEventListener('pagehide', reportMetrics);
    }
  }

  // Initialize tracking
  function init() {
    trackPageview();
    setupOutboundTracking();
    setupFileDownloadTracking();
    setupScrollTracking();
    setupEngagementTracking();
    setupFormTracking();
    measureWebVitals();

    // Delay 404 check to allow page to fully load
    setTimeout(track404, 1000);
  }

  // Track initial pageview
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

  // Expose track function globally for custom events
  window.mmmetric = {
    track: function (eventName, properties) {
      track(eventName, properties);
    },
    // Optional: identify users (stores in sessionStorage)
    identify: function (userId) {
      if (userId) {
        try {
          sessionStorage.setItem('mmmetric_user_id', userId);
        } catch (e) { }
      }
    }
  };
})();
