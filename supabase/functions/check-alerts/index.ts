import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

        // 1. Fetch enabled alerts
        const { data: alerts, error: alertsError } = await supabase
            .from('alerts')
            .select('*, sites(id, domain, name)')
            .eq('is_enabled', true);

        if (alertsError) throw alertsError;

        const results = [];

        // 2. Iterate and check conditions
        for (const alert of alerts) {
            if (!alert.sites) continue;

            // Time range: last hour
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);

            // Fetch metric
            let value = 0;
            if (alert.metric === 'visitors') {
                const { count } = await supabase
                    .from('events')
                    .select('visitor_id', { count: 'exact', head: true })
                    .eq('site_id', alert.site_id)
                    .gte('created_at', startDate.toISOString())
                    .lt('created_at', endDate.toISOString());
                value = count || 0;
            } else if (alert.metric === 'pageviews') {
                const { count } = await supabase
                    .from('events')
                    .select('id', { count: 'exact', head: true })
                    .eq('site_id', alert.site_id)
                    .eq('event_name', 'pageview')
                    .gte('created_at', startDate.toISOString())
                    .lt('created_at', endDate.toISOString());
                value = count || 0;
            }

            // Check condition
            const isTriggered =
                (alert.comparison === 'gt' && value > alert.threshold) ||
                (alert.comparison === 'lt' && value < alert.threshold);

            if (isTriggered) {
                // Only trigger if not triggered recently (e.g. today)
                // For simplicity, we just log it. A real system would check last_triggered_at

                console.log(`Alert triggered: ${alert.name} for ${alert.sites.name}. Value: ${value}, Threshold: ${alert.threshold}`);

                // Update last_triggered_at
                await supabase
                    .from('alerts')
                    .update({ last_triggered_at: new Date().toISOString() })
                    .eq('id', alert.id);

                // Send notification (Placeholder)
                // In real impl, send email via Resend or Slack webhook
                results.push({ alert: alert.name, triggered: true, value });
            }
        }

        return new Response(JSON.stringify({ success: true, checked: alerts.length, triggered: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
