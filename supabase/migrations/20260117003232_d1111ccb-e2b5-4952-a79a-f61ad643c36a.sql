-- ============================================================
-- HIGH PERFORMANCE ANALYTICS: STEP 2 - Fix Partition RLS & Create Aggregation Functions
-- ============================================================

-- Enable RLS on all partition tables (they inherit policies from parent)
ALTER TABLE public.events_y2025m01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m07 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m11 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2025m12 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2026m01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2026m02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2026m03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2026m04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2026m05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_y2026m06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_default ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Aggregation Function: Process raw events into rollups
-- ============================================================

CREATE OR REPLACE FUNCTION public.aggregate_analytics_data(_batch_size INTEGER DEFAULT 10000)
RETURNS TABLE(
  sites_processed INTEGER,
  hours_aggregated INTEGER,
  events_processed BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sites_processed INTEGER := 0;
  v_hours_aggregated INTEGER := 0;
  v_events_processed BIGINT := 0;
  v_site RECORD;
  v_current_hour TIMESTAMPTZ;
  v_watermark TIMESTAMPTZ;
BEGIN
  -- Get current hour (we only aggregate completed hours)
  v_current_hour := date_trunc('hour', now());
  
  -- Process each site
  FOR v_site IN SELECT id FROM sites LOOP
    -- Get or create watermark for this site
    INSERT INTO analytics_aggregation_watermark (site_id, last_aggregated_at)
    VALUES (v_site.id, '1970-01-01'::timestamptz)
    ON CONFLICT (site_id) DO NOTHING;
    
    SELECT last_aggregated_at INTO v_watermark
    FROM analytics_aggregation_watermark
    WHERE site_id = v_site.id;
    
    -- Skip if nothing to aggregate
    IF v_watermark >= v_current_hour THEN
      CONTINUE;
    END IF;
    
    -- Aggregate hourly site stats
    INSERT INTO analytics_hourly (
      site_id, hour_timestamp, pageviews, unique_visitors, sessions, bounces, total_session_duration
    )
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at) AS hour_ts,
      COUNT(*) FILTER (WHERE e.event_name = 'pageview') AS pageviews,
      COUNT(DISTINCT e.visitor_id) AS unique_visitors,
      COUNT(DISTINCT e.session_id) AS sessions,
      0 AS bounces, -- Calculated separately if needed
      0 AS total_session_duration
    FROM events e
    WHERE e.site_id = v_site.id
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at)
    ON CONFLICT (site_id, hour_timestamp) DO UPDATE SET
      pageviews = EXCLUDED.pageviews,
      unique_visitors = EXCLUDED.unique_visitors,
      sessions = EXCLUDED.sessions,
      updated_at = now();
    
    GET DIAGNOSTICS v_hours_aggregated = ROW_COUNT;
    
    -- Aggregate pages hourly
    INSERT INTO analytics_pages_hourly (site_id, hour_timestamp, url, pageviews, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at) AS hour_ts,
      COALESCE(e.url, '/') AS url,
      COUNT(*) AS pageviews,
      COUNT(DISTINCT e.visitor_id) AS unique_visitors
    FROM events e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), COALESCE(e.url, '/')
    ON CONFLICT (site_id, hour_timestamp, url) DO UPDATE SET
      pageviews = EXCLUDED.pageviews,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Aggregate referrers hourly
    INSERT INTO analytics_referrers_hourly (site_id, hour_timestamp, referrer, visits, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at) AS hour_ts,
      COALESCE(NULLIF(e.referrer, ''), 'Direct') AS referrer,
      COUNT(*) AS visits,
      COUNT(DISTINCT e.visitor_id) AS unique_visitors
    FROM events e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), COALESCE(NULLIF(e.referrer, ''), 'Direct')
    ON CONFLICT (site_id, hour_timestamp, referrer) DO UPDATE SET
      visits = EXCLUDED.visits,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Aggregate geo hourly
    INSERT INTO analytics_geo_hourly (site_id, hour_timestamp, country, city, visits, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at) AS hour_ts,
      COALESCE(e.country, 'Unknown') AS country,
      e.city,
      COUNT(*) AS visits,
      COUNT(DISTINCT e.visitor_id) AS unique_visitors
    FROM events e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), COALESCE(e.country, 'Unknown'), e.city
    ON CONFLICT (site_id, hour_timestamp, country, city) DO UPDATE SET
      visits = EXCLUDED.visits,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Aggregate devices hourly
    INSERT INTO analytics_devices_hourly (site_id, hour_timestamp, device_type, browser, os, visits, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at) AS hour_ts,
      e.device_type,
      e.browser,
      e.os,
      COUNT(*) AS visits,
      COUNT(DISTINCT e.visitor_id) AS unique_visitors
    FROM events e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), e.device_type, e.browser, e.os
    ON CONFLICT (site_id, hour_timestamp, device_type, browser, os) DO UPDATE SET
      visits = EXCLUDED.visits,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Aggregate languages hourly
    INSERT INTO analytics_languages_hourly (site_id, hour_timestamp, language, visits, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at) AS hour_ts,
      COALESCE(e.language, 'Unknown') AS language,
      COUNT(*) AS visits,
      COUNT(DISTINCT e.visitor_id) AS unique_visitors
    FROM events e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), COALESCE(e.language, 'Unknown')
    ON CONFLICT (site_id, hour_timestamp, language) DO UPDATE SET
      visits = EXCLUDED.visits,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Count processed events
    SELECT COUNT(*) INTO v_events_processed
    FROM events
    WHERE site_id = v_site.id
      AND created_at >= v_watermark
      AND created_at < v_current_hour;
    
    -- Update watermark
    UPDATE analytics_aggregation_watermark
    SET last_aggregated_at = v_current_hour, updated_at = now()
    WHERE site_id = v_site.id;
    
    v_sites_processed := v_sites_processed + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_sites_processed, v_hours_aggregated, v_events_processed;
END;
$$;

-- ============================================================
-- Function to create new monthly partitions (run via cron)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_future_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_partition_date DATE;
  v_partition_name TEXT;
  v_partition_start TEXT;
  v_partition_end TEXT;
  v_i INTEGER;
BEGIN
  -- Create partitions for the next 6 months
  FOR v_i IN 0..5 LOOP
    v_partition_date := date_trunc('month', now() + (v_i || ' months')::interval)::date;
    v_partition_name := 'events_y' || to_char(v_partition_date, 'YYYY') || 'm' || to_char(v_partition_date, 'MM');
    v_partition_start := v_partition_date::text;
    v_partition_end := (v_partition_date + interval '1 month')::date::text;
    
    -- Check if partition exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = v_partition_name AND n.nspname = 'public'
    ) THEN
      EXECUTE format(
        'CREATE TABLE public.%I PARTITION OF public.events_partitioned FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, v_partition_start, v_partition_end
      );
      
      -- Enable RLS on new partition
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_partition_name);
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- Schedule cron jobs
-- ============================================================

-- Run aggregation every 5 minutes
SELECT cron.schedule(
  'aggregate-analytics',
  '*/5 * * * *',
  $$SELECT public.aggregate_analytics_data()$$
);

-- Create future partitions monthly (on the 1st at 00:00)
SELECT cron.schedule(
  'create-partitions',
  '0 0 1 * *',
  $$SELECT public.create_future_partitions()$$
);