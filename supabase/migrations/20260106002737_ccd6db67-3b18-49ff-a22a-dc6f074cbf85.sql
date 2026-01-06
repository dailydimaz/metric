-- =============================================
-- Analytics RPCs for server-side aggregation
-- =============================================

-- Add optimized composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_events_analytics_composite
ON public.events (site_id, event_name, created_at DESC)
INCLUDE (visitor_id, url, session_id, referrer, browser, os, device_type, country, city, language, properties);

-- =============================================
-- 1. get_site_stats - Overall stats with comparison
-- =============================================
CREATE OR REPLACE FUNCTION public.get_site_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _prev_start_date timestamptz,
  _prev_end_date timestamptz
)
RETURNS TABLE(
  total_pageviews bigint,
  unique_visitors bigint,
  bounce_rate numeric,
  pageviews_change numeric,
  visitors_change numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pageviews bigint;
  v_visitors bigint;
  v_bounce_rate numeric;
  v_prev_pageviews bigint;
  v_prev_visitors bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Current period stats
  SELECT 
    COUNT(*),
    COUNT(DISTINCT visitor_id)
  INTO v_pageviews, v_visitors
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date;

  -- Bounce rate: sessions with only 1 pageview / total sessions
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

  -- Previous period stats
  SELECT 
    COUNT(*),
    COUNT(DISTINCT visitor_id)
  INTO v_prev_pageviews, v_prev_visitors
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _prev_start_date
    AND created_at <= _prev_end_date;

  RETURN QUERY SELECT
    v_pageviews,
    v_visitors,
    COALESCE(v_bounce_rate, 0::numeric),
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

-- =============================================
-- 2. get_timeseries_stats - Daily aggregation with previous period
-- =============================================
CREATE OR REPLACE FUNCTION public.get_timeseries_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _prev_start_date timestamptz,
  _prev_end_date timestamptz
)
RETURNS TABLE(
  date text,
  pageviews bigint,
  visitors bigint,
  prev_pageviews bigint,
  prev_visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period_days integer;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  period_days := EXTRACT(DAY FROM (_end_date - _start_date))::integer + 1;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      DATE_TRUNC('day', _start_date),
      DATE_TRUNC('day', _end_date),
      '1 day'::interval
    )::date AS d
  ),
  current_data AS (
    SELECT 
      DATE_TRUNC('day', created_at)::date AS event_date,
      COUNT(*) AS pageviews,
      COUNT(DISTINCT visitor_id) AS visitors
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND created_at >= _start_date
      AND created_at <= _end_date
    GROUP BY DATE_TRUNC('day', created_at)::date
  ),
  prev_data AS (
    SELECT 
      DATE_TRUNC('day', created_at)::date AS event_date,
      COUNT(*) AS pageviews,
      COUNT(DISTINCT visitor_id) AS visitors
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND created_at >= _prev_start_date
      AND created_at <= _prev_end_date
    GROUP BY DATE_TRUNC('day', created_at)::date
  ),
  indexed_dates AS (
    SELECT d, ROW_NUMBER() OVER (ORDER BY d) - 1 AS idx
    FROM date_series
  ),
  prev_indexed AS (
    SELECT 
      (DATE_TRUNC('day', _prev_start_date)::date + (idx || ' days')::interval)::date AS prev_date,
      idx
    FROM indexed_dates
  )
  SELECT 
    TO_CHAR(ds.d, 'YYYY-MM-DD'),
    COALESCE(cd.pageviews, 0),
    COALESCE(cd.visitors, 0),
    COALESCE(pd.pageviews, 0),
    COALESCE(pd.visitors, 0)
  FROM date_series ds
  LEFT JOIN indexed_dates id ON id.d = ds.d
  LEFT JOIN current_data cd ON cd.event_date = ds.d
  LEFT JOIN prev_indexed pi ON pi.idx = id.idx
  LEFT JOIN prev_data pd ON pd.event_date = pi.prev_date
  ORDER BY ds.d;
END;
$$;

-- =============================================
-- 3. get_top_pages - Top pages by pageviews
-- =============================================
CREATE OR REPLACE FUNCTION public.get_top_pages(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  url text,
  pageviews bigint,
  unique_visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(e.url, '/') AS url,
    COUNT(*) AS pageviews,
    COUNT(DISTINCT e.visitor_id) AS unique_visitors
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
  GROUP BY COALESCE(e.url, '/')
  ORDER BY pageviews DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- 4. get_top_referrers - Top referrers
-- =============================================
CREATE OR REPLACE FUNCTION public.get_top_referrers(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  referrer text,
  visits bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_with_referrer bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_with_referrer
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND referrer IS NOT NULL
    AND referrer != '';

  RETURN QUERY
  WITH parsed_referrers AS (
    SELECT 
      CASE 
        WHEN e.referrer ~ '^https?://' 
        THEN regexp_replace(e.referrer, '^https?://([^/]+).*', '\1')
        ELSE e.referrer
      END AS domain
    FROM events e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND e.referrer IS NOT NULL
      AND e.referrer != ''
  )
  SELECT 
    pr.domain AS referrer,
    COUNT(*) AS visits,
    CASE WHEN total_with_referrer > 0 
      THEN ROUND((COUNT(*)::numeric / total_with_referrer::numeric) * 100, 1)
      ELSE 0
    END AS percentage
  FROM parsed_referrers pr
  GROUP BY pr.domain
  ORDER BY visits DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- 5. get_device_stats - Browser, OS, Device type
-- =============================================
CREATE OR REPLACE FUNCTION public.get_device_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_events bigint;
  result jsonb;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_events
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date;

  SELECT jsonb_build_object(
    'browsers', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'name', browser,
          'value', cnt,
          'percentage', CASE WHEN total_events > 0 THEN ROUND((cnt::numeric / total_events::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT browser, COUNT(*) as cnt
        FROM events
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND browser IS NOT NULL
        GROUP BY browser
      ) b
    ),
    'operatingSystems', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'name', os,
          'value', cnt,
          'percentage', CASE WHEN total_events > 0 THEN ROUND((cnt::numeric / total_events::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT os, COUNT(*) as cnt
        FROM events
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND os IS NOT NULL
        GROUP BY os
      ) o
    ),
    'devices', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'name', device_type,
          'value', cnt,
          'percentage', CASE WHEN total_events > 0 THEN ROUND((cnt::numeric / total_events::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT device_type, COUNT(*) as cnt
        FROM events
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND device_type IS NOT NULL
        GROUP BY device_type
      ) d
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- =============================================
-- 6. get_geo_stats - Country stats
-- =============================================
CREATE OR REPLACE FUNCTION public.get_geo_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  country text,
  visits bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_with_country bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_with_country
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND country IS NOT NULL;

  RETURN QUERY
  SELECT 
    e.country,
    COUNT(*) AS visits,
    CASE WHEN total_with_country > 0 
      THEN ROUND((COUNT(*)::numeric / total_with_country::numeric) * 100, 1)
      ELSE 0
    END AS percentage
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.country IS NOT NULL
  GROUP BY e.country
  ORDER BY visits DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- 7. get_city_stats - City stats
-- =============================================
CREATE OR REPLACE FUNCTION public.get_city_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  city text,
  country text,
  visits bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_with_city bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_with_city
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND city IS NOT NULL;

  RETURN QUERY
  SELECT 
    e.city,
    COALESCE(e.country, 'Unknown') AS country,
    COUNT(*) AS visits,
    CASE WHEN total_with_city > 0 
      THEN ROUND((COUNT(*)::numeric / total_with_city::numeric) * 100, 1)
      ELSE 0
    END AS percentage
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.city IS NOT NULL
  GROUP BY e.city, e.country
  ORDER BY visits DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- 8. get_language_stats - Language stats
-- =============================================
CREATE OR REPLACE FUNCTION public.get_language_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  language text,
  visits bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_with_language bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_with_language
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND language IS NOT NULL;

  RETURN QUERY
  SELECT 
    e.language,
    COUNT(*) AS visits,
    CASE WHEN total_with_language > 0 
      THEN ROUND((COUNT(*)::numeric / total_with_language::numeric) * 100, 1)
      ELSE 0
    END AS percentage
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.language IS NOT NULL
  GROUP BY e.language
  ORDER BY visits DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- 9. get_utm_stats - UTM campaign stats
-- =============================================
CREATE OR REPLACE FUNCTION public.get_utm_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_with_utm bigint;
  result jsonb;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Count events with any UTM parameter
  SELECT COUNT(*) INTO total_with_utm
  FROM events
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
        FROM events
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
        FROM events
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
        FROM events
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND properties->'utm'->>'utm_campaign' IS NOT NULL
        GROUP BY properties->'utm'->>'utm_campaign'
        ORDER BY cnt DESC
        LIMIT _limit
      ) c
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_site_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_timeseries_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_referrers TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_device_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_geo_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_city_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_language_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_utm_stats TO authenticated;