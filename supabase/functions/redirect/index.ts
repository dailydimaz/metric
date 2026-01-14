import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("s");

    if (!slug) {
      return new Response("Missing slug parameter", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Create Supabase client with service role for reading links
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the link by slug
    const { data: link, error } = await supabase
      .from("links")
      .select("id, original_url, site_id")
      .eq("slug", slug)
      .single();

    if (error || !link) {
      return new Response("Link not found", { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // Record the click event asynchronously (fire and forget)
    const referer = req.headers.get("referer") || "";
    
    // Insert link_click event - using EdgeRuntime.waitUntil pattern
    const recordClick = async () => {
      try {
        await supabase
          .from("events")
          .insert({
            site_id: link.site_id,
            event_name: "link_click",
            url: link.original_url,
            referrer: referer,
            properties: {
              link_id: link.id,
              slug: slug,
            },
          });
      } catch (err) {
        console.error("Failed to record click:", err);
      }
    };
    
    // Fire and forget
    recordClick();

    // Return 302 redirect
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: link.original_url,
      },
    });
  } catch (error) {
    console.error("Redirect error:", error);
    return new Response("Internal server error", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
