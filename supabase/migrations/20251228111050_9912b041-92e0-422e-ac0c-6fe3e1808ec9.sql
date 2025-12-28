-- Drop the existing insert policy for group_members that's too restrictive
DROP POLICY IF EXISTS "Group creators can add members" ON public.group_members;

-- Create a more permissive policy for adding yourself as a member when creating a group
CREATE POLICY "Users can add themselves as members"
ON public.group_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
);