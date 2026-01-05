-- Analytics RPC Functions Migration
-- These functions move complex analytics aggregation from client-side JS to server-side PostgreSQL
-- for dramatic performance improvements and reduced network transfer

-- =====================================================
-- 1. GET_GOAL_STATS - Calculate goal conversions server-side
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_goal_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  goal_id uuid,
  goal_name text,
  event_name text,
  url_match text,
  match_type text,
  conversions bigint,
  total_visitors bigint,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: user must own the site or be a team member
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH total_visitors_cte AS (
    -- Count unique visitors who had pageviews in the date range
    SELECT COUNT(DISTINCT e.visitor_id) AS total
    FROM events e
    WHERE e.site_id = _site_id
      AND e.event_name = 'pageview'
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
  ),
  goal_conversions AS (
    SELECT 
      g.id AS goal_id,
      g.name AS goal_name,
      g.event_name,
      g.url_match,
      g.match_type,
      COUNT(DISTINCT e.visitor_id) AS conversions
    FROM goals g
    LEFT JOIN events e ON e.site_id = g.site_id
      AND e.event_name = g.event_name
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND (
        g.url_match IS NULL
        OR (g.match_type = 'exact' AND e.url = g.url_match)
        OR (g.match_type = 'contains' AND e.url LIKE '%' || g.url_match || '%')
        OR (g.match_type = 'starts_with' AND e.url LIKE g.url_match || '%')
        OR (g.match_type = 'regex' AND e.url ~ g.url_match)
      )
    WHERE g.site_id = _site_id
    GROUP BY g.id, g.name, g.event_name, g.url_match, g.match_type
  )
  SELECT 
    gc.goal_id,
    gc.goal_name,
    gc.event_name,
    gc.url_match,
    gc.match_type,
    gc.conversions,
    tv.total AS total_visitors,
    CASE WHEN tv.total > 0 
      THEN ROUND((gc.conversions::numeric / tv.total::numeric) * 100, 2)
      ELSE 0
    END AS conversion_rate
  FROM goal_conversions gc
  CROSS JOIN total_visitors_cte tv;
END;
$$;

-- =====================================================
-- 2. GET_RETENTION_COHORTS - Calculate cohort-based retention
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_retention_cohorts(
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
  result jsonb;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH visitor_first_seen AS (
    -- Find the first visit date for each visitor
    SELECT 
      visitor_id,
      DATE_TRUNC('day', MIN(created_at)) AS first_seen_date
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND visitor_id IS NOT NULL
      AND created_at >= _start_date
      AND created_at <= _end_date
    GROUP BY visitor_id
  ),
  visitor_activity AS (
    -- Get all unique activity dates per visitor
    SELECT DISTINCT
      visitor_id,
      DATE_TRUNC('day', created_at) AS activity_date
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND visitor_id IS NOT NULL
  ),
  cohort_data AS (
    -- Build cohort statistics for each first_seen_date
    SELECT 
      vfs.first_seen_date AS cohort_date,
      COUNT(DISTINCT vfs.visitor_id) AS cohort_size,
      -- Day 1 retention
      COUNT(DISTINCT CASE 
        WHEN va.activity_date = vfs.first_seen_date + INTERVAL '1 day' 
        THEN vfs.visitor_id 
      END) AS day_1_retained,
      -- Day 3 retention
      COUNT(DISTINCT CASE 
        WHEN va.activity_date = vfs.first_seen_date + INTERVAL '3 days' 
        THEN vfs.visitor_id 
      END) AS day_3_retained,
      -- Day 7 retention
      COUNT(DISTINCT CASE 
        WHEN va.activity_date = vfs.first_seen_date + INTERVAL '7 days' 
        THEN vfs.visitor_id 
      END) AS day_7_retained,
      -- Day 14 retention
      COUNT(DISTINCT CASE 
        WHEN va.activity_date = vfs.first_seen_date + INTERVAL '14 days' 
        THEN vfs.visitor_id 
      END) AS day_14_retained,
      -- Day 30 retention
      COUNT(DISTINCT CASE 
        WHEN va.activity_date = vfs.first_seen_date + INTERVAL '30 days' 
        THEN vfs.visitor_id 
      END) AS day_30_retained
    FROM visitor_first_seen vfs
    LEFT JOIN visitor_activity va ON va.visitor_id = vfs.visitor_id
    GROUP BY vfs.first_seen_date
    ORDER BY vfs.first_seen_date DESC
  ),
  cohorts_json AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'cohort_date', cohort_date,
        'cohort_size', cohort_size,
        'retention', jsonb_build_array(
          jsonb_build_object('day', 1, 'retained', day_1_retained, 'rate', 
            CASE WHEN cohort_size > 0 THEN ROUND((day_1_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END),
          jsonb_build_object('day', 3, 'retained', day_3_retained, 'rate', 
            CASE WHEN cohort_size > 0 THEN ROUND((day_3_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END),
          jsonb_build_object('day', 7, 'retained', day_7_retained, 'rate', 
            CASE WHEN cohort_size > 0 THEN ROUND((day_7_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END),
          jsonb_build_object('day', 14, 'retained', day_14_retained, 'rate', 
            CASE WHEN cohort_size > 0 THEN ROUND((day_14_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END),
          jsonb_build_object('day', 30, 'retained', day_30_retained, 'rate', 
            CASE WHEN cohort_size > 0 THEN ROUND((day_30_retained::numeric / cohort_size::numeric) * 100, 1) ELSE 0 END)
        )
      )
    ) AS cohorts
    FROM cohort_data
  ),
  summary_data AS (
    -- Calculate average retention rates across all cohorts
    SELECT
      jsonb_build_array(
        jsonb_build_object('day', 1, 'average_rate', 
          ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_1_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1)),
        jsonb_build_object('day', 3, 'average_rate', 
          ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_3_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1)),
        jsonb_build_object('day', 7, 'average_rate', 
          ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_7_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1)),
        jsonb_build_object('day', 14, 'average_rate', 
          ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_14_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1)),
        jsonb_build_object('day', 30, 'average_rate', 
          ROUND(AVG(CASE WHEN cohort_size > 0 THEN (day_30_retained::numeric / cohort_size::numeric) * 100 ELSE 0 END), 1))
      ) AS summary
    FROM cohort_data
  )
  SELECT jsonb_build_object(
    'cohorts', COALESCE(cj.cohorts, '[]'::jsonb),
    'summary', COALESCE(sd.summary, '[]'::jsonb)
  )
  INTO result
  FROM cohorts_json cj
  CROSS JOIN summary_data sd;

  RETURN COALESCE(result, jsonb_build_object('cohorts', '[]'::jsonb, 'summary', '[]'::jsonb));
END;
$$;

-- =====================================================
-- 3. GET_RETENTION_TREND - Calculate daily retention curve (Day 0-30)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_retention_trend(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  day integer,
  retained bigint,
  rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_visitors bigint;
BEGIN
  -- Security check
  IF NOT (is_site_owner(_site_id) OR has_team_role(_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get total unique visitors in the period
  SELECT COUNT(DISTINCT visitor_id) INTO total_visitors
  FROM events
  WHERE site_id = _site_id
    AND event_name = 'pageview'
    AND visitor_id IS NOT NULL
    AND created_at >= _start_date
    AND created_at <= _end_date;

  RETURN QUERY
  WITH visitor_first_seen AS (
    SELECT 
      visitor_id,
      DATE_TRUNC('day', MIN(created_at)) AS first_seen_date
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND visitor_id IS NOT NULL
      AND created_at >= _start_date
      AND created_at <= _end_date
    GROUP BY visitor_id
  ),
  visitor_activity AS (
    SELECT DISTINCT
      visitor_id,
      DATE_TRUNC('day', created_at) AS activity_date
    FROM events
    WHERE site_id = _site_id
      AND event_name = 'pageview'
      AND visitor_id IS NOT NULL
  ),
  retention_by_day AS (
    SELECT 
      d.day_num AS day,
      COUNT(DISTINCT CASE 
        WHEN va.activity_date = vfs.first_seen_date + (d.day_num * INTERVAL '1 day')
        THEN vfs.visitor_id 
      END) AS retained
    FROM visitor_first_seen vfs
    CROSS JOIN generate_series(0, 30) AS d(day_num)
    LEFT JOIN visitor_activity va ON va.visitor_id = vfs.visitor_id
    GROUP BY d.day_num
  )
  SELECT 
    rbd.day,
    rbd.retained,
    CASE WHEN total_visitors > 0 
      THEN ROUND((rbd.retained::numeric / total_visitors::numeric) * 100, 1)
      ELSE 0
    END AS rate
  FROM retention_by_day rbd
  ORDER BY rbd.day;
END;
$$;

-- =====================================================
-- 4. GET_FUNNEL_STATS - Calculate funnel step conversions
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_funnel_stats(
  _funnel_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
RETURNS TABLE(
  step_index integer,
  step_name text,
  visitors bigint,
  conversion_rate numeric,
  drop_off_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_id uuid;
  v_steps jsonb;
  v_time_window_days integer;
BEGIN
  -- Get funnel details
  SELECT site_id, steps, COALESCE(time_window_days, 7)
  INTO v_site_id, v_steps, v_time_window_days
  FROM funnels
  WHERE id = _funnel_id;

  IF v_site_id IS NULL THEN
    RAISE EXCEPTION 'Funnel not found';
  END IF;

  -- Security check
  IF NOT (is_site_owner(v_site_id) OR has_team_role(v_site_id, 'viewer')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH funnel_steps AS (
    -- Parse funnel steps from JSONB
    SELECT 
      (step_data->>'order')::integer AS step_order,
      step_data->>'name' AS step_name,
      step_data->>'event_name' AS event_name,
      step_data->>'url_match' AS url_match,
      step_data->>'match_type' AS match_type
    FROM jsonb_array_elements(v_steps) AS step_data
    ORDER BY (step_data->>'order')::integer
  ),
  step_events AS (
    -- Get all matching events for each step
    SELECT 
      fs.step_order,
      fs.step_name,
      e.visitor_id,
      e.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY fs.step_order, e.visitor_id 
        ORDER BY e.created_at
      ) AS event_rank
    FROM funnel_steps fs
    JOIN events e ON e.site_id = v_site_id
      AND e.event_name = fs.event_name
      AND e.created_at >= _start_date
      AND e.created_at <= _end_date
      AND e.visitor_id IS NOT NULL
      AND (
        fs.url_match IS NULL OR fs.url_match = ''
        OR (fs.match_type = 'exact' AND e.url = fs.url_match)
        OR (fs.match_type = 'contains' AND e.url LIKE '%' || fs.url_match || '%')
        OR (fs.match_type = 'starts_with' AND e.url LIKE fs.url_match || '%')
        OR (fs.match_type IS NULL AND e.url LIKE '%' || fs.url_match || '%')
      )
  ),
  -- Find visitors who completed each step in sequence with time window
  step_1_visitors AS (
    SELECT visitor_id, MIN(created_at) AS step_time
    FROM step_events
    WHERE step_order = 0 AND event_rank = 1
    GROUP BY visitor_id
  ),
  step_2_visitors AS (
    SELECT se.visitor_id, MIN(se.created_at) AS step_time
    FROM step_events se
    JOIN step_1_visitors s1 ON s1.visitor_id = se.visitor_id
    WHERE se.step_order = 1
      AND se.created_at > s1.step_time
      AND se.created_at <= s1.step_time + (v_time_window_days * INTERVAL '1 day')
    GROUP BY se.visitor_id
  ),
  step_3_visitors AS (
    SELECT se.visitor_id, MIN(se.created_at) AS step_time
    FROM step_events se
    JOIN step_2_visitors s2 ON s2.visitor_id = se.visitor_id
    WHERE se.step_order = 2
      AND se.created_at > s2.step_time
      AND se.created_at <= s2.step_time + (v_time_window_days * INTERVAL '1 day')
    GROUP BY se.visitor_id
  ),
  step_4_visitors AS (
    SELECT se.visitor_id, MIN(se.created_at) AS step_time
    FROM step_events se
    JOIN step_3_visitors s3 ON s3.visitor_id = se.visitor_id
    WHERE se.step_order = 3
      AND se.created_at > s3.step_time
      AND se.created_at <= s3.step_time + (v_time_window_days * INTERVAL '1 day')
    GROUP BY se.visitor_id
  ),
  step_5_visitors AS (
    SELECT se.visitor_id, MIN(se.created_at) AS step_time
    FROM step_events se
    JOIN step_4_visitors s4 ON s4.visitor_id = se.visitor_id
    WHERE se.step_order = 4
      AND se.created_at > s4.step_time
      AND se.created_at <= s4.step_time + (v_time_window_days * INTERVAL '1 day')
    GROUP BY se.visitor_id
  ),
  step_counts AS (
    SELECT 0 AS step_order, (SELECT step_name FROM funnel_steps WHERE step_order = 0) AS step_name, COUNT(*) AS visitors FROM step_1_visitors
    UNION ALL
    SELECT 1, (SELECT step_name FROM funnel_steps WHERE step_order = 1), COUNT(*) FROM step_2_visitors WHERE EXISTS (SELECT 1 FROM funnel_steps WHERE step_order = 1)
    UNION ALL
    SELECT 2, (SELECT step_name FROM funnel_steps WHERE step_order = 2), COUNT(*) FROM step_3_visitors WHERE EXISTS (SELECT 1 FROM funnel_steps WHERE step_order = 2)
    UNION ALL
    SELECT 3, (SELECT step_name FROM funnel_steps WHERE step_order = 3), COUNT(*) FROM step_4_visitors WHERE EXISTS (SELECT 1 FROM funnel_steps WHERE step_order = 3)
    UNION ALL
    SELECT 4, (SELECT step_name FROM funnel_steps WHERE step_order = 4), COUNT(*) FROM step_5_visitors WHERE EXISTS (SELECT 1 FROM funnel_steps WHERE step_order = 4)
  ),
  step_with_prev AS (
    SELECT 
      sc.step_order,
      sc.step_name,
      sc.visitors,
      LAG(sc.visitors) OVER (ORDER BY sc.step_order) AS prev_visitors,
      FIRST_VALUE(sc.visitors) OVER (ORDER BY sc.step_order) AS first_step_visitors
    FROM step_counts sc
    WHERE sc.step_name IS NOT NULL
  )
  SELECT 
    swp.step_order AS step_index,
    swp.step_name,
    swp.visitors,
    CASE WHEN swp.first_step_visitors > 0 
      THEN ROUND((swp.visitors::numeric / swp.first_step_visitors::numeric) * 100, 1)
      ELSE 0
    END AS conversion_rate,
    CASE WHEN swp.prev_visitors IS NOT NULL AND swp.prev_visitors > 0
      THEN ROUND(((swp.prev_visitors - swp.visitors)::numeric / swp.prev_visitors::numeric) * 100, 1)
      ELSE 0
    END AS drop_off_rate
  FROM step_with_prev swp
  ORDER BY swp.step_order;
END;
$$;

-- =====================================================
-- 5. Grant execute permissions to authenticated users
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_goal_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_retention_cohorts(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_retention_trend(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_funnel_stats(uuid, timestamptz, timestamptz) TO authenticated;