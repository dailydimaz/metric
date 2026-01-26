// @ts-nocheck
/**
 * mmmetric Analytics - Lightweight Tracking Script
 */
(function () {
    'use strict';

    // Configuration
    const script = document.currentScript || document.querySelector('script[data-site]');
    const siteId = script?.getAttribute('data-site');
    const crossDomains = (script?.getAttribute('data-cross-domain') || '').split(',').map(d => d.trim()).filter(Boolean);

    // API URL derivation
    let apiUrl = script?.getAttribute('data-api');
    if (!apiUrl && script?.src) {
        try {
            const scriptUrl = new URL(script.src);
            if (scriptUrl.hostname.includes('supabase.co') || scriptUrl.hostname.includes('supabase.in')) {
                apiUrl = scriptUrl.origin + '/functions/v1/track';
            } else {
                const supabaseUrl = script.getAttribute('data-supabase-url');
                if (supabaseUrl) apiUrl = supabaseUrl + '/functions/v1/track';
            }
        } catch (e) { }
    }

    if (!siteId || !apiUrl) return;

    // Session
    let sessionId = null;
    let lastActivity = Date.now();
    const SESSION_TIMEOUT = 30 * 60 * 1000;

    const getSessionId = () => {
        const now = Date.now();
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get('_mm_sid');

        if (urlSessionId && !sessionId) {
            sessionId = urlSessionId;
            lastActivity = now;
        }

        if (!sessionId || (now - lastActivity) > SESSION_TIMEOUT) {
            sessionId = Math.random().toString(36).slice(2) + now.toString(36);
        }
        lastActivity = now;
        return sessionId;
    };

    // Utils
    const getUtmParams = () => {
        const params = new URLSearchParams(window.location.search);
        const utm = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
            const val = params.get(key);
            if (val) utm[key] = val;
        });
        return Object.keys(utm).length ? utm : null;
    };

    const getReferrer = () => {
        const ref = document.referrer;
        if (!ref) return null;
        try {
            if (new URL(ref).hostname === window.location.hostname) return null;
            return ref;
        } catch { return null; }
    };

    const track = (eventName, properties) => {
        const utm = getUtmParams();
        const merged = { ...properties };
        if (utm) merged.utm = utm;
        if (window.screen) merged.screen = `${window.screen.width}x${window.screen.height}`;

        const payload = {
            site_id: siteId,
            event_name: eventName || 'pageview',
            url: window.location.pathname,
            referrer: getReferrer(),
            session_id: getSessionId(),
            language: navigator.language || navigator.userLanguage,
            properties: Object.keys(merged).length ? merged : {}
        };

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
            if (!navigator.sendBeacon(apiUrl, blob)) {
                fetch(apiUrl, { method: 'POST', body: JSON.stringify(payload), keepalive: true }).catch(() => { });
            }
        } else {
            fetch(apiUrl, { method: 'POST', body: JSON.stringify(payload), keepalive: true }).catch(() => { });
        }
    };

    // Features
    const setupOutbound = () => {
        document.addEventListener('click', e => {
            const target = e.target.closest('a');
            if (!target?.href) return;

            try {
                const url = new URL(target.href, window.location.origin);
                if (url.hostname !== window.location.hostname) {
                    track('outbound', { href: target.href, text: target.innerText.substring(0, 100) });
                    if (crossDomains.some(d => url.hostname.includes(d))) {
                        target.href += (target.href.includes('?') ? '&' : '?') + '_mm_sid=' + getSessionId();
                    }
                }
            } catch { }
        }, true);
    };

    const setupDownloads = () => {
        const exts = ['.pdf', '.docx', '.xlsx', '.zip', '.rar', '.csv', '.mp3', '.mp4', '.dmg', '.exe', '.pptx', '.jpg', '.png', '.gif', '.svg'];
        document.addEventListener('click', e => {
            const target = e.target.closest('a');
            if (!target?.href) return;
            const lower = target.href.toLowerCase().split('?')[0];
            const ext = exts.find(ex => lower.endsWith(ex));
            if (ext) {
                track('file_download', {
                    href: target.href,
                    filename: target.href.split('/').pop().split('?')[0],
                    extension: ext.substring(1)
                });
            }
        }, true);
    };

    const setupScroll = () => {
        const milestones = [25, 50, 75, 90, 100];
        const sent = {};
        let timeout;

        const check = () => {
            const h = document.documentElement;
            const b = document.body;
            const sh = Math.max(b.scrollHeight, h.scrollHeight, b.offsetHeight, h.offsetHeight, b.clientHeight, h.clientHeight);
            const st = window.pageYOffset || h.scrollTop;
            const ch = window.innerHeight || h.clientHeight;

            if (sh <= ch) {
                if (!sent[100]) { sent[100] = true; track('scroll_depth', { percent: 100, url: window.location.pathname }); }
                return;
            }

            const pct = Math.min(100, Math.round(((st + ch) / sh) * 100));
            milestones.forEach(m => {
                if (pct >= m && !sent[m]) {
                    sent[m] = true;
                    track('scroll_depth', { percent: m, url: window.location.pathname });
                }
            });
        };

        window.addEventListener('scroll', () => {
            clearTimeout(timeout);
            timeout = setTimeout(check, 200);
        });
        setTimeout(check, 1000);
    };

    // SPA & Engagement
    let lastPath = window.location.pathname;
    let startTime = Date.now();
    let engaged = false;

    const sendEngagement = () => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        if (duration >= 5 && duration < 86400) {
            track('engagement', { duration_seconds: duration, url: lastPath });
            engaged = true;
        }
    };

    const handleNav = () => {
        if (window.location.pathname !== lastPath) {
            sendEngagement();
            lastPath = window.location.pathname;
            startTime = Date.now();
            engaged = false;
            track('pageview');
        }
    };

    if (window.history.pushState) {
        const oPush = window.history.pushState;
        window.history.pushState = function () { oPush.apply(this, arguments); handleNav(); };
        window.addEventListener('popstate', handleNav);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) sendEngagement();
        else { startTime = Date.now(); engaged = false; }
    });
    window.addEventListener('pagehide', sendEngagement);
    setInterval(() => {
        if (!document.hidden && !engaged && (Date.now() - startTime) > 30000) {
            sendEngagement();
            startTime = Date.now();
            engaged = false;
        }
    }, 30000);

    // Forms
    const setupForms = () => {
        const active = new Set();
        document.addEventListener('focusin', e => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                const form = e.target.form;
                if (form && !active.has(form)) {
                    active.add(form);
                    track('form_start', { form_id: form.id || form.name || 'unknown' });
                }
            }
        }, true);

        document.addEventListener('submit', e => {
            const form = e.target;
            if (form?.tagName === 'FORM') {
                active.delete(form);
                track('form_submit', { form_id: form.id || form.name || 'unknown' });
            }
        }, true);
    };

    // Vitals
    const setupVitals = () => {
        if (typeof PerformanceObserver === 'function') {
            const send = (m, v) => track('web_vitals', { metric: m, value: m === 'CLS' ? v : Math.round(v), rating: v > (m === 'LCP' ? 2500 : m === 'CLS' ? 0.1 : 200) ? 'poor' : 'good' }); // Simplified rating logic for space

            try {
                new PerformanceObserver(l => {
                    const e = l.getEntries().pop();
                    if (e) window._mm_lcp = e.startTime;
                }).observe({ type: 'largest-contentful-paint', buffered: true });

                window._mm_cls = 0;
                new PerformanceObserver(l => {
                    l.getEntries().forEach(e => { if (!e.hadRecentInput) window._mm_cls += e.value; });
                }).observe({ type: 'layout-shift', buffered: true });

                window._mm_inp = 0;
                new PerformanceObserver(l => {
                    l.getEntries().forEach(e => { if (e.interactionId && e.duration > window._mm_inp) window._mm_inp = e.duration; });
                }).observe({ type: 'event', durationThreshold: 16, buffered: true });

                const report = () => {
                    if (window._mm_lcp !== undefined) send('LCP', window._mm_lcp);
                    if (window._mm_cls !== undefined) send('CLS', window._mm_cls);
                    if (window._mm_inp !== undefined && window._mm_inp > 0) send('INP', window._mm_inp);
                };
                window.addEventListener('visibilitychange', () => { if (document.hidden) report(); });
                window.addEventListener('pagehide', report);
            } catch (e) { }
        }
    };

    // Config injection (simplified)
    const fetchConfig = () => {
        fetch(apiUrl.replace('/track', '/get-config'), {
            method: 'POST',
            body: JSON.stringify({ site_id: siteId }),
            headers: { 'Content-Type': 'application/json' }
        }).then(r => r.json()).then(d => {
            if (d.tags) d.tags.forEach(t => {
                try {
                    if (t.type === 'custom_script' && t.config.url) {
                        const s = document.createElement('script'); s.src = t.config.url; s.async = true; document.head.appendChild(s);
                    }
                    // ... other tags omitted for size, add back if critical
                } catch (e) { }
            });
        }).catch(() => { });
    };

    const init = () => {
        track('pageview');
        setupOutbound();
        setupDownloads();
        setupScroll();
        setupForms();
        setupVitals();
        fetchConfig();
        setTimeout(() => {
            if (document.title.toLowerCase().includes('404')) track('404', { url: window.location.href, referrer: document.referrer });
        }, 1000);
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);

})();
