import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// Declare EdgeRuntime for Supabase Edge Functions
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportData {
  exported_at?: string;
  user_id?: string;
  user_email?: string;
  sites?: any[];
  events?: any[];
  goals?: any[];
  funnels?: any[];
}

interface ImportRequest {
  jobId: string;
  siteId: string;
  importData: ImportData;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client for background processing
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription - must be paid tier
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription || subscription.plan === "free") {
      return new Response(
        JSON.stringify({ error: "This feature requires a paid subscription" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ImportRequest = await req.json();
    const { jobId, siteId, importData } = body;

    if (!jobId || !siteId || !importData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: jobId, siteId, importData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify site ownership
    const { data: site, error: siteError } = await supabaseAdmin
      .from("sites")
      .select("id, user_id")
      .eq("id", siteId)
      .single();

    if (siteError || !site || site.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Site not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify import job exists and belongs to user
    const { data: job, error: jobError } = await supabaseAdmin
      .from("import_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Import job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start background processing
    EdgeRuntime.waitUntil(processImport(supabaseAdmin, jobId, siteId, importData));

    // Return immediately
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Import started",
        jobId 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processImport(
  supabase: any,
  jobId: string,
  siteId: string,
  importData: ImportData
) {
  console.log(`[Import ${jobId}] Starting background processing`);
  
  try {
    // Update job status to processing
    await supabase
      .from("import_jobs")
      .update({ 
        status: "processing",
        started_at: new Date().toISOString()
      })
      .eq("id", jobId);

    let totalRecords = 0;
    let processedRecords = 0;
    let failedRecords = 0;

    // Count total records
    const eventsCount = importData.events?.length || 0;
    const goalsCount = importData.goals?.length || 0;
    const funnelsCount = importData.funnels?.length || 0;
    totalRecords = eventsCount + goalsCount + funnelsCount;

    console.log(`[Import ${jobId}] Total records to import: ${totalRecords}`);

    // Update total records
    await supabase
      .from("import_jobs")
      .update({ total_records: totalRecords })
      .eq("id", jobId);

    // Import goals
    if (importData.goals && importData.goals.length > 0) {
      console.log(`[Import ${jobId}] Importing ${importData.goals.length} goals`);
      
      for (const goal of importData.goals) {
        try {
          // Map goal to new site, generate new ID
          const { error } = await supabase
            .from("goals")
            .insert({
              site_id: siteId,
              name: goal.name,
              event_name: goal.event_name || "pageview",
              url_match: goal.url_match,
              match_type: goal.match_type || "contains",
            });
          
          if (error) {
            console.error(`[Import ${jobId}] Goal insert error:`, error);
            failedRecords++;
          } else {
            processedRecords++;
          }
        } catch (e) {
          console.error(`[Import ${jobId}] Goal error:`, e);
          failedRecords++;
        }

        // Update progress periodically
        if (processedRecords % 10 === 0) {
          await supabase
            .from("import_jobs")
            .update({ processed_records: processedRecords, failed_records: failedRecords })
            .eq("id", jobId);
        }
      }
    }

    // Import funnels
    if (importData.funnels && importData.funnels.length > 0) {
      console.log(`[Import ${jobId}] Importing ${importData.funnels.length} funnels`);
      
      for (const funnel of importData.funnels) {
        try {
          const { error } = await supabase
            .from("funnels")
            .insert({
              site_id: siteId,
              name: funnel.name,
              description: funnel.description,
              steps: funnel.steps || [],
              time_window_days: funnel.time_window_days || 7,
            });
          
          if (error) {
            console.error(`[Import ${jobId}] Funnel insert error:`, error);
            failedRecords++;
          } else {
            processedRecords++;
          }
        } catch (e) {
          console.error(`[Import ${jobId}] Funnel error:`, e);
          failedRecords++;
        }
      }
    }

    // Import events in batches
    if (importData.events && importData.events.length > 0) {
      console.log(`[Import ${jobId}] Importing ${importData.events.length} events`);
      
      const batchSize = 100;
      const events = importData.events;
      
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        // Map events to new site
        const mappedEvents = batch.map(event => ({
          site_id: siteId,
          event_name: event.event_name || "pageview",
          url: event.url,
          referrer: event.referrer,
          country: event.country,
          city: event.city,
          browser: event.browser,
          os: event.os,
          device_type: event.device_type,
          language: event.language,
          session_id: event.session_id,
          visitor_id: event.visitor_id,
          properties: event.properties || {},
          // Preserve original timestamp if available
          created_at: event.created_at || new Date().toISOString(),
        }));

        try {
          const { error } = await supabase
            .from("events")
            .insert(mappedEvents);
          
          if (error) {
            console.error(`[Import ${jobId}] Events batch error:`, error);
            failedRecords += batch.length;
          } else {
            processedRecords += batch.length;
          }
        } catch (e) {
          console.error(`[Import ${jobId}] Events batch exception:`, e);
          failedRecords += batch.length;
        }

        // Update progress
        await supabase
          .from("import_jobs")
          .update({ 
            processed_records: processedRecords, 
            failed_records: failedRecords 
          })
          .eq("id", jobId);

        console.log(`[Import ${jobId}] Progress: ${processedRecords}/${totalRecords}`);
      }
    }

    // Mark as completed
    await supabase
      .from("import_jobs")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString(),
        processed_records: processedRecords,
        failed_records: failedRecords,
      })
      .eq("id", jobId);

    console.log(`[Import ${jobId}] Completed. Processed: ${processedRecords}, Failed: ${failedRecords}`);

  } catch (error: any) {
    console.error(`[Import ${jobId}] Fatal error:`, error);
    
    await supabase
      .from("import_jobs")
      .update({ 
        status: "failed",
        error_message: error.message || "Unknown error occurred",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
