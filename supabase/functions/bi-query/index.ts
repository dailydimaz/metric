import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface QueryRequest {
    site_id: string;
    metrics: string[];
    dimensions: string[];
    start_date: string;
    end_date: string;
    filters?: Record<string, string>;
    limit?: number;
}

interface SchemaField {
    name: string;
    label: string;
    dataType: 'STRING' | 'NUMBER' | 'DATE';
    semantics?: {
        conceptType: 'DIMENSION' | 'METRIC';
        semanticType?: string;
    };
}

// Available fields for Looker Studio schema
const AVAILABLE_FIELDS: SchemaField[] = [
    // Dimensions
    { name: 'date', label: 'Date', dataType: 'DATE', semantics: { conceptType: 'DIMENSION', semanticType: 'YEAR_MONTH_DAY' } },
    { name: 'url', label: 'Page URL', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'referrer', label: 'Referrer', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'country', label: 'Country', dataType: 'STRING', semantics: { conceptType: 'DIMENSION', semanticType: 'COUNTRY' } },
    { name: 'city', label: 'City', dataType: 'STRING', semantics: { conceptType: 'DIMENSION', semanticType: 'CITY' } },
    { name: 'browser', label: 'Browser', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'os', label: 'Operating System', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'device_type', label: 'Device Type', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'event_name', label: 'Event Name', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'utm_source', label: 'UTM Source', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'utm_medium', label: 'UTM Medium', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'utm_campaign', label: 'UTM Campaign', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    // Metrics
    { name: 'pageviews', label: 'Pageviews', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'visitors', label: 'Unique Visitors', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'sessions', label: 'Sessions', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'bounces', label: 'Bounces', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'bounce_rate', label: 'Bounce Rate', dataType: 'NUMBER', semantics: { conceptType: 'METRIC', semanticType: 'PERCENT' } },
    { name: 'avg_session_duration', label: 'Avg Session Duration', dataType: 'NUMBER', semantics: { conceptType: 'METRIC', semanticType: 'DURATION' } },
];

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        // Extract API key from header
        const apiKey = req.headers.get('x-api-key');
        
        // Handle different endpoints
        // GET /bi-query/schema - Returns available fields
        // POST /bi-query/data - Returns data based on query

        if (req.method === 'GET' && pathParts.includes('schema')) {
            // Return schema for Looker Studio
            return new Response(JSON.stringify({
                schema: AVAILABLE_FIELDS,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (req.method === 'POST') {
            // Validate API key
            if (!apiKey) {
                return new Response(JSON.stringify({ error: 'API key required. Set x-api-key header.' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Verify API key
            const keyHash = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(apiKey)
            );
            const keyHashHex = Array.from(new Uint8Array(keyHash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            const { data: apiKeyRecord, error: keyError } = await supabase
                .from('api_keys')
                .select('user_id, is_active')
                .eq('key_hash', keyHashHex)
                .single();

            if (keyError || !apiKeyRecord || !apiKeyRecord.is_active) {
                return new Response(JSON.stringify({ error: 'Invalid or inactive API key' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Update last used
            await supabase
                .from('api_keys')
                .update({ last_used_at: new Date().toISOString() })
                .eq('key_hash', keyHashHex);

            const body: QueryRequest = await req.json();
            const { site_id, metrics, dimensions, start_date, end_date, filters, limit = 10000 } = body;

            if (!site_id) {
                return new Response(JSON.stringify({ error: 'site_id is required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Verify site ownership
            const { data: site, error: siteError } = await supabase
                .from('sites')
                .select('id, user_id')
                .eq('id', site_id)
                .single();

            if (siteError || !site) {
                return new Response(JSON.stringify({ error: 'Site not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (site.user_id !== apiKeyRecord.user_id) {
                // Check team membership
                const { data: teamMember } = await supabase
                    .from('team_members')
                    .select('role')
                    .eq('site_id', site_id)
                    .eq('user_id', apiKeyRecord.user_id)
                    .single();

                if (!teamMember) {
                    return new Response(JSON.stringify({ error: 'Access denied to this site' }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }
            }

            // Build and execute query based on requested dimensions and metrics
            const requestedDimensions = dimensions || ['date'];
            const requestedMetrics = metrics || ['pageviews', 'visitors'];

            // Determine if we should use hourly aggregates or raw events
            const useAggregates = requestedDimensions.length === 1 && requestedDimensions[0] === 'date';

            let rows: any[] = [];

            if (useAggregates) {
                // Use pre-aggregated hourly data for performance
                const { data, error } = await supabase
                    .from('analytics_hourly')
                    .select('hour_timestamp, pageviews, unique_visitors, sessions, bounces, total_session_duration')
                    .eq('site_id', site_id)
                    .gte('hour_timestamp', start_date)
                    .lte('hour_timestamp', end_date + 'T23:59:59Z')
                    .order('hour_timestamp', { ascending: true })
                    .limit(limit);

                if (error) throw error;

                // Aggregate by day
                const dailyData: Record<string, any> = {};
                for (const row of data || []) {
                    const date = row.hour_timestamp.split('T')[0];
                    if (!dailyData[date]) {
                        dailyData[date] = {
                            date,
                            pageviews: 0,
                            visitors: 0,
                            sessions: 0,
                            bounces: 0,
                            total_duration: 0,
                        };
                    }
                    dailyData[date].pageviews += row.pageviews || 0;
                    dailyData[date].visitors += row.unique_visitors || 0;
                    dailyData[date].sessions += row.sessions || 0;
                    dailyData[date].bounces += row.bounces || 0;
                    dailyData[date].total_duration += row.total_session_duration || 0;
                }

                rows = Object.values(dailyData).map((d: any) => ({
                    date: d.date,
                    pageviews: d.pageviews,
                    visitors: d.visitors,
                    sessions: d.sessions,
                    bounces: d.bounces,
                    bounce_rate: d.sessions > 0 ? (d.bounces / d.sessions) * 100 : 0,
                    avg_session_duration: d.sessions > 0 ? d.total_duration / d.sessions : 0,
                }));
            } else {
                // Use raw events for dimension breakdowns
                let query = supabase
                    .from('events')
                    .select('created_at, url, referrer, country, city, browser, os, device_type, event_name, properties')
                    .eq('site_id', site_id)
                    .gte('created_at', start_date)
                    .lte('created_at', end_date + 'T23:59:59Z')
                    .limit(limit);

                // Apply filters
                if (filters) {
                    for (const [key, value] of Object.entries(filters)) {
                        if (value && AVAILABLE_FIELDS.some(f => f.name === key)) {
                            query = query.eq(key, value);
                        }
                    }
                }

                const { data, error } = await query;
                if (error) throw error;

                // Group by requested dimensions
                const grouped: Record<string, any> = {};
                
                for (const event of data || []) {
                    const keyParts: string[] = [];
                    const rowData: Record<string, any> = {};

                    for (const dim of requestedDimensions) {
                        let value: any;
                        switch (dim) {
                            case 'date':
                                value = event.created_at.split('T')[0];
                                break;
                            case 'utm_source':
                            case 'utm_medium':
                            case 'utm_campaign':
                                value = event.properties?.[dim] || '(not set)';
                                break;
                            default:
                                value = (event as any)[dim] || '(not set)';
                        }
                        keyParts.push(String(value));
                        rowData[dim] = value;
                    }

                    const key = keyParts.join('|');
                    if (!grouped[key]) {
                        grouped[key] = {
                            ...rowData,
                            pageviews: 0,
                            visitors: new Set(),
                            sessions: new Set(),
                        };
                    }

                    if (event.event_name === 'pageview') {
                        grouped[key].pageviews++;
                    }
                    // Use properties.visitor_id if available, otherwise use a hash
                    const visitorId = event.properties?.visitor_id || 'unknown';
                    grouped[key].visitors.add(visitorId);
                    const sessionId = event.properties?.session_id || 'unknown';
                    grouped[key].sessions.add(sessionId);
                }

                rows = Object.values(grouped).map((g: any) => ({
                    ...g,
                    visitors: g.visitors.size,
                    sessions: g.sessions.size,
                }));
            }

            // Filter to only requested fields
            const allRequestedFields = [...requestedDimensions, ...requestedMetrics];
            const filteredRows = rows.map(row => {
                const filtered: Record<string, any> = {};
                for (const field of allRequestedFields) {
                    if (row[field] !== undefined) {
                        filtered[field] = row[field];
                    }
                }
                return filtered;
            });

            return new Response(JSON.stringify({
                schema: AVAILABLE_FIELDS.filter(f => allRequestedFields.includes(f.name)),
                rows: filteredRows,
                rowCount: filteredRows.length,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('BI Query error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
