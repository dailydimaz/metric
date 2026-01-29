
-- Tighten backup_codes RLS policies to authenticated role only
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own backup codes" ON public.backup_codes;
DROP POLICY IF EXISTS "Users can insert own backup codes" ON public.backup_codes;
DROP POLICY IF EXISTS "Users can update own backup codes" ON public.backup_codes;
DROP POLICY IF EXISTS "Users can delete own backup codes" ON public.backup_codes;

-- Recreate with authenticated role
CREATE POLICY "Users can view own backup codes"
ON public.backup_codes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backup codes"
ON public.backup_codes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backup codes"
ON public.backup_codes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backup codes"
ON public.backup_codes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
