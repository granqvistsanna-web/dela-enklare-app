
-- Update get_all_users to return ALL users from public_profiles
-- This allows group creators to invite any registered user
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, user_id uuid, name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pp.id, pp.user_id, pp.name
  FROM public.public_profiles pp
  ORDER BY pp.name ASC
$$;

-- Ensure proper grant
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
