-- Create function to get attribution data for conversions
CREATE OR REPLACE FUNCTION public.get_attribution_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _goal_event text DEFAULT 'conversion',
  _attribution_model text DEFAULT 'last_touch'
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result json;
  _is_owner boolean;
  _has_role boolean;
BEGIN
  -- Check authorization
  SELECT EXISTS (
    SELECT 1 FROM public.sites WHERE id = _site_id AND user_id = auth.uid()
  ) INTO _is_owner;
  
  SELECT public.has_team_role(auth.uid(), _site_id, 'viewer') INTO _has_role;
  
  IF NOT _is_owner AND NOT _has_role THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  WITH conversion_sessions AS (
    -- Get sessions that had a conversion event
    SELECT DISTINCT session_id, visitor_id
    FROM events
    WHERE site_id = _site_id
      AND created_at BETWEEN _start_date AND _end_date
      AND event_name = _goal_event
      AND session_id IS NOT NULL
  ),
  session_first_touch AS (
    -- Get first pageview of each converting session with attribution data
    SELECT DISTINCT ON (e.session_id)
      e.session_id,
      e.visitor_id,
      e.referrer,
      e.properties->>'utm_source' as utm_source,
      e.properties->>'utm_medium' as utm_medium,
      e.properties->>'utm_campaign' as utm_campaign,
      e.created_at
    FROM events e
    INNER JOIN conversion_sessions cs ON cs.session_id = e.session_id
    WHERE e.site_id = _site_id
      AND e.created_at BETWEEN _start_date AND _end_date
      AND e.event_name = 'pageview'
    ORDER BY e.session_id, e.created_at ASC
  ),
  session_last_touch AS (
    -- Get last pageview before conversion with attribution data
    SELECT DISTINCT ON (e.session_id)
      e.session_id,
      e.visitor_id,
      e.referrer,
      e.properties->>'utm_source' as utm_source,
      e.properties->>'utm_medium' as utm_medium,
      e.properties->>'utm_campaign' as utm_campaign,
      e.created_at
    FROM events e
    INNER JOIN conversion_sessions cs ON cs.session_id = e.session_id
    WHERE e.site_id = _site_id
      AND e.created_at BETWEEN _start_date AND _end_date
      AND e.event_name = 'pageview'
    ORDER BY e.session_id, e.created_at DESC
  ),
  -- Calculate channel from referrer/UTM
  first_touch_channels AS (
    SELECT 
      session_id,
      CASE 
        WHEN utm_source IS NOT NULL THEN utm_source
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        WHEN referrer LIKE '%google%' THEN 'Google'
        WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.%' THEN 'Facebook'
        WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter'
        WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
        WHEN referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN referrer LIKE '%youtube%' THEN 'YouTube'
        WHEN referrer LIKE '%tiktok%' THEN 'TikTok'
        WHEN referrer LIKE '%reddit%' THEN 'Reddit'
        WHEN referrer LIKE '%bing%' THEN 'Bing'
        ELSE 'Other'
      END as channel,
      COALESCE(utm_medium, 
        CASE 
          WHEN referrer LIKE '%google%' OR referrer LIKE '%bing%' THEN 'organic'
          WHEN referrer LIKE '%facebook%' OR referrer LIKE '%twitter%' OR referrer LIKE '%linkedin%' THEN 'social'
          ELSE 'referral'
        END
      ) as medium,
      utm_campaign as campaign
    FROM session_first_touch
  ),
  last_touch_channels AS (
    SELECT 
      session_id,
      CASE 
        WHEN utm_source IS NOT NULL THEN utm_source
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        WHEN referrer LIKE '%google%' THEN 'Google'
        WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.%' THEN 'Facebook'
        WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter'
        WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
        WHEN referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN referrer LIKE '%youtube%' THEN 'YouTube'
        WHEN referrer LIKE '%tiktok%' THEN 'TikTok'
        WHEN referrer LIKE '%reddit%' THEN 'Reddit'
        WHEN referrer LIKE '%bing%' THEN 'Bing'
        ELSE 'Other'
      END as channel,
      COALESCE(utm_medium, 
        CASE 
          WHEN referrer LIKE '%google%' OR referrer LIKE '%bing%' THEN 'organic'
          WHEN referrer LIKE '%facebook%' OR referrer LIKE '%twitter%' OR referrer LIKE '%linkedin%' THEN 'social'
          ELSE 'referral'
        END
      ) as medium,
      utm_campaign as campaign
    FROM session_last_touch
  ),
  -- Aggregate by channel for first touch
  first_touch_stats AS (
    SELECT 
      channel,
      medium,
      COUNT(*) as conversions,
      COUNT(DISTINCT campaign) FILTER (WHERE campaign IS NOT NULL) as campaigns
    FROM first_touch_channels
    GROUP BY channel, medium
    ORDER BY conversions DESC
  ),
  -- Aggregate by channel for last touch
  last_touch_stats AS (
    SELECT 
      channel,
      medium,
      COUNT(*) as conversions,
      COUNT(DISTINCT campaign) FILTER (WHERE campaign IS NOT NULL) as campaigns
    FROM last_touch_channels
    GROUP BY channel, medium
    ORDER BY conversions DESC
  ),
  -- Campaign performance
  campaign_stats AS (
    SELECT 
      COALESCE(ft.utm_campaign, 'No Campaign') as campaign,
      ft.utm_source as source,
      ft.utm_medium as medium,
      COUNT(*) as conversions
    FROM session_first_touch ft
    WHERE ft.utm_campaign IS NOT NULL
    GROUP BY ft.utm_campaign, ft.utm_source, ft.utm_medium
    ORDER BY conversions DESC
    LIMIT 10
  ),
  -- Conversion path analysis (simplified multi-touch)
  visitor_touchpoints AS (
    SELECT 
      e.visitor_id,
      array_agg(DISTINCT 
        CASE 
          WHEN e.properties->>'utm_source' IS NOT NULL THEN e.properties->>'utm_source'
          WHEN e.referrer IS NULL OR e.referrer = '' THEN 'Direct'
          WHEN e.referrer LIKE '%google%' THEN 'Google'
          WHEN e.referrer LIKE '%facebook%' THEN 'Facebook'
          WHEN e.referrer LIKE '%twitter%' THEN 'Twitter'
          ELSE 'Other'
        END
        ORDER BY CASE 
          WHEN e.properties->>'utm_source' IS NOT NULL THEN e.properties->>'utm_source'
          WHEN e.referrer IS NULL OR e.referrer = '' THEN 'Direct'
          WHEN e.referrer LIKE '%google%' THEN 'Google'
          WHEN e.referrer LIKE '%facebook%' THEN 'Facebook'
          WHEN e.referrer LIKE '%twitter%' THEN 'Twitter'
          ELSE 'Other'
        END
      ) as touchpoints,
      COUNT(DISTINCT e.session_id) as sessions_count
    FROM events e
    INNER JOIN conversion_sessions cs ON cs.visitor_id = e.visitor_id
    WHERE e.site_id = _site_id
      AND e.created_at BETWEEN _start_date AND _end_date
      AND e.event_name = 'pageview'
    GROUP BY e.visitor_id
  ),
  common_paths AS (
    SELECT 
      array_to_string(touchpoints, ' → ') as path,
      COUNT(*) as conversions,
      AVG(sessions_count)::int as avg_touchpoints
    FROM visitor_touchpoints
    GROUP BY touchpoints
    ORDER BY conversions DESC
    LIMIT 5
  ),
  -- Summary stats
  summary AS (
    SELECT
      COUNT(DISTINCT cs.session_id) as total_conversions,
      COUNT(DISTINCT cs.visitor_id) as converting_visitors
    FROM conversion_sessions cs
  )
  SELECT json_build_object(
    'summary', (SELECT row_to_json(summary) FROM summary),
    'firstTouch', (SELECT COALESCE(json_agg(row_to_json(first_touch_stats)), '[]'::json) FROM first_touch_stats),
    'lastTouch', (SELECT COALESCE(json_agg(row_to_json(last_touch_stats)), '[]'::json) FROM last_touch_stats),
    'campaigns', (SELECT COALESCE(json_agg(row_to_json(campaign_stats)), '[]'::json) FROM campaign_stats),
    'paths', (SELECT COALESCE(json_agg(row_to_json(common_paths)), '[]'::json) FROM common_paths)
  ) INTO _result;

  RETURN _result;
END;
$$;