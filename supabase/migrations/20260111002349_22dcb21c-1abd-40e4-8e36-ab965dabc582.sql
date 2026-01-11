-- Create geoip_locations table for country/city data
CREATE TABLE public.geoip_locations (
  geoname_id INTEGER PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT,
  city_name TEXT
);

-- Create geoip_blocks table for IP ranges
CREATE TABLE public.geoip_blocks (
  network INET NOT NULL,
  geoname_id INTEGER REFERENCES public.geoip_locations(geoname_id) ON DELETE CASCADE,
  PRIMARY KEY (network)
);

-- Create GIST index for fast IP lookups using inet_ops
CREATE INDEX idx_geoip_blocks_network ON public.geoip_blocks USING GIST (network inet_ops);

-- Create lookup function
CREATE OR REPLACE FUNCTION public.lookup_geoip(ip_address TEXT)
RETURNS TABLE(country TEXT, city TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    l.country_code AS country,
    l.city_name AS city
  FROM public.geoip_blocks b
  JOIN public.geoip_locations l ON l.geoname_id = b.geoname_id
  WHERE ip_address::inet <<= b.network
  ORDER BY masklen(b.network) DESC
  LIMIT 1;
$$;

-- Insert some test data for verification
INSERT INTO public.geoip_locations (geoname_id, country_code, country_name, city_name) VALUES
  (1, 'US', 'United States', 'New York'),
  (2, 'US', 'United States', 'Los Angeles'),
  (3, 'GB', 'United Kingdom', 'London'),
  (4, 'DE', 'Germany', 'Berlin');

-- Insert test IP ranges (example ranges - replace with real data)
INSERT INTO public.geoip_blocks (network, geoname_id) VALUES
  ('8.0.0.0/8', 1),
  ('104.0.0.0/8', 2),
  ('185.0.0.0/8', 3),
  ('46.0.0.0/8', 4);