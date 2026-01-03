-- Fix: Team role enforcement lacks server-side validation
-- Create a helper function to check if user has required team role for a site

-- Step 1: Create SECURITY DEFINER function to check team member role
CREATE OR REPLACE FUNCTION public.has_team_role(_site_id uuid, _min_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE site_id = _site_id 
      AND user_id = auth.uid()
      AND CASE _min_role
        WHEN 'viewer' THEN role IN ('viewer', 'editor', 'admin')
        WHEN 'editor' THEN role IN ('editor', 'admin')
        WHEN 'admin' THEN role = 'admin'
        ELSE false
      END
  );
$$;

-- Step 2: Update funnels table policies to enforce role-based access
-- Viewers: SELECT only, Editors+: CRUD, Site owners: Full access

-- Drop existing team SELECT policy
DROP POLICY IF EXISTS "Team members can view site funnels" ON public.funnels;

-- Create new role-based policies for funnels
-- Viewers, editors, and admins can view (already covered by is_site_owner for owners)
CREATE POLICY "Team viewers can view site funnels"
ON public.funnels FOR SELECT
USING (public.has_team_role(site_id, 'viewer'));

-- Drop existing owner INSERT policy and recreate with role check
DROP POLICY IF EXISTS "Users can create funnels for own sites" ON public.funnels;
CREATE POLICY "Editors can create funnels"
ON public.funnels FOR INSERT
WITH CHECK (public.is_site_owner(site_id) OR public.has_team_role(site_id, 'editor'));

-- Drop existing owner UPDATE policy and recreate with role check
DROP POLICY IF EXISTS "Users can update funnels for own sites" ON public.funnels;
CREATE POLICY "Editors can update funnels"
ON public.funnels FOR UPDATE
USING (public.is_site_owner(site_id) OR public.has_team_role(site_id, 'editor'));

-- Drop existing owner DELETE policy and recreate with role check
DROP POLICY IF EXISTS "Users can delete funnels for own sites" ON public.funnels;
CREATE POLICY "Editors can delete funnels"
ON public.funnels FOR DELETE
USING (public.is_site_owner(site_id) OR public.has_team_role(site_id, 'editor'));

-- Step 3: Update goals table policies to enforce role-based access
DROP POLICY IF EXISTS "Team members can view site goals" ON public.goals;

CREATE POLICY "Team viewers can view site goals"
ON public.goals FOR SELECT
USING (public.has_team_role(site_id, 'viewer'));

DROP POLICY IF EXISTS "Users can create goals for own sites" ON public.goals;
CREATE POLICY "Editors can create goals"
ON public.goals FOR INSERT
WITH CHECK (public.is_site_owner(site_id) OR public.has_team_role(site_id, 'editor'));

DROP POLICY IF EXISTS "Users can update goals for own sites" ON public.goals;
CREATE POLICY "Editors can update goals"
ON public.goals FOR UPDATE
USING (public.is_site_owner(site_id) OR public.has_team_role(site_id, 'editor'));

DROP POLICY IF EXISTS "Users can delete goals for own sites" ON public.goals;
CREATE POLICY "Editors can delete goals"
ON public.goals FOR DELETE
USING (public.is_site_owner(site_id) OR public.has_team_role(site_id, 'editor'));

-- Step 4: Update custom_dashboards policies for role-based access
DROP POLICY IF EXISTS "Team members can view site dashboards" ON public.custom_dashboards;

CREATE POLICY "Team viewers can view site dashboards"
ON public.custom_dashboards FOR SELECT
USING (public.has_team_role(site_id, 'viewer'));

-- Note: custom_dashboards already has "Users can manage own dashboards" for owners
-- Add editor access for team dashboards (not owned by user but on their site)
CREATE POLICY "Editors can manage site dashboards"
ON public.custom_dashboards FOR ALL
USING (public.has_team_role(site_id, 'editor') AND auth.uid() != user_id)
WITH CHECK (public.has_team_role(site_id, 'editor'));

-- Step 5: Ensure sites table has proper role-based UPDATE (only admins/owners can modify site settings)
-- Current policy "Users can update own sites" already restricts to owners
-- Add admin team member update capability
CREATE POLICY "Team admins can update sites"
ON public.sites FOR UPDATE
USING (public.has_team_role(id, 'admin'))
WITH CHECK (public.has_team_role(id, 'admin'));