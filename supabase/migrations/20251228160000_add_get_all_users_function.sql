-- Create RPC function to get all users (for testing purposes - adds members to groups)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pp.id, pp.user_id, pp.name
  FROM public.public_profiles pp
  ORDER BY pp.name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
