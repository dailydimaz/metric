-- Create a function to hash passwords using pgcrypto
CREATE OR REPLACE FUNCTION public.hash_password(_password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT extensions.crypt(_password, extensions.gen_salt('bf'))
$$;