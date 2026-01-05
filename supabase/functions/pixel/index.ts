import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// 1x1 transparent GIF
const PIXEL_GIF = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]);

serve(async (req) => {
    try {
        const url = new URL(req.url);
        const siteId = url.searchParams.get("site_id") || url.searchParams.get("id"); // 'id' for shorter URLs

        // Always return the GIF immediately (or set status 200)
        // We process async to not block
        const response = new Response(PIXEL_GIF, {
            headers: {
                "Content-Type": "image/gif",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Access-Control-Allow-Origin": "*",
            },
        });

        if (!siteId) return response;

        const userAgent = req.headers.get("user-agent") || "";
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
        // Referrer of the IMAGE request is the page where it was embedded
        const referrer = req.headers.get("referer") || "";

        // Generate visitor ID (simplified compared to track function, but consistent)
        const encoder = new TextEncoder();
        const data = encoder.encode(`${clientIp}-${userAgent}`);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const visitorId = hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');

        // Async Insert
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // We try to infer as much as possible, but pixels are limited
        const event = {
            site_id: siteId,
            event_name: "pixel_view", // Distinguish from 'pageview'
            url: referrer || "pixel", // We don't know the exact URL unless passed as param, but referrer helps
            referrer: null, // Hard to know real referrer of the page without JS
            visitor_id: visitorId,
            session_id: `px_${visitorId}_${Date.now()}`, // Generate a session ID
            // Basic Device detection from UA
            browser: getBrowser(userAgent),
            os: getOS(userAgent),
            device_type: getDeviceType(userAgent),
            country: req.headers.get("cf-ipcountry") || null,
        };

        // Fire and forget insert
        supabaseAdmin.from("events").insert(event).then(({ error }) => {
            if (error) console.error("Pixel Insert Error:", error);
        });

        return response;

    } catch (error) {
        console.error("Pixel Error:", error);
        // Still return the GIF so we don't show a broken image
        return new Response(PIXEL_GIF, {
            headers: { "Content-Type": "image/gif" }
        });
    }
});

// Simple User Agent Parsers (Duplicate from track function logic for consistency if possible, or simplified)
function getBrowser(ua: string): string {
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("MSIE") || ua.includes("Trident")) return "IE";
    return "Other";
}

function getOS(ua: string): string {
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "MacOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    return "Other";
}

function getDeviceType(ua: string): string {
    if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return "Mobile";
    if (ua.includes("iPad") || ua.includes("Tablet")) return "Tablet";
    return "Desktop";
}
