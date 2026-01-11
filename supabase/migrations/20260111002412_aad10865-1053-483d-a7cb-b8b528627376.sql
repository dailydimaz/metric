-- Enable RLS on geoip tables (read-only public access for the lookup function)
ALTER TABLE public.geoip_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geoip_blocks ENABLE ROW LEVEL SECURITY;

-- Allow the lookup function to read these tables (it uses SECURITY DEFINER)
-- No public policies needed since users don't query these directly