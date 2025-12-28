-- Fix group member insertion and invite code issues
-- This migration ensures:
-- 1. is_group_creator function has proper grants
-- 2. RLS policies allow group creators to add members
-- 3. Users can join via invite codes
-- 4. get_all_users function works correctly

-- Ensure is_group_creator function exists and has proper grants
CREATE OR REPLACE FUNCTION public.is_group_creator(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND created_by = _user_id
  )
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO authenticated;

-- Ensure the group_members INSERT policy is correct
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can add themselves as members" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can add members" ON public.group_members;

-- Create a comprehensive policy that allows:
-- 1. Users to add themselves (for invite code joins)
-- 2. Group creators to add any user to their groups
CREATE POLICY "Users can add themselves or group creators can add members"
ON public.group_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_group_creator(auth.uid(), group_id)
);

-- Ensure get_all_users function works correctly (it's already SECURITY DEFINER, but verify)
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

-- Grant execute permission (if not already granted)
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

-- Ensure lookup_group_by_invite_code function exists and works
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

-- Grant execute permission (if not already granted)
GRANT EXECUTE ON FUNCTION public.lookup_group_by_invite_code(TEXT) TO authenticated;

-- Ensure all profiles are synced to public_profiles (backfill)
INSERT INTO public.public_profiles (user_id, name)
SELECT user_id, name
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE
SET name = EXCLUDED.name,
    updated_at = now();

