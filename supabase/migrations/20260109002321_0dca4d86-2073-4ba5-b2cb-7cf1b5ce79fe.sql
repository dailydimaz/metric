-- Add password hash column to public_dashboards
ALTER TABLE public.public_dashboards 
ADD COLUMN password_hash text DEFAULT NULL;

-- Update the get_public_dashboard_stats function to include timeseries and handle password
CREATE OR REPLACE FUNCTION public.get_public_dashboard_stats(
  _share_token text,
  _start_date text,
  _end_date text,
  _password text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _config public_dashboards;
  _site sites;
  _result json;
BEGIN
  -- Get the public dashboard config
  SELECT * INTO _config
  FROM public_dashboards
  WHERE share_token = _share_token AND is_enabled = true;

  IF _config IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check password if set
  IF _config.password_hash IS NOT NULL THEN
    IF _password IS NULL OR _config.password_hash != extensions.crypt(_password, _config.password_hash) THEN
      RETURN json_build_object('password_required', true);
    END IF;
  END IF;

  -- Get the site
  SELECT * INTO _site
  FROM sites
  WHERE id = _config.site_id;

  IF _site IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build the result based on config
  SELECT json_build_object(
    'site_name', _site.name,
    'title', COALESCE(_config.title, _site.name || ' Analytics'),
    'password_required', false,
    'visitors', CASE WHEN _config.show_visitors THEN (
      SELECT COUNT(DISTINCT visitor_id)
      FROM events
      WHERE site_id = _site.id
        AND created_at >= _start_date::timestamp
        AND created_at < (_end_date::timestamp + interval '1 day')
    ) ELSE NULL END,
    'pageviews', CASE WHEN _config.show_pageviews THEN (
      SELECT COUNT(*)
      FROM events
      WHERE site_id = _site.id
        AND event_name = 'pageview'
        AND created_at >= _start_date::timestamp
        AND created_at < (_end_date::timestamp + interval '1 day')
    ) ELSE NULL END,
    'timeseries', CASE WHEN _config.show_visitors OR _config.show_pageviews THEN (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          date_trunc('day', created_at)::date as date,
          COUNT(DISTINCT visitor_id) as visitors,
          COUNT(*) FILTER (WHERE event_name = 'pageview') as pageviews
        FROM events
        WHERE site_id = _site.id
          AND created_at >= _start_date::timestamp
          AND created_at < (_end_date::timestamp + interval '1 day')
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY date
      ) t
    ) ELSE NULL END,
    'top_pages', CASE WHEN _config.show_top_pages THEN (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT url, COUNT(*) as pageviews, COUNT(DISTINCT visitor_id) as unique_visitors
        FROM events
        WHERE site_id = _site.id
          AND event_name = 'pageview'
          AND created_at >= _start_date::timestamp
          AND created_at < (_end_date::timestamp + interval '1 day')
        GROUP BY url
        ORDER BY pageviews DESC
        LIMIT 10
      ) t
    ) ELSE NULL END,
    'top_referrers', CASE WHEN _config.show_referrers THEN (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          COALESCE(NULLIF(referrer, ''), 'Direct') as referrer, 
          COUNT(*) as visits,
          ROUND(COUNT(*)::numeric * 100 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as percentage
        FROM events
        WHERE site_id = _site.id
          AND created_at >= _start_date::timestamp
          AND created_at < (_end_date::timestamp + interval '1 day')
        GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct')
        ORDER BY visits DESC
        LIMIT 10
      ) t
    ) ELSE NULL END,
    'devices', CASE WHEN _config.show_devices THEN (
      SELECT json_build_object(
        'device_types', (
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT device_type, COUNT(*) as count
            FROM events
            WHERE site_id = _site.id
              AND created_at >= _start_date::timestamp
              AND created_at < (_end_date::timestamp + interval '1 day')
            GROUP BY device_type
            ORDER BY count DESC
          ) t
        ),
        'browsers', (
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT browser, COUNT(*) as count
            FROM events
            WHERE site_id = _site.id
              AND created_at >= _start_date::timestamp
              AND created_at < (_end_date::timestamp + interval '1 day')
            GROUP BY browser
            ORDER BY count DESC
            LIMIT 5
          ) t
        )
      )
    ) ELSE NULL END,
    'countries', CASE WHEN _config.show_geo THEN (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT country, COUNT(*) as visits
        FROM events
        WHERE site_id = _site.id
          AND created_at >= _start_date::timestamp
          AND created_at < (_end_date::timestamp + interval '1 day')
          AND country IS NOT NULL
        GROUP BY country
        ORDER BY visits DESC
        LIMIT 10
      ) t
    ) ELSE NULL END
  ) INTO _result;

  RETURN _result;
END;
$$;