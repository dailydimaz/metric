import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() === "websocket") {
        return new Response(null, { status: 501 });
    }

    try {
        const url = new URL(req.url);
        const path = url.pathname.replace(/\/v1\/?/, ""); // Strip /v1 prefix

        // 1. Auth Validation
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer mk_")) {
            return new Response(JSON.stringify({ error: "Missing or invalid API key" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const apiKey = authHeader.replace("Bearer ", "");

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Hash the key to look it up (since we store hashes)
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Check Key Validity
        const { data: keyData, error: keyError } = await supabaseAdmin
            .from("api_keys")
            .select("user_id, is_active, expires_at")
            .eq("key_hash", keyHash)
            .single();

        if (keyError || !keyData || !keyData.is_active) {
            return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
            return new Response(JSON.stringify({ error: "API key expired" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Update last_used_at (async, don't await blocking)
        supabaseAdmin
            .from("api_keys")
            .update({ last_used_at: new Date().toISOString() })
            .eq("key_hash", keyHash)
            .then();

        // 2. Route Handling
        if (path === "stats" && req.method === "GET") {
            const siteId = url.searchParams.get("site_id");
            const range = url.searchParams.get("range") || "7d"; // 24h, 7d, 30d, 90d

            if (!siteId) {
                return new Response(JSON.stringify({ error: "Missing site_id parameter" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Verify user owns the site
            const { data: site, error: siteError } = await supabaseAdmin
                .from("sites")
                .select("id")
                .eq("id", siteId)
                .eq("user_id", keyData.user_id) // Ensure key owner matches site owner
                .single();

            if (siteError || !site) {
                return new Response(JSON.stringify({ error: "Site not found or access denied" }), {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Calculate Date Range
            const now = new Date();
            let startDate = new Date();
            if (range === "24h") startDate.setDate(now.getDate() - 1);
            else if (range === "7d") startDate.setDate(now.getDate() - 7);
            else if (range === "30d") startDate.setDate(now.getDate() - 30);
            else if (range === "90d") startDate.setDate(now.getDate() - 90);
            else startDate.setDate(now.getDate() - 7); // Default

            // Fetch Stats (Using a simplified aggregation for API)
            const { data: events, error: statsError } = await supabaseAdmin
                .from("events")
                .select("visitor_id, session_id")
                .eq("site_id", siteId)
                .eq("event_name", "pageview")
                .gte("created_at", startDate.toISOString())
                .lte("created_at", now.toISOString());

            if (statsError) throw statsError;

            const pageviews = events?.length || 0;
            const visitors = new Set(events?.map(e => e.visitor_id)).size;

            return new Response(JSON.stringify({
                site_id: siteId,
                date_range: range,
                start_date: startDate.toISOString(),
                end_date: now.toISOString(),
                stats: {
                    pageviews,
                    visitors
                }
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Endpoint not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
