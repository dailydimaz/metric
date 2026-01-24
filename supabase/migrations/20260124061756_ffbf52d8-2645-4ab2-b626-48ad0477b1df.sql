-- High Performance Analytics Migration
-- Phase 1: Switch aggregation to events_partitioned
-- Phase 2: Update remaining RPCs to use hybrid read path

-- =====================================================
-- 1. UPDATE aggregate_analytics_data to use events_partitioned
-- =====================================================

CREATE OR REPLACE FUNCTION public.aggregate_analytics_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_site RECORD;
  v_watermark TIMESTAMPTZ;
  v_current_hour TIMESTAMPTZ;
BEGIN
  v_current_hour := date_trunc('hour', now());
  
  FOR v_site IN SELECT id FROM sites LOOP
    -- Get watermark for this site
    SELECT last_aggregated_at INTO v_watermark
    FROM analytics_aggregation_watermark
    WHERE site_id = v_site.id;
    
    IF v_watermark IS NULL THEN
      -- Initialize watermark to 24 hours ago
      v_watermark := v_current_hour - interval '24 hours';
      INSERT INTO analytics_aggregation_watermark (site_id, last_aggregated_at)
      VALUES (v_site.id, v_watermark)
      ON CONFLICT (site_id) DO NOTHING;
    END IF;
    
    -- Skip if nothing to aggregate
    IF v_watermark >= v_current_hour THEN
      CONTINUE;
    END IF;
    
    -- Aggregate core hourly stats FROM events_partitioned (BRIN-optimized)
    INSERT INTO analytics_hourly (
      site_id, hour_timestamp, pageviews, unique_visitors, sessions, bounces, total_session_duration
    )
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at) AS hour_ts,
      COUNT(*) FILTER (WHERE e.event_name = 'pageview') AS pageviews,
      COUNT(DISTINCT e.visitor_id) AS unique_visitors,
      COUNT(DISTINCT e.session_id) AS sessions,
      0 AS bounces,
      0 AS total_session_duration
    FROM events_partitioned e
    WHERE e.site_id = v_site.id
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at)
    ON CONFLICT (site_id, hour_timestamp) DO UPDATE SET
      pageviews = EXCLUDED.pageviews,
      unique_visitors = EXCLUDED.unique_visitors,
      sessions = EXCLUDED.sessions,
      updated_at = now();
    
    -- Aggregate pages FROM events_partitioned
    INSERT INTO analytics_pages_hourly (site_id, hour_timestamp, url, pageviews, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at),
      COALESCE(e.url, '/'),
      COUNT(*),
      COUNT(DISTINCT e.visitor_id)
    FROM events_partitioned e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), COALESCE(e.url, '/')
    ON CONFLICT (site_id, hour_timestamp, url) DO UPDATE SET
      pageviews = EXCLUDED.pageviews,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Aggregate referrers FROM events_partitioned
    INSERT INTO analytics_referrers_hourly (site_id, hour_timestamp, referrer, visits, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at),
      COALESCE(NULLIF(e.referrer, ''), 'Direct'),
      COUNT(*),
      COUNT(DISTINCT e.visitor_id)
    FROM events_partitioned e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), COALESCE(NULLIF(e.referrer, ''), 'Direct')
    ON CONFLICT (site_id, hour_timestamp, referrer) DO UPDATE SET
      visits = EXCLUDED.visits,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Aggregate devices FROM events_partitioned
    INSERT INTO analytics_devices_hourly (site_id, hour_timestamp, device_type, browser, os, visits, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at),
      e.device_type,
      e.browser,
      e.os,
      COUNT(*),
      COUNT(DISTINCT e.visitor_id)
    FROM events_partitioned e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), e.device_type, e.browser, e.os
    ON CONFLICT (site_id, hour_timestamp, device_type, browser, os) DO UPDATE SET
      visits = EXCLUDED.visits,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Aggregate geo FROM events_partitioned
    INSERT INTO analytics_geo_hourly (site_id, hour_timestamp, country, city, visits, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at),
      COALESCE(e.country, 'Unknown'),
      e.city,
      COUNT(*),
      COUNT(DISTINCT e.visitor_id)
    FROM events_partitioned e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), COALESCE(e.country, 'Unknown'), e.city
    ON CONFLICT (site_id, hour_timestamp, country, city) DO UPDATE SET
      visits = EXCLUDED.visits,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Aggregate languages FROM events_partitioned
    INSERT INTO analytics_languages_hourly (site_id, hour_timestamp, language, visits, unique_visitors)
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at),
      COALESCE(e.language, 'Unknown'),
      COUNT(*),
      COUNT(DISTINCT e.visitor_id)
    FROM events_partitioned e
    WHERE e.site_id = v_site.id
      AND e.event_name = 'pageview'
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at), COALESCE(e.language, 'Unknown')
    ON CONFLICT (site_id, hour_timestamp, language) DO UPDATE SET
      visits = EXCLUDED.visits,
      unique_visitors = EXCLUDED.unique_visitors;
    
    -- Update watermark
    UPDATE analytics_aggregation_watermark
    SET last_aggregated_at = v_current_hour, updated_at = now()
    WHERE site_id = v_site.id;
    
  END LOOP;
END;
$$;

-- =====================================================
-- 2. UPDATE get_site_stats to use events_partitioned for filtered queries
-- =====================================================

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

  IF v_has_filters THEN
    -- Filtered query uses events_partitioned (BRIN-optimized)
    SELECT 
      COUNT(*),
      COUNT(DISTINCT e.visitor_id)
    INTO v_pageviews, v_visitors
    FROM events_partitioned e
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
    FROM events_partitioned e
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
    -- HYBRID: Rollups + Current Hour from events_partitioned
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
    
    -- Add current hour from events_partitioned
    SELECT 
      v_pageviews + COUNT(*),
      v_visitors + COUNT(DISTINCT e.visitor_id)
    INTO v_pageviews, v_visitors
    FROM events_partitioned e
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

  -- Calculate bounce rate from events_partitioned
  WITH session_counts AS (
    SELECT session_id, COUNT(*) as cnt
    FROM events_partitioned
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND created_at >= _start_date
      AND created_at <= _end_date
      AND session_id IS NOT NULL
    GROUP BY session_id
  )
  SELECT 
    CASE WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE cnt = 1)::numeric / COUNT(*)::numeric) * 100, 1)
      ELSE 0
    END
  INTO v_bounce_rate
  FROM session_counts;

  RETURN QUERY SELECT 
    v_pageviews,
    v_visitors,
    CASE WHEN v_sessions > 0 THEN ROUND(v_duration::numeric / v_sessions::numeric, 1) ELSE 0 END,
    v_bounce_rate,
    CASE WHEN v_prev_pageviews > 0 
      THEN ROUND(((v_pageviews - v_prev_pageviews)::numeric / v_prev_pageviews::numeric) * 100, 1)
      ELSE 0
    END,
    CASE WHEN v_prev_visitors > 0 
      THEN ROUND(((v_visitors - v_prev_visitors)::numeric / v_prev_visitors::numeric) * 100, 1)
      ELSE 0
    END;
END;
$$;

-- =====================================================
-- 3. UPDATE get_timeseries_stats with HYBRID read path
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_timeseries_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _prev_start_date timestamp with time zone, 
  _prev_end_date timestamp with time zone,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(date text, pageviews bigint, visitors bigint, prev_pageviews bigint, prev_visitors bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_has_filters BOOLEAN;
  period_days int;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;
  period_days := EXTRACT(DAY FROM (_end_date - _start_date))::int + 1;

  IF v_has_filters THEN
    -- Filtered: use events_partitioned (BRIN-optimized)
    RETURN QUERY
    WITH current_data AS (
      SELECT 
        to_char(e.created_at, 'YYYY-MM-DD') as day,
        COUNT(*) as pv,
        COUNT(DISTINCT e.visitor_id) as vis
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.event_name = 'pageview'
        AND e.created_at >= _start_date
        AND e.created_at <= _end_date
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
        AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
        AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
        AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
        AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
      GROUP BY to_char(e.created_at, 'YYYY-MM-DD')
    ),
    prev_data AS (
      SELECT 
        to_char(e.created_at + (period_days || ' days')::interval, 'YYYY-MM-DD') as day,
        COUNT(*) as pv,
        COUNT(DISTINCT e.visitor_id) as vis
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.event_name = 'pageview'
        AND e.created_at >= _prev_start_date
        AND e.created_at <= _prev_end_date
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
        AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
        AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
        AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
        AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
      GROUP BY to_char(e.created_at + (period_days || ' days')::interval, 'YYYY-MM-DD')
    ),
    all_dates AS (
      SELECT day FROM current_data
      UNION
      SELECT day FROM prev_data
    )
    SELECT 
      ad.day,
      COALESCE(c.pv, 0)::bigint,
      COALESCE(c.vis, 0)::bigint,
      COALESCE(p.pv, 0)::bigint,
      COALESCE(p.vis, 0)::bigint
    FROM all_dates ad
    LEFT JOIN current_data c ON c.day = ad.day
    LEFT JOIN prev_data p ON p.day = ad.day
    ORDER BY ad.day;
  ELSE
    -- HYBRID: Rollups aggregated to daily + current hour raw
    RETURN QUERY
    WITH date_series AS (
      SELECT generate_series(
        date_trunc('day', _start_date)::date,
        date_trunc('day', _end_date)::date,
        '1 day'::interval
      )::date AS d
    ),
    rollup_data AS (
      -- Aggregate hourly rollups to daily
      SELECT 
        date_trunc('day', ah.hour_timestamp)::date as day,
        SUM(ah.pageviews)::bigint as pv,
        SUM(ah.unique_visitors)::bigint as vis
      FROM analytics_hourly ah
      WHERE ah.site_id = _site_id
        AND ah.hour_timestamp >= date_trunc('hour', _start_date)
        AND ah.hour_timestamp < v_current_hour
        AND ah.hour_timestamp <= _end_date
      GROUP BY date_trunc('day', ah.hour_timestamp)::date
    ),
    current_hour_data AS (
      -- Get current hour data from raw partitioned table
      SELECT 
        date_trunc('day', e.created_at)::date as day,
        COUNT(*) as pv,
        COUNT(DISTINCT e.visitor_id) as vis
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.event_name = 'pageview'
        AND e.created_at >= v_current_hour
        AND e.created_at <= _end_date
      GROUP BY date_trunc('day', e.created_at)::date
    ),
    current_merged AS (
      SELECT 
        COALESCE(r.day, c.day) as day,
        COALESCE(r.pv, 0) + COALESCE(c.pv, 0) as pv,
        COALESCE(r.vis, 0) + COALESCE(c.vis, 0) as vis
      FROM rollup_data r
      FULL OUTER JOIN current_hour_data c ON r.day = c.day
    ),
    prev_rollup_data AS (
      -- Previous period from rollups aggregated to daily
      SELECT 
        date_trunc('day', ah.hour_timestamp)::date as day,
        SUM(ah.pageviews)::bigint as pv,
        SUM(ah.unique_visitors)::bigint as vis
      FROM analytics_hourly ah
      WHERE ah.site_id = _site_id
        AND ah.hour_timestamp >= date_trunc('hour', _prev_start_date)
        AND ah.hour_timestamp <= _prev_end_date
      GROUP BY date_trunc('day', ah.hour_timestamp)::date
    ),
    indexed_dates AS (
      SELECT d, ROW_NUMBER() OVER (ORDER BY d) - 1 AS idx FROM date_series
    ),
    prev_indexed AS (
      SELECT 
        (_prev_start_date::date + (idx || ' days')::interval)::date AS prev_date,
        idx
      FROM indexed_dates
    )
    SELECT 
      to_char(ds.d, 'YYYY-MM-DD'),
      COALESCE(cm.pv, 0)::bigint,
      COALESCE(cm.vis, 0)::bigint,
      COALESCE(pr.pv, 0)::bigint,
      COALESCE(pr.vis, 0)::bigint
    FROM date_series ds
    LEFT JOIN indexed_dates id ON id.d = ds.d
    LEFT JOIN current_merged cm ON cm.day = ds.d
    LEFT JOIN prev_indexed pi ON pi.idx = id.idx
    LEFT JOIN prev_rollup_data pr ON pr.day = pi.prev_date
    ORDER BY ds.d;
  END IF;
END;
$$;

-- Also update the non-filter version
CREATE OR REPLACE FUNCTION public.get_timeseries_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _prev_start_date timestamp with time zone, 
  _prev_end_date timestamp with time zone
)
RETURNS TABLE(date text, pageviews bigint, visitors bigint, prev_pageviews bigint, prev_visitors bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_timeseries_stats(_site_id, _start_date, _end_date, _prev_start_date, _prev_end_date, '{}'::jsonb);
END;
$$;

-- =====================================================
-- 4. UPDATE get_top_pages to use events_partitioned for filtered queries
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_top_pages(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(url text, pageviews bigint, unique_visitors bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_hour TIMESTAMPTZ;
  v_has_filters BOOLEAN;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', now());
  v_has_filters := _filters IS NOT NULL AND _filters != '{}'::jsonb;

  IF v_has_filters THEN
    -- Filtered: use events_partitioned
    RETURN QUERY
    SELECT 
      COALESCE(e.url, '/')::text AS url,
      COUNT(*)::bigint AS pageviews,
      COUNT(DISTINCT e.visitor_id)::bigint AS unique_visitors
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
    GROUP BY COALESCE(e.url, '/')
    ORDER BY COUNT(*) DESC
    LIMIT _limit;
  ELSE
    -- HYBRID: rollups + current hour
    RETURN QUERY
    WITH rollup_pages AS (
      SELECT 
        aph.url as pg_url,
        SUM(aph.pageviews)::bigint as pv,
        SUM(aph.unique_visitors)::bigint as uv
      FROM analytics_pages_hourly aph
      WHERE aph.site_id = _site_id
        AND aph.hour_timestamp >= date_trunc('hour', _start_date)
        AND aph.hour_timestamp < v_current_hour
        AND aph.hour_timestamp <= _end_date
      GROUP BY aph.url
    ),
    current_hour_pages AS (
      SELECT 
        COALESCE(e.url, '/') as pg_url,
        COUNT(*) as pv,
        COUNT(DISTINCT e.visitor_id) as uv
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.event_name = 'pageview'
        AND e.created_at >= v_current_hour
        AND e.created_at <= _end_date
      GROUP BY COALESCE(e.url, '/')
    ),
    merged AS (
      SELECT 
        COALESCE(r.pg_url, c.pg_url) as pg_url,
        COALESCE(r.pv, 0) + COALESCE(c.pv, 0) as pv,
        COALESCE(r.uv, 0) + COALESCE(c.uv, 0) as uv
      FROM rollup_pages r
      FULL OUTER JOIN current_hour_pages c ON r.pg_url = c.pg_url
    )
    SELECT m.pg_url::text, m.pv::bigint, m.uv::bigint
    FROM merged m
    ORDER BY m.pv DESC
    LIMIT _limit;
  END IF;
END;
$$;

-- Also update non-filter version
CREATE OR REPLACE FUNCTION public.get_top_pages(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10
)
RETURNS TABLE(url text, pageviews bigint, unique_visitors bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_top_pages(_site_id, _start_date, _end_date, _limit, '{}'::jsonb);
END;
$$;

-- =====================================================
-- 5. UPDATE get_utm_stats to use events_partitioned
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_utm_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_with_utm bigint;
  result jsonb;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Count events with any UTM parameter from events_partitioned
  SELECT COUNT(*) INTO total_with_utm
  FROM events_partitioned
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND properties IS NOT NULL
    AND (
      properties->'utm'->>'utm_source' IS NOT NULL OR
      properties->'utm'->>'utm_medium' IS NOT NULL OR
      properties->'utm'->>'utm_campaign' IS NOT NULL
    );

  SELECT jsonb_build_object(
    'sources', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'value', source,
          'visits', cnt,
          'percentage', CASE WHEN total_with_utm > 0 THEN ROUND((cnt::numeric / total_with_utm::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT properties->'utm'->>'utm_source' as source, COUNT(*) as cnt
        FROM events_partitioned
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND properties->'utm'->>'utm_source' IS NOT NULL
        GROUP BY properties->'utm'->>'utm_source'
        ORDER BY cnt DESC
        LIMIT _limit
      ) s
    ),
    'mediums', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'value', medium,
          'visits', cnt,
          'percentage', CASE WHEN total_with_utm > 0 THEN ROUND((cnt::numeric / total_with_utm::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT properties->'utm'->>'utm_medium' as medium, COUNT(*) as cnt
        FROM events_partitioned
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND properties->'utm'->>'utm_medium' IS NOT NULL
        GROUP BY properties->'utm'->>'utm_medium'
        ORDER BY cnt DESC
        LIMIT _limit
      ) m
    ),
    'campaigns', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'value', campaign,
          'visits', cnt,
          'percentage', CASE WHEN total_with_utm > 0 THEN ROUND((cnt::numeric / total_with_utm::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT properties->'utm'->>'utm_campaign' as campaign, COUNT(*) as cnt
        FROM events_partitioned
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND properties->'utm'->>'utm_campaign' IS NOT NULL
        GROUP BY properties->'utm'->>'utm_campaign'
        ORDER BY cnt DESC
        LIMIT _limit
      ) c
    ),
    'total_with_utm', total_with_utm
  ) INTO result;

  RETURN result;
END;
$$;

-- =====================================================
-- 6. UPDATE get_attribution_stats to use events_partitioned
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_attribution_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _goal_event text DEFAULT 'conversion'::text, 
  _attribution_model text DEFAULT 'last_touch'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Check authorization
  IF NOT (
    EXISTS (SELECT 1 FROM sites WHERE id = _site_id AND user_id = auth.uid())
    OR public.has_team_role(_site_id, 'viewer')
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  WITH conversions AS (
    SELECT 
      visitor_id,
      session_id,
      created_at as conversion_time,
      properties
    FROM events_partitioned
    WHERE site_id = _site_id
      AND event_name = _goal_event
      AND created_at BETWEEN _start_date AND _end_date
      AND visitor_id IS NOT NULL
  ),
  visitor_touchpoints AS (
    SELECT 
      e.visitor_id,
      e.session_id,
      e.created_at,
      e.referrer,
      COALESCE(
        (e.properties->>'utm_source')::text,
        CASE 
          WHEN e.referrer IS NULL OR e.referrer = '' THEN 'direct'
          WHEN e.referrer LIKE '%google%' THEN 'google'
          WHEN e.referrer LIKE '%facebook%' OR e.referrer LIKE '%fb.%' THEN 'facebook'
          WHEN e.referrer LIKE '%twitter%' OR e.referrer LIKE '%t.co%' THEN 'twitter'
          WHEN e.referrer LIKE '%linkedin%' THEN 'linkedin'
          WHEN e.referrer LIKE '%youtube%' THEN 'youtube'
          ELSE 'referral'
        END
      ) as channel,
      COALESCE((e.properties->>'utm_medium')::text, 'organic') as medium,
      (e.properties->>'utm_campaign')::text as campaign,
      ROW_NUMBER() OVER (PARTITION BY e.visitor_id ORDER BY e.created_at ASC) as touch_order,
      ROW_NUMBER() OVER (PARTITION BY e.visitor_id ORDER BY e.created_at DESC) as reverse_order
    FROM events_partitioned e
    INNER JOIN conversions c ON e.visitor_id = c.visitor_id
    WHERE e.site_id = _site_id
      AND e.created_at BETWEEN _start_date AND c.conversion_time
      AND e.event_name = 'pageview'
  ),
  first_touch_attribution AS (
    SELECT 
      channel,
      medium,
      COUNT(DISTINCT visitor_id) as conversions,
      COUNT(DISTINCT campaign) as campaigns
    FROM visitor_touchpoints
    WHERE touch_order = 1
    GROUP BY channel, medium
  ),
  last_touch_attribution AS (
    SELECT 
      channel,
      medium,
      COUNT(DISTINCT visitor_id) as conversions,
      COUNT(DISTINCT campaign) as campaigns
    FROM visitor_touchpoints
    WHERE reverse_order = 1
    GROUP BY channel, medium
  ),
  campaign_stats AS (
    SELECT 
      campaign,
      channel as source,
      medium,
      COUNT(DISTINCT visitor_id) as conversions
    FROM visitor_touchpoints
    WHERE campaign IS NOT NULL
      AND (
        (_attribution_model = 'first_touch' AND touch_order = 1)
        OR (_attribution_model = 'last_touch' AND reverse_order = 1)
        OR (_attribution_model NOT IN ('first_touch', 'last_touch'))
      )
    GROUP BY campaign, channel, medium
    ORDER BY conversions DESC
    LIMIT 10
  ),
  path_analysis AS (
    SELECT 
      visitor_id,
      string_agg(channel, ' → ' ORDER BY touch_order) as path,
      COUNT(*) as touchpoints
    FROM visitor_touchpoints
    GROUP BY visitor_id
  ),
  common_paths AS (
    SELECT 
      path,
      COUNT(*) as conversions,
      ROUND(AVG(touchpoints), 1) as avg_touchpoints
    FROM path_analysis
    GROUP BY path
    ORDER BY conversions DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'summary', json_build_object(
      'total_conversions', (SELECT COUNT(*) FROM conversions),
      'converting_visitors', (SELECT COUNT(DISTINCT visitor_id) FROM conversions)
    ),
    'firstTouch', COALESCE((SELECT json_agg(row_to_json(f)) FROM first_touch_attribution f), '[]'::json),
    'lastTouch', COALESCE((SELECT json_agg(row_to_json(l)) FROM last_touch_attribution l), '[]'::json),
    'campaigns', COALESCE((SELECT json_agg(row_to_json(c)) FROM campaign_stats c), '[]'::json),
    'paths', COALESCE((SELECT json_agg(row_to_json(p)) FROM common_paths p), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;