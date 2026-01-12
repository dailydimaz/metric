-- Fix SUPA_rls_enabled_no_policy: Add RLS policies to geoip_blocks and geoip_locations
-- These are public reference/lookup tables for GeoIP resolution, readable by anyone

-- Policy for geoip_blocks - allow public read access for IP lookups
CREATE POLICY "Allow public read access for GeoIP lookups"
ON public.geoip_blocks
FOR SELECT
USING (true);

-- Policy for geoip_locations - allow public read access for location data
CREATE POLICY "Allow public read access for GeoIP locations"
ON public.geoip_locations
FOR SELECT
USING (true);

-- Note: These tables contain no user-specific data - they are static reference data
-- from MaxMind/DB-IP for IP-to-location mapping. Write access is restricted 
-- (no INSERT/UPDATE/DELETE policies) so only database admins can modify them.