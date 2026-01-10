-- Update get_site_stats to support filters
CREATE OR REPLACE FUNCTION public.get_site_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _prev_start_date timestamp with time zone, 
  _prev_end_date timestamp with time zone,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(total_pageviews bigint, unique_visitors bigint, bounce_rate numeric, pageviews_change numeric, visitors_change numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    AND created_at <= _end_date
    AND (_filters->>'country' IS NULL OR country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

  -- Bounce rate: sessions with only 1 pageview / total sessions
  WITH session_counts AS (
    SELECT session_id, COUNT(*) as cnt
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND created_at >= _start_date
      AND created_at <= _end_date
      AND session_id IS NOT NULL
      AND (_filters->>'country' IS NULL OR country = _filters->>'country')
      AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
      AND (_filters->>'os' IS NULL OR os = _filters->>'os')
      AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
      AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
      AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
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
    AND created_at <= _prev_end_date
    AND (_filters->>'country' IS NULL OR country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

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
$function$;

-- Update get_timeseries_stats to support filters
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
AS $function$
DECLARE
  period_days int;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  period_days := EXTRACT(DAY FROM (_end_date - _start_date))::int + 1;

  RETURN QUERY
  WITH current_data AS (
    SELECT 
      to_char(e.created_at, 'YYYY-MM-DD') as day,
      COUNT(*) as pv,
      COUNT(DISTINCT e.visitor_id) as vis
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
      AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
    GROUP BY to_char(e.created_at, 'YYYY-MM-DD')
  ),
  prev_data AS (
    SELECT 
      to_char(e.created_at + (period_days || ' days')::interval, 'YYYY-MM-DD') as day,
      COUNT(*) as pv,
      COUNT(DISTINCT e.visitor_id) as vis
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
END;
$function$;

-- Update get_top_pages to support filters
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
AS $function$
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
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
  GROUP BY COALESCE(e.url, '/')
  ORDER BY pageviews DESC
  LIMIT _limit;
END;
$function$;

-- Update get_top_referrers to support filters
CREATE OR REPLACE FUNCTION public.get_top_referrers(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(referrer text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_visits bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_visits
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.referrer IS NOT NULL
    AND e.referrer != ''
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

  RETURN QUERY
  SELECT 
    e.referrer,
    COUNT(*) AS visits,
    CASE WHEN total_visits > 0 
      THEN ROUND((COUNT(*)::numeric / total_visits::numeric) * 100, 1)
      ELSE 0
    END AS percentage
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.referrer IS NOT NULL
    AND e.referrer != ''
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
  GROUP BY e.referrer
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- Update get_device_stats to support filters
CREATE OR REPLACE FUNCTION public.get_device_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    AND created_at <= _end_date
    AND (_filters->>'country' IS NULL OR country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

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
          AND (_filters->>'country' IS NULL OR country = _filters->>'country')
          AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
          AND (_filters->>'os' IS NULL OR os = _filters->>'os')
          AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
          AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
          AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
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
          AND (_filters->>'country' IS NULL OR country = _filters->>'country')
          AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
          AND (_filters->>'os' IS NULL OR os = _filters->>'os')
          AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
          AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
          AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
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
          AND (_filters->>'country' IS NULL OR country = _filters->>'country')
          AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
          AND (_filters->>'os' IS NULL OR os = _filters->>'os')
          AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
          AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
          AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
        GROUP BY device_type
      ) d
    )
  ) INTO result;

  RETURN result;
END;
$function$;

-- Update get_geo_stats to support filters
CREATE OR REPLACE FUNCTION public.get_geo_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(country text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_visits bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_visits
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.country IS NOT NULL
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

  RETURN QUERY
  SELECT 
    e.country,
    COUNT(*) AS visits,
    CASE WHEN total_visits > 0 
      THEN ROUND((COUNT(*)::numeric / total_visits::numeric) * 100, 1)
      ELSE 0
    END AS percentage
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.country IS NOT NULL
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
  GROUP BY e.country
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- Update get_city_stats to support filters
CREATE OR REPLACE FUNCTION public.get_city_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(city text, country text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_visits bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_visits
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.city IS NOT NULL
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

  RETURN QUERY
  SELECT 
    e.city,
    e.country,
    COUNT(*) AS visits,
    CASE WHEN total_visits > 0 
      THEN ROUND((COUNT(*)::numeric / total_visits::numeric) * 100, 1)
      ELSE 0
    END AS percentage
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.city IS NOT NULL
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
  GROUP BY e.city, e.country
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- Update get_language_stats to support filters
CREATE OR REPLACE FUNCTION public.get_language_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(language text, visits bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_visits bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_visits
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.language IS NOT NULL
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

  RETURN QUERY
  SELECT 
    e.language,
    COUNT(*) AS visits,
    CASE WHEN total_visits > 0 
      THEN ROUND((COUNT(*)::numeric / total_visits::numeric) * 100, 1)
      ELSE 0
    END AS percentage
  FROM events e
  WHERE e.site_id = _site_id
    AND e.event_name = 'pageview'
    AND e.created_at >= _start_date
    AND e.created_at <= _end_date
    AND e.language IS NOT NULL
    AND (_filters->>'country' IS NULL OR e.country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR e.browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR e.os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR e.device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR e.url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR e.referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
  GROUP BY e.language
  ORDER BY visits DESC
  LIMIT _limit;
END;
$function$;

-- Update get_utm_stats to support filters
CREATE OR REPLACE FUNCTION public.get_utm_stats(
  _site_id uuid, 
  _start_date timestamp with time zone, 
  _end_date timestamp with time zone, 
  _limit integer DEFAULT 10,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    AND created_at <= _end_date
    AND properties IS NOT NULL
    AND (_filters->>'country' IS NULL OR country = _filters->>'country')
    AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
    AND (_filters->>'os' IS NULL OR os = _filters->>'os')
    AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
    AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
    AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%');

  SELECT jsonb_build_object(
    'sources', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'value', source,
          'visits', cnt,
          'percentage', CASE WHEN total_events > 0 THEN ROUND((cnt::numeric / total_events::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT properties->>'utm_source' as source, COUNT(*) as cnt
        FROM events
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND properties->>'utm_source' IS NOT NULL
          AND (_filters->>'country' IS NULL OR country = _filters->>'country')
          AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
          AND (_filters->>'os' IS NULL OR os = _filters->>'os')
          AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
          AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
          AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
        GROUP BY properties->>'utm_source'
        LIMIT _limit
      ) s
    ),
    'mediums', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'value', medium,
          'visits', cnt,
          'percentage', CASE WHEN total_events > 0 THEN ROUND((cnt::numeric / total_events::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT properties->>'utm_medium' as medium, COUNT(*) as cnt
        FROM events
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND properties->>'utm_medium' IS NOT NULL
          AND (_filters->>'country' IS NULL OR country = _filters->>'country')
          AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
          AND (_filters->>'os' IS NULL OR os = _filters->>'os')
          AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
          AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
          AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
        GROUP BY properties->>'utm_medium'
        LIMIT _limit
      ) m
    ),
    'campaigns', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'value', campaign,
          'visits', cnt,
          'percentage', CASE WHEN total_events > 0 THEN ROUND((cnt::numeric / total_events::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT properties->>'utm_campaign' as campaign, COUNT(*) as cnt
        FROM events
        WHERE site_id = _site_id
          AND event_name = 'pageview'
          AND created_at >= _start_date
          AND created_at <= _end_date
          AND properties->>'utm_campaign' IS NOT NULL
          AND (_filters->>'country' IS NULL OR country = _filters->>'country')
          AND (_filters->>'browser' IS NULL OR browser = _filters->>'browser')
          AND (_filters->>'os' IS NULL OR os = _filters->>'os')
          AND (_filters->>'device' IS NULL OR device_type = _filters->>'device')
          AND (_filters->>'url' IS NULL OR url ILIKE '%' || (_filters->>'url') || '%')
          AND (_filters->>'referrerPattern' IS NULL OR referrer ILIKE '%' || (_filters->>'referrerPattern') || '%')
        GROUP BY properties->>'utm_campaign'
        LIMIT _limit
      ) c
    )
  ) INTO result;

  RETURN result;
END;
$function$;