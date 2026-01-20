-- Fix the get_attribution_stats function with correct has_team_role call signature
CREATE OR REPLACE FUNCTION public.get_attribution_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _goal_event text DEFAULT 'conversion',
  _attribution_model text DEFAULT 'last_touch'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check authorization: user must own the site or be a team member
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
    FROM events
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
    FROM events e
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