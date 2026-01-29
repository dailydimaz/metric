
-- Fix visitor_profiles RLS policy to explicitly require authentication
-- and restrict access to site owners and team admins only

-- First, drop the existing policy
DROP POLICY IF EXISTS "Site owners can manage visitor profiles" ON public.visitor_profiles;

-- Create separate policies for each operation, explicitly targeting authenticated role
-- This is more secure than a single ALL policy

-- SELECT: Site owners and team admins can view visitor profiles
CREATE POLICY "Authenticated users can view visitor profiles for own sites"
ON public.visitor_profiles
FOR SELECT
TO authenticated
USING (is_site_owner(site_id) OR has_team_role(site_id, 'admin'));

-- INSERT: Only site owners and team admins can create visitor profiles
-- (tracking scripts should use service role for inserting profiles)
CREATE POLICY "Authenticated users can create visitor profiles for own sites"
ON public.visitor_profiles
FOR INSERT
TO authenticated
WITH CHECK (is_site_owner(site_id) OR has_team_role(site_id, 'admin'));

-- UPDATE: Site owners and team admins can update visitor profiles  
CREATE POLICY "Authenticated users can update visitor profiles for own sites"
ON public.visitor_profiles
FOR UPDATE
TO authenticated
USING (is_site_owner(site_id) OR has_team_role(site_id, 'admin'))
WITH CHECK (is_site_owner(site_id) OR has_team_role(site_id, 'admin'));

-- DELETE: Site owners and team admins can delete visitor profiles
CREATE POLICY "Authenticated users can delete visitor profiles for own sites"
ON public.visitor_profiles
FOR DELETE
TO authenticated
USING (is_site_owner(site_id) OR has_team_role(site_id, 'admin'));
