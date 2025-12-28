-- Create a function to lookup groups by invite code
-- This bypasses RLS to allow users to find groups they want to join
CREATE OR REPLACE FUNCTION public.lookup_group_by_invite_code(code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  invite_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.invite_code
  FROM groups g
  WHERE g.invite_code = UPPER(code);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_group_by_invite_code(TEXT) TO authenticated;
