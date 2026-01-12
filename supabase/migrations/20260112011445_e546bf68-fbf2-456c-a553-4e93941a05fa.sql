-- Fix PUBLIC_DATA_EXPOSURE: Remove the overly permissive public SELECT policy
-- The "Anyone can view enabled public dashboards" policy exposes share_token and password_hash
-- Public access should ONLY go through the get_public_dashboard_stats() SECURITY DEFINER function

-- Drop the vulnerable policy that exposes sensitive columns
DROP POLICY IF EXISTS "Anyone can view enabled public dashboards" ON public.public_dashboards;

-- Note: Site owners retain full access via the existing policy:
-- "Site owners can manage public dashboards"
-- Public users access dashboards exclusively via get_public_dashboard_stats() RPC function