-- Create rate limiting table for public dashboard password attempts
CREATE TABLE public.public_dashboard_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL,
  attempts INT DEFAULT 0,
  last_attempt TIMESTAMPTZ DEFAULT now(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index on share_token for fast lookups
CREATE UNIQUE INDEX idx_public_dashboard_attempts_token ON public.public_dashboard_attempts(share_token);

-- Create or replace the get_public_dashboard_stats function with rate limiting
CREATE OR REPLACE FUNCTION public.get_public_dashboard_stats(
  _share_token TEXT,
  _start_date DATE,
  _end_date DATE,
  _password TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _config RECORD;
  _site_id UUID;
  _result JSON;
  _attempt RECORD;
  _max_attempts INT := 5;
  _lockout_minutes INT := 15;
BEGIN
  -- Get the dashboard config
  SELECT * INTO _config
  FROM public_dashboards
  WHERE share_token = _share_token AND is_enabled = true;

  IF _config IS NULL THEN
    RETURN json_build_object('error', 'Dashboard not found or not enabled');
  END IF;

  _site_id := _config.site_id;

  -- Check password if required
  IF _config.password_hash IS NOT NULL THEN
    -- Get or create attempt record
    SELECT * INTO _attempt
    FROM public_dashboard_attempts
    WHERE share_token = _share_token;

    -- Check if locked out
    IF _attempt IS NOT NULL AND _attempt.locked_until IS NOT NULL AND _attempt.locked_until > now() THEN
      RETURN json_build_object(
        'error', 'Too many failed attempts. Please try again later.',
        'locked_until', _attempt.locked_until
      );
    END IF;

    -- Verify password
    IF _password IS NULL OR _config.password_hash != extensions.crypt(_password, _config.password_hash) THEN
      -- Update or insert attempt record
      INSERT INTO public_dashboard_attempts (share_token, attempts, last_attempt, locked_until)
      VALUES (
        _share_token, 
        1, 
        now(),
        CASE WHEN 1 >= _max_attempts THEN now() + (_lockout_minutes * interval '1 minute') ELSE NULL END
      )
      ON CONFLICT (share_token) DO UPDATE SET
        attempts = CASE 
          WHEN public_dashboard_attempts.last_attempt < now() - (_lockout_minutes * interval '1 minute') THEN 1
          ELSE public_dashboard_attempts.attempts + 1
        END,
        last_attempt = now(),
        locked_until = CASE 
          WHEN (CASE 
            WHEN public_dashboard_attempts.last_attempt < now() - (_lockout_minutes * interval '1 minute') THEN 1
            ELSE public_dashboard_attempts.attempts + 1
          END) >= _max_attempts 
          THEN now() + (_lockout_minutes * interval '1 minute') 
          ELSE NULL 
        END;

      RETURN json_build_object('password_required', true);
    END IF;

    -- Password correct - reset attempts
    DELETE FROM public_dashboard_attempts WHERE share_token = _share_token;
  END IF;

  -- Get site stats
  SELECT json_build_object(
    'site_name', s.name,
    'title', _config.title,
    'config', json_build_object(
      'show_visitors', _config.show_visitors,
      'show_pageviews', _config.show_pageviews,
      'show_top_pages', _config.show_top_pages,
      'show_referrers', _config.show_referrers,
      'show_devices', _config.show_devices,
      'show_geo', _config.show_geo
    ),
    'stats', json_build_object(
      'unique_visitors', (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE site_id = _site_id AND created_at >= _start_date AND created_at < _end_date + interval '1 day'),
      'total_pageviews', (SELECT COUNT(*) FROM events WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at < _end_date + interval '1 day')
    ),
    'top_pages', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT url, COUNT(*) as pageviews, COUNT(DISTINCT visitor_id) as unique_visitors
        FROM events
        WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
        GROUP BY url
        ORDER BY pageviews DESC
        LIMIT 10
      ) t
    ),
    'top_referrers', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT COALESCE(referrer, 'Direct') as referrer, COUNT(*) as visits
        FROM events
        WHERE site_id = _site_id AND event_name = 'pageview' AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
        GROUP BY referrer
        ORDER BY visits DESC
        LIMIT 10
      ) t
    ),
    'devices', (
      SELECT json_build_object(
        'browsers', (
          SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
          FROM (
            SELECT browser as name, COUNT(*) as count
            FROM events
            WHERE site_id = _site_id AND event_name = 'pageview' AND browser IS NOT NULL AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
            GROUP BY browser
            ORDER BY count DESC
            LIMIT 5
          ) t
        ),
        'os', (
          SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
          FROM (
            SELECT os as name, COUNT(*) as count
            FROM events
            WHERE site_id = _site_id AND event_name = 'pageview' AND os IS NOT NULL AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
            GROUP BY os
            ORDER BY count DESC
            LIMIT 5
          ) t
        ),
        'device_types', (
          SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
          FROM (
            SELECT device_type as name, COUNT(*) as count
            FROM events
            WHERE site_id = _site_id AND event_name = 'pageview' AND device_type IS NOT NULL AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
            GROUP BY device_type
            ORDER BY count DESC
            LIMIT 5
          ) t
        )
      )
    ),
    'geo', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT country, COUNT(*) as visits
        FROM events
        WHERE site_id = _site_id AND event_name = 'pageview' AND country IS NOT NULL AND created_at >= _start_date AND created_at < _end_date + interval '1 day'
        GROUP BY country
        ORDER BY visits DESC
        LIMIT 10
      ) t
    )
  ) INTO _result
  FROM sites s
  WHERE s.id = _site_id;

  RETURN _result;
END;
$$;

-- Clean up old attempt records periodically (optional - can be done via cron)
-- This keeps the table from growing indefinitely