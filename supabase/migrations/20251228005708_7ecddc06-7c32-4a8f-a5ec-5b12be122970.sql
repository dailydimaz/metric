-- Fix infinite recursion in RLS by avoiding cross-table policy references

-- 1) Helper: check whether current user owns a site (bypasses RLS on sites)
CREATE OR REPLACE FUNCTION public.is_site_owner(_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sites s
    WHERE s.id = _site_id
      AND s.user_id = auth.uid()
  );
$$;

-- 2) team_members: replace ALL policy that referenced sites (caused recursion)
DROP POLICY IF EXISTS "Site owners can manage team members" ON public.team_members;

CREATE POLICY "Site owners can view team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (public.is_site_owner(site_id));

CREATE POLICY "Site owners can insert team members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_site_owner(site_id));

CREATE POLICY "Site owners can update team members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (public.is_site_owner(site_id))
WITH CHECK (public.is_site_owner(site_id));

CREATE POLICY "Site owners can delete team members"
ON public.team_members
FOR DELETE
TO authenticated
USING (public.is_site_owner(site_id));

-- 3) team_invitations: replace ALL policy that referenced sites (same recursion class)
DROP POLICY IF EXISTS "Site owners can manage invitations" ON public.team_invitations;

CREATE POLICY "Site owners can view invitations"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (public.is_site_owner(site_id));

CREATE POLICY "Site owners can insert invitations"
ON public.team_invitations
FOR INSERT
TO authenticated
WITH CHECK (public.is_site_owner(site_id));

CREATE POLICY "Site owners can update invitations"
ON public.team_invitations
FOR UPDATE
TO authenticated
USING (public.is_site_owner(site_id))
WITH CHECK (public.is_site_owner(site_id));

CREATE POLICY "Site owners can delete invitations"
ON public.team_invitations
FOR DELETE
TO authenticated
USING (public.is_site_owner(site_id));
