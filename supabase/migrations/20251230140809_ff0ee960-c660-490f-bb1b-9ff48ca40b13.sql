-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Members can create settlements" ON public.settlements;

-- Create new policy allowing any group member to create settlements for their group
CREATE POLICY "Members can create settlements for group"
ON public.settlements
FOR INSERT
WITH CHECK (is_group_member(auth.uid(), group_id));