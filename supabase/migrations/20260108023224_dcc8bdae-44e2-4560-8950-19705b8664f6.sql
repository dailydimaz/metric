-- Create public_dashboards table for shareable dashboard links
CREATE TABLE public.public_dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  title TEXT,
  show_visitors BOOLEAN NOT NULL DEFAULT true,
  show_pageviews BOOLEAN NOT NULL DEFAULT true,
  show_top_pages BOOLEAN NOT NULL DEFAULT true,
  show_referrers BOOLEAN NOT NULL DEFAULT true,
  show_devices BOOLEAN NOT NULL DEFAULT false,
  show_geo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id)
);

-- Enable RLS
ALTER TABLE public.public_dashboards ENABLE ROW LEVEL SECURITY;

-- Site owners can manage their public dashboard settings
CREATE POLICY "Site owners can manage public dashboards"
ON public.public_dashboards
FOR ALL
USING (EXISTS (
  SELECT 1 FROM sites WHERE sites.id = public_dashboards.site_id AND sites.user_id = auth.uid()
));

-- Anyone can view enabled public dashboards (for the public share page)
CREATE POLICY "Anyone can view enabled public dashboards"
ON public.public_dashboards
FOR SELECT
USING (is_enabled = true);

-- Create function to get public dashboard stats without auth
CREATE OR REPLACE FUNCTION public.get_public_dashboard_stats(
  _share_token TEXT,
  _start_date TEXT,
  _end_date TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _site_id UUID;
  _config public_dashboards%ROWTYPE;
  _result JSON;
BEGIN
  -- Get the public dashboard config
  SELECT * INTO _config
  FROM public_dashboards
  WHERE share_token = _share_token AND is_enabled = true;
  
  IF _config IS NULL THEN
    RETURN NULL;
  END IF;
  
  _site_id := _config.site_id;
  
  -- Build the result with only enabled sections
  SELECT json_build_object(
    'site_name', (SELECT name FROM sites WHERE id = _site_id),
    'title', _config.title,
    'visitors', CASE WHEN _config.show_visitors THEN (
      SELECT json_build_object(
        'total', COUNT(DISTINCT visitor_id),
        'pageviews', COUNT(*)
      )
      FROM events
      WHERE site_id = _site_id
        AND created_at >= _start_date::timestamptz
        AND created_at <= _end_date::timestamptz
    ) ELSE NULL END,
    'top_pages', CASE WHEN _config.show_top_pages THEN (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT url, COUNT(*) as pageviews, COUNT(DISTINCT visitor_id) as unique_visitors
        FROM events
        WHERE site_id = _site_id
          AND created_at >= _start_date::timestamptz
          AND created_at <= _end_date::timestamptz
          AND url IS NOT NULL
        GROUP BY url
        ORDER BY pageviews DESC
        LIMIT 10
      ) t
    ) ELSE NULL END,
    'top_referrers', CASE WHEN _config.show_referrers THEN (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT referrer, COUNT(*) as visits
        FROM events
        WHERE site_id = _site_id
          AND created_at >= _start_date::timestamptz
          AND created_at <= _end_date::timestamptz
          AND referrer IS NOT NULL
          AND referrer != ''
        GROUP BY referrer
        ORDER BY visits DESC
        LIMIT 10
      ) t
    ) ELSE NULL END,
    'devices', CASE WHEN _config.show_devices THEN (
      SELECT json_build_object(
        'browsers', (
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT browser as name, COUNT(*) as count
            FROM events
            WHERE site_id = _site_id
              AND created_at >= _start_date::timestamptz
              AND created_at <= _end_date::timestamptz
              AND browser IS NOT NULL
            GROUP BY browser
            ORDER BY count DESC
            LIMIT 5
          ) t
        ),
        'os', (
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT os as name, COUNT(*) as count
            FROM events
            WHERE site_id = _site_id
              AND created_at >= _start_date::timestamptz
              AND created_at <= _end_date::timestamptz
              AND os IS NOT NULL
            GROUP BY os
            ORDER BY count DESC
            LIMIT 5
          ) t
        )
      )
    ) ELSE NULL END,
    'geo', CASE WHEN _config.show_geo THEN (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT country, COUNT(*) as visits
        FROM events
        WHERE site_id = _site_id
          AND created_at >= _start_date::timestamptz
          AND created_at <= _end_date::timestamptz
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