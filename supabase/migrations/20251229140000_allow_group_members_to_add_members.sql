-- Allow any group member (not just creator) to add new members
-- This fixes the issue where non-creator members cannot invite others to the group

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can add themselves or group creators can add members" ON public.group_members;
DROP POLICY IF EXISTS "Users can add themselves as members" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can add members" ON public.group_members;

-- Create a new policy that allows:
-- 1. Users to add themselves (for invite code joins)
-- 2. Any existing group member to add new members
CREATE POLICY "Group members can add new members"
ON public.group_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_group_member(auth.uid(), group_id)
);

-- Grant execute permission on is_group_member if not already granted
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
