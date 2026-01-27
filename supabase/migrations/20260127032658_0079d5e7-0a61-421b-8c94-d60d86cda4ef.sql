-- Fix RLS policies for profiles table
-- Drop the existing policy that allows public role
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;

-- Recreate with authenticated role only (more secure)
CREATE POLICY "Users can view own full profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Fix RLS policies for events table SELECT operations
-- Change from public to authenticated role for SELECT policies
DROP POLICY IF EXISTS "Users can view events for own sites" ON public.events;
DROP POLICY IF EXISTS "Team members can view site events" ON public.events;

-- Recreate with authenticated role
CREATE POLICY "Users can view events for own sites" 
ON public.events 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM sites 
  WHERE sites.id = events.site_id 
  AND sites.user_id = auth.uid()
));

CREATE POLICY "Team members can view site events" 
ON public.events 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM team_members 
  WHERE team_members.site_id = events.site_id 
  AND team_members.user_id = auth.uid()
));

-- Note: Keep the INSERT policy allowing public/anonymous since this is needed for tracking scripts