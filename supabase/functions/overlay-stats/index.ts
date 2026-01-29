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
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const trackingId = url.searchParams.get("tracking_id");
  const pageUrl = url.searchParams.get("url");
  const period = url.searchParams.get("period") || "7d"; // 7d, 30d, today

  if (!trackingId) {
    return new Response(JSON.stringify({ error: "tracking_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Look up site by tracking_id
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, name, domain")
      .eq("tracking_id", trackingId)
      .single();

    if (siteError || !site) {
      console.error("Site not found:", siteError);
      return new Response(JSON.stringify({ error: "Site not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Security: Verify request origin matches site domain
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    
    if (!verifyOrigin(origin, referer, site.domain)) {
      console.warn(`Origin mismatch: origin=${origin}, referer=${referer}, expected=${site.domain}`);
      return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "7d":
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    // Build base query conditions
    const siteId = site.id;
    const startDateStr = startDate.toISOString();

    // Get overall site stats
    const { data: overallStats, error: overallError } = await supabase
      .from("events")
      .select("id, visitor_id", { count: "exact" })
      .eq("site_id", siteId)
      .eq("event_name", "pageview")
      .gte("created_at", startDateStr);

    if (overallError) {
      console.error("Error fetching overall stats:", overallError);
    }

    const totalPageviews = overallStats?.length || 0;
    const uniqueVisitors = new Set(overallStats?.map(e => e.visitor_id).filter(Boolean)).size;

    // Get page-specific stats if URL provided
    let pageStats = null;
    if (pageUrl) {
      // Normalize URL for matching
      const normalizedUrl = pageUrl.replace(/\/$/, ""); // Remove trailing slash
      
      const { data: pageData, error: pageError } = await supabase
        .from("events")
        .select("id, visitor_id, referrer")
        .eq("site_id", siteId)
        .eq("event_name", "pageview")
        .gte("created_at", startDateStr)
        .or(`url.eq.${normalizedUrl},url.eq.${normalizedUrl}/`);

      if (!pageError && pageData) {
        const pagePageviews = pageData.length;
        const pageVisitors = new Set(pageData.map(e => e.visitor_id).filter(Boolean)).size;
        
        // Count referrer sources
        const referrerCounts: Record<string, number> = {};
        pageData.forEach(e => {
          if (e.referrer) {
            try {
              const refHost = new URL(e.referrer).hostname;
              referrerCounts[refHost] = (referrerCounts[refHost] || 0) + 1;
            } catch {
              referrerCounts["Direct"] = (referrerCounts["Direct"] || 0) + 1;
            }
          } else {
            referrerCounts["Direct"] = (referrerCounts["Direct"] || 0) + 1;
          }
        });

        const topReferrers = Object.entries(referrerCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([source, count]) => ({ source, count }));

        pageStats = {
          pageviews: pagePageviews,
          visitors: pageVisitors,
          percentage: totalPageviews > 0 ? Math.round((pagePageviews / totalPageviews) * 100) : 0,
          topReferrers,
        };
      }
    }

    // Get click data from heatmap_clicks if available
    let clickData: Array<{ x: number; y: number; count: number }> = [];
    if (pageUrl) {
      try {
        const urlPath = new URL(pageUrl).pathname;
        
        const { data: clicks, error: clickError } = await supabase
          .from("heatmap_clicks")
          .select("x, y, viewport_w, viewport_h")
          .eq("site_id", siteId)
          .eq("url_path", urlPath)
          .gte("created_at", startDateStr)
          .limit(1000);

        if (!clickError && clicks && clicks.length > 0) {
          // Normalize clicks to percentage positions and aggregate
          const clickMap = new Map<string, number>();
          
          clicks.forEach(click => {
            if (click.viewport_w && click.viewport_h) {
              // Normalize to percentage grid (10% buckets)
              const xPct = Math.floor((click.x / click.viewport_w) * 10) * 10;
              const yPct = Math.floor((click.y / click.viewport_h) * 10) * 10;
              const key = `${xPct}-${yPct}`;
              clickMap.set(key, (clickMap.get(key) || 0) + 1);
            }
          });

          clickData = Array.from(clickMap.entries()).map(([key, count]) => {
            const [x, y] = key.split("-").map(Number);
            return { x, y, count };
          });
        }
      } catch (e) {
        console.error("Error processing click data:", e);
      }
    }

    // Get top pages for the site
    const { data: topPagesData, error: topPagesError } = await supabase
      .from("events")
      .select("url")
      .eq("site_id", siteId)
      .eq("event_name", "pageview")
      .gte("created_at", startDateStr);

    let topPages: Array<{ url: string; pageviews: number }> = [];
    if (!topPagesError && topPagesData) {
      const pageCounts: Record<string, number> = {};
      topPagesData.forEach(e => {
        if (e.url) {
          pageCounts[e.url] = (pageCounts[e.url] || 0) + 1;
        }
      });
      topPages = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([url, pageviews]) => ({ url, pageviews }));
    }

    const response = {
      site: {
        name: site.name,
        domain: site.domain,
      },
      period,
      overall: {
        pageviews: totalPageviews,
        visitors: uniqueVisitors,
      },
      currentPage: pageStats,
      clickHeatmap: clickData,
      topPages,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Overlay stats error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Internal server error", details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
