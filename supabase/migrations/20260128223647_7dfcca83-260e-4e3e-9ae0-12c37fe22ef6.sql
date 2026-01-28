-- Drop all existing get_city_stats functions to clean up duplicates
DROP FUNCTION IF EXISTS public.get_city_stats(uuid, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_city_stats(uuid, timestamptz, timestamptz);

-- Recreate clean version that joins with city_coordinates
CREATE OR REPLACE FUNCTION public.get_city_stats(
  p_site_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE(
  city text,
  country text,
  visits bigint,
  unique_visitors bigint,
  latitude double precision,
  longitude double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.city,
    e.country,
    COUNT(*)::bigint AS visits,
    COUNT(DISTINCT e.visitor_id)::bigint AS unique_visitors,
    cc.latitude,
    cc.longitude
  FROM events_partitioned e
  LEFT JOIN city_coordinates cc 
    ON cc.country_code = e.country 
    AND cc.city_name = e.city
  WHERE e.site_id = p_site_id
    AND e.created_at >= p_start_date
    AND e.created_at <= p_end_date
    AND e.city IS NOT NULL
  GROUP BY e.city, e.country, cc.latitude, cc.longitude
  ORDER BY visits DESC;
END;
$$;