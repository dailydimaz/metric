-- Fix: Add RLS policies to public_dashboard_attempts table
-- This table tracks failed password attempts and should not be directly accessible

-- Drop any existing policies first (in case they exist but weren't detected)
DROP POLICY IF EXISTS "No direct public access to attempts" ON public.public_dashboard_attempts;
DROP POLICY IF EXISTS "Service role can manage attempts" ON public.public_dashboard_attempts;

-- Policy 1: Deny all direct SELECT access - this table should only be accessed via SECURITY DEFINER functions
CREATE POLICY "No direct public access to attempts"
  ON public.public_dashboard_attempts
  FOR SELECT
  USING (false);

-- Policy 2: Deny direct INSERT - only allow via SECURITY DEFINER functions
CREATE POLICY "No direct insert access"
  ON public.public_dashboard_attempts
  FOR INSERT
  WITH CHECK (false);

-- Policy 3: Deny direct UPDATE - only allow via SECURITY DEFINER functions  
CREATE POLICY "No direct update access"
  ON public.public_dashboard_attempts
  FOR UPDATE
  USING (false);

-- Policy 4: Deny direct DELETE - only allow via SECURITY DEFINER functions
CREATE POLICY "No direct delete access"
  ON public.public_dashboard_attempts
  FOR DELETE
  USING (false);