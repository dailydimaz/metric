import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 1x1 Transparent GIF
const GIF_BUFFER = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]);

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const params = url.searchParams;

        // Extract parameters
        const site_id = params.get('site_id');
        const pageUrl = params.get('url') || '/';
        const referrer = params.get('ref') || null;
        const event_name = params.get('event') || 'pageview';

        // Basic validation
        if (!site_id) {
            // Even on error, return the GIF to avoid broken image icons on client
            return new Response(GIF_BUFFER, {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "image/gif",
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            });
        }

        // Capture requester info
        const userAgent = req.headers.get('user-agent') || '';
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const cfCountry = req.headers.get('cf-ipcountry') || null;
        const cfCity = req.headers.get('cf-ipcity') || null;

        // Generate simple IDs (since this is lightweight tracking)
        // For robust fingerprinting, we'd reuse the logic from the main track function
        // ensuring we import it or duplicate safely.
        // Here we'll do a simplified version for the pixel.

        const visitor_id = await generateVisitorId(ip, userAgent);
        const session_id = `${visitor_id}-${Date.now()}`;

        // Initialize Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify site exists
        const { data: site } = await supabase
            .from('sites')
            .select('id')
            .eq('tracking_id', site_id)
            .maybeSingle();

        if (site) {
            // Record event
            await supabase.from('events').insert({
                site_id: site.id,
                event_name,
                url: pageUrl,
                referrer,
                visitor_id,
                session_id,
                browser: parseBrowser(userAgent),
                os: parseOS(userAgent),
                device_type: parseDevice(userAgent),
                country: cfCountry,
                city: cfCity,
                properties: { type: 'pixel' }
            });
        }

        // Always return GIF
        return new Response(GIF_BUFFER, {
            headers: {
                ...corsHeaders,
                "Content-Type": "image/gif",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        });

    } catch (error) {
        console.error('Pixel error:', error);
        // Return GIF even on error
        return new Response(GIF_BUFFER, {
            headers: {
                ...corsHeaders,
                "Content-Type": "image/gif",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        });
    }
});

// Helper functions (simplified from track/index.ts)
async function generateVisitorId(ip: string, ua: string): Promise<string> {
    const str = `${ip}-${ua}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseBrowser(ua: string): string {
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    return 'Unknown';
}

function parseOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
}

function parseDevice(ua: string): string {
    if (ua.includes('Mobile') || ua.includes('Android')) return 'mobile';
    if (ua.includes('Tablet') || ua.includes('iPad')) return 'tablet';
    return 'desktop';
}
