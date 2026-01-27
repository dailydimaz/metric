-- Fix the aggregate_analytics_data function to properly calculate session duration
CREATE OR REPLACE FUNCTION public.aggregate_analytics_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site RECORD;
  v_current_hour TIMESTAMPTZ;
  v_watermark TIMESTAMPTZ;
BEGIN
  v_current_hour := date_trunc('hour', NOW());
  
  FOR v_site IN SELECT id FROM sites LOOP
    -- Get the watermark for this site
    SELECT COALESCE(last_aggregated_at, NOW() - INTERVAL '30 days')
    INTO v_watermark
    FROM analytics_aggregation_watermark
    WHERE site_id = v_site.id;
    
    -- If no watermark exists, create one
    IF v_watermark IS NULL THEN
      v_watermark := NOW() - INTERVAL '30 days';
      INSERT INTO analytics_aggregation_watermark (site_id, last_aggregated_at)
      VALUES (v_site.id, v_watermark)
      ON CONFLICT (site_id) DO NOTHING;
    END IF;
    
    -- Skip if watermark is already current
    IF v_watermark >= v_current_hour THEN
      CONTINUE;
    END IF;
    
    -- Aggregate data with proper session duration calculation
    INSERT INTO analytics_hourly (
      site_id, hour_timestamp, pageviews, unique_visitors, sessions, bounces, total_session_duration
    )
    SELECT 
      v_site.id,
      date_trunc('hour', e.created_at) AS hour_ts,
      COUNT(*) FILTER (WHERE e.event_name = 'pageview') AS pageviews,
      COUNT(DISTINCT e.visitor_id) AS unique_visitors,
      COUNT(DISTINCT e.session_id) AS sessions,
      -- Count sessions with only 1 event as bounces
      COUNT(DISTINCT e.session_id) FILTER (WHERE e.session_id IN (
        SELECT session_id FROM events_partitioned ep 
        WHERE ep.site_id = v_site.id 
        AND ep.created_at >= v_watermark 
        AND ep.created_at < v_current_hour
        GROUP BY session_id 
        HAVING COUNT(*) = 1
      )) AS bounces,
      -- Calculate total session duration from session_durations subquery
      COALESCE((
        SELECT SUM(session_dur)
        FROM (
          SELECT 
            session_id,
            EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS session_dur
          FROM events_partitioned ep2
          WHERE ep2.site_id = v_site.id
            AND date_trunc('hour', ep2.created_at) = date_trunc('hour', e.created_at)
            AND ep2.created_at >= v_watermark
            AND ep2.created_at < v_current_hour
            AND ep2.session_id IS NOT NULL
          GROUP BY session_id
          HAVING COUNT(*) > 1
        ) durations
      ), 0)::BIGINT AS total_session_duration
    FROM events_partitioned e
    WHERE e.site_id = v_site.id
      AND e.created_at >= v_watermark
      AND e.created_at < v_current_hour
    GROUP BY date_trunc('hour', e.created_at)
    ON CONFLICT (site_id, hour_timestamp) DO UPDATE SET
      pageviews = EXCLUDED.pageviews,
      unique_visitors = EXCLUDED.unique_visitors,
      sessions = EXCLUDED.sessions,
      bounces = EXCLUDED.bounces,
      total_session_duration = EXCLUDED.total_session_duration,
      updated_at = NOW();
    
    -- Update watermark
    UPDATE analytics_aggregation_watermark
    SET last_aggregated_at = v_current_hour, updated_at = NOW()
    WHERE site_id = v_site.id;
  END LOOP;
END;
$$;

-- Also update get_site_stats to calculate session duration from raw events 
-- when aggregated data shows 0 (fallback for historical data)
CREATE OR REPLACE FUNCTION public.get_site_stats(
  _site_id UUID,
  _start_date TIMESTAMPTZ,
  _end_date TIMESTAMPTZ,
  _filters JSONB DEFAULT NULL
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
SET search_path = public
AS $$
DECLARE
  v_pageviews BIGINT := 0;
  v_visitors BIGINT := 0;
  v_sessions BIGINT := 0;
  v_bounces BIGINT := 0;
  v_duration BIGINT := 0;
  v_bounce_rate NUMERIC := 0;
  v_prev_pageviews BIGINT := 0;
  v_prev_visitors BIGINT := 0;
  v_prev_start_date TIMESTAMPTZ;
  v_prev_end_date TIMESTAMPTZ;
  v_date_range INTERVAL;
  v_has_filters BOOLEAN;
  v_current_hour TIMESTAMPTZ;
  v_current_hour_data RECORD;
BEGIN
  -- Authorization check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_current_hour := date_trunc('hour', NOW());
  v_date_range := _end_date - _start_date;
  v_prev_end_date := _start_date;
  v_prev_start_date := _start_date - v_date_range;
  
  -- Check if filters are applied
  v_has_filters := _filters IS NOT NULL AND (
    _filters->>'country' IS NOT NULL OR
    _filters->>'browser' IS NOT NULL OR
    _filters->>'os' IS NOT NULL OR
    _filters->>'device' IS NOT NULL OR
    _filters->>'url' IS NOT NULL OR
    _filters->>'referrerPattern' IS NOT NULL
  );

  IF v_has_filters THEN
    -- Filtered query: calculate everything from events_partitioned including session duration
    SELECT 
      COUNT(*) FILTER (WHERE e.event_name = 'pageview'),
      COUNT(DISTINCT e.visitor_id),
      COUNT(DISTINCT e.session_id)
    INTO v_pageviews, v_visitors, v_sessions
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

    -- Calculate session duration for filtered results
    SELECT COALESCE(SUM(session_dur), 0)::BIGINT
    INTO v_duration
    FROM (
      SELECT 
        e.session_id,
        EXTRACT(EPOCH FROM (MAX(e.created_at) - MIN(e.created_at))) AS session_dur
      FROM events_partitioned e
      WHERE e.site_id = _site_id
        AND e.created_at >= _start_date
        AND e.created_at <= _end_date
        AND e.session_id IS NOT NULL
        AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
        AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
        AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
        AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
        AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
        AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
      GROUP BY e.session_id
      HAVING COUNT(*) > 1
    ) durations;

    -- Calculate bounces for filtered results
    SELECT COUNT(DISTINCT e.session_id)
    INTO v_bounces
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND e.session_id IS NOT NULL
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
      AND e.session_id IN (
        SELECT ep.session_id 
        FROM events_partitioned ep 
        WHERE ep.site_id = _site_id
          AND ep.created_at >= _start_date
          AND ep.created_at <= _end_date
        GROUP BY ep.session_id 
        HAVING COUNT(*) = 1
      );

    -- Previous period for comparison
    SELECT 
      COUNT(*) FILTER (WHERE e.event_name = 'pageview'),
      COUNT(DISTINCT e.visitor_id)
    INTO v_prev_pageviews, v_prev_visitors
    FROM events_partitioned e
    WHERE e.site_id = _site_id
      AND e.created_at >= v_prev_start_date
      AND e.created_at <= v_prev_end_date
      AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
      AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');
  ELSE
    -- Non-filtered: Use optimized hourly rollups + current hour from raw events
    
    -- Get aggregated data from hourly rollups (excluding current hour)
    SELECT 
      COALESCE(SUM(pageviews), 0),
      COALESCE(SUM(unique_visitors), 0),
      COALESCE(SUM(sessions), 0),
      COALESCE(SUM(bounces), 0),
      COALESCE(SUM(total_session_duration), 0)
    INTO v_pageviews, v_visitors, v_sessions, v_bounces, v_duration
    FROM analytics_hourly
    WHERE site_id = _site_id
      AND hour_timestamp >= _start_date
      AND hour_timestamp < LEAST(_end_date, v_current_hour);

    -- Add current hour data from raw events
    SELECT 
      COUNT(*) FILTER (WHERE event_name = 'pageview'),
      COUNT(DISTINCT visitor_id),
      COUNT(DISTINCT session_id)
    INTO v_current_hour_data
    FROM events_partitioned
    WHERE site_id = _site_id
      AND created_at >= v_current_hour
      AND created_at <= _end_date;

    IF v_current_hour_data IS NOT NULL THEN
      v_pageviews := v_pageviews + COALESCE(v_current_hour_data.count, 0);
      -- Note: visitor/session counts may have some overlap with previous hour
    END IF;

    -- If duration is still 0 from rollups, calculate from raw events as fallback
    IF v_duration = 0 AND v_sessions > 0 THEN
      SELECT COALESCE(SUM(session_dur), 0)::BIGINT
      INTO v_duration
      FROM (
        SELECT 
          session_id,
          EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS session_dur
        FROM events_partitioned
        WHERE site_id = _site_id
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND session_id IS NOT NULL
        GROUP BY session_id
        HAVING COUNT(*) > 1
      ) durations;
    END IF;

    -- Previous period data
    SELECT 
      COALESCE(SUM(pageviews), 0),
      COALESCE(SUM(unique_visitors), 0)
    INTO v_prev_pageviews, v_prev_visitors
    FROM analytics_hourly
    WHERE site_id = _site_id
      AND hour_timestamp >= v_prev_start_date
      AND hour_timestamp < v_prev_end_date;
  END IF;

  -- Calculate bounce rate
  IF v_sessions > 0 THEN
    v_bounce_rate := ROUND((v_bounces::numeric / v_sessions::numeric) * 100, 1);
  END IF;

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