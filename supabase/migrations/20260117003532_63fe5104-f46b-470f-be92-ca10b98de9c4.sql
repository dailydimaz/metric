-- ============================================================
-- HIGH PERFORMANCE ANALYTICS: STEP 3 - Drop & Recreate Optimized Hybrid RPCs
-- ============================================================

-- Drop existing functions with old signatures
DROP FUNCTION IF EXISTS public.get_site_stats(uuid, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_site_stats(uuid, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, jsonb);

-- Optimized get_site_stats using hybrid approach
CREATE OR REPLACE FUNCTION public.get_site_stats(
  _site_id UUID,
  _start_date TIMESTAMPTZ,
  _end_date TIMESTAMPTZ,
  _prev_start_date TIMESTAMPTZ,
  _prev_end_date TIMESTAMPTZ,
  _filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  total_pageviews BIGINT,
  unique_visitors BIGINT,
  avg_session_duration NUMERIC,
  bounce_rate NUMERIC,
  pageviews_change NUMERIC,
  visitors_change NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_pageviews BIGINT := 0;
  v_visitors BIGINT := 0;
  v_sessions BIGINT := 0;
  v_bounces BIGINT := 0;
  v_duration BIGINT := 0;
  v_prev_pageviews BIGINT := 0;
  v_prev_visitors BIGINT := 0;
  v_bounce_rate NUMERIC := 0;
  v_has_filters BOOLEAN;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;

  -- If filters are applied, fall back to raw query
  IF v_has_filters THEN
    SELECT 
      COUNT(*),
      COUNT(DISTINCT e.visitor_id)
    INTO v_pageviews, v_visitors
    FROM events e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

    SELECT 
      COUNT(*),
      COUNT(DISTINCT e.visitor_id)
    INTO v_prev_pageviews, v_prev_visitors
    FROM events e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _prev_start_date
      AND e.created_at <= _prev_end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');
  ELSE
    -- HYBRID: Rollups + Current Hour Raw Data
    SELECT 
      COALESCE(SUM(ah.pageviews), 0),
      COALESCE(SUM(ah.unique_visitors), 0),
      COALESCE(SUM(ah.sessions), 0),
      COALESCE(SUM(ah.bounces), 0),
      COALESCE(SUM(ah.total_session_duration), 0)
    INTO v_pageviews, v_visitors, v_sessions, v_bounces, v_duration
    FROM analytics_hourly ah
    WHERE ah.site_id = _site_id
      AND ah.hour_timestamp >= date_trunc('hour', _start_date)
      AND ah.hour_timestamp < v_current_hour
      AND ah.hour_timestamp <= _end_date;
    
    -- Add current hour from raw events
    SELECT 
      v_pageviews + COUNT(*),
      v_visitors + COUNT(DISTINCT e.visitor_id)
    INTO v_pageviews, v_visitors
    FROM events e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_current_hour
      AND e.created_at <= _end_date;
    
    -- Previous period from rollups
    SELECT 
      COALESCE(SUM(ah.pageviews), 0),
      COALESCE(SUM(ah.unique_visitors), 0)
    INTO v_prev_pageviews, v_prev_visitors
    FROM analytics_hourly ah
    WHERE ah.site_id = _site_id
      AND ah.hour_timestamp >= date_trunc('hour', _prev_start_date)
      AND ah.hour_timestamp <= _prev_end_date;
  END IF;

  -- Calculate bounce rate from raw events
  WITH session_counts AS (
    SELECT session_id, COUNT(*) as cnt
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND created_at >= _start_date
      AND created_at <= _end_date
      AND session_id IS NOT NULL
    GROUP BY session_id
  )
  SELECT 
    CASE WHEN COUNT(*) > 0 
      THEN ROUND((SUM(CASE WHEN cnt = 1 THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 1)
      ELSE 0
    END
  INTO v_bounce_rate
  FROM session_counts;

  RETURN QUERY SELECT
    v_pageviews,
    v_visitors,
    CASE WHEN v_sessions > 0 THEN ROUND(v_duration::numeric / v_sessions::numeric, 0) ELSE 0::numeric END,
    COALESCE(v_bounce_rate, 0::numeric),
    CASE WHEN v_prev_pageviews > 0 
      THEN ROUND(((v_pageviews - v_prev_pageviews)::numeric / v_prev_pageviews::numeric) * 100, 1)
      ELSE 0::numeric
    END,
    CASE WHEN v_prev_visitors > 0 
      THEN ROUND(((v_visitors - v_prev_visitors)::numeric / v_prev_visitors::numeric) * 100, 1)
      ELSE 0::numeric
    END;
END;
$$;