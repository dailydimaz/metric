import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to extract domain from origin/referer
function extractDomain(url: string | null): string | null {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

// Helper to verify origin matches site domain or is a trusted platform domain
function verifyOrigin(origin: string | null, referer: string | null, siteDomain: string): boolean {
    const normalizedSiteDomain = siteDomain.replace(/^www\./, '').toLowerCase();
    
    const originDomain = extractDomain(origin);
    const refererDomain = extractDomain(referer);
    
    // Check origin header first
    if (originDomain && originDomain.toLowerCase() === normalizedSiteDomain) {
        return true;
    }
    
    // Fall back to referer
    if (refererDomain && refererDomain.toLowerCase() === normalizedSiteDomain) {
        return true;
    }
    
    // Allow localhost for development
    if (originDomain === 'localhost' || refererDomain === 'localhost') {
        return true;
    }
    
    // Allow Lovable preview and published domains (for testing and demo purposes)
    const trustedDomains = [
        'lovable.app',
        'lovableproject.com',
        'lovable.dev'
    ];
    
    const checkTrusted = (domain: string | null): boolean => {
        if (!domain) return false;
        return trustedDomains.some(trusted => 
            domain === trusted || domain.endsWith('.' + trusted)
        );
    };
    
    if (checkTrusted(originDomain) || checkTrusted(refererDomain)) {
        return true;
    }
    
    return false;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { site_id } = await req.json();

        if (!site_id) {
            throw new Error("site_id is required");
        }

        // Fetch site UUID and domain from tracking_id
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .select('id, domain, custom_css')
            .eq('tracking_id', site_id)
            .single();

        if (siteError || !site) {
            return new Response(JSON.stringify({ error: "Site not found" }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Security: Verify request origin matches site domain
        const origin = req.headers.get("origin");
        const referer = req.headers.get("referer");
        
        if (!verifyOrigin(origin, referer, site.domain)) {
            console.warn(`Origin mismatch: origin=${origin}, referer=${referer}, expected=${site.domain}`);
            return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Now fetch tags using UUID
        const { data: validTags } = await supabase
            .from('tags')
            .select('type, config')
            .eq('site_id', site.id)
            .eq('is_enabled', true)
            .order('load_priority', { ascending: true });


        // 2. Get Active Experiments
        const { data: experiments } = await supabase
            .from('experiments')
            .select('id, name, variants:experiment_variants(id, name, config, weight)')
            .eq('site_id', site.id)
            .eq('status', 'active');

        return new Response(JSON.stringify({
            tags: validTags || [],
            experiments: experiments || [],
            visual: {
                custom_css: site.custom_css
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
