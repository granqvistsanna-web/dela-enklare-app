-- Add UPDATE policy for settlements so users can edit them
CREATE POLICY "Group members can update settlements"
ON public.settlements
FOR UPDATE
USING (is_group_member(auth.uid(), group_id))
WITH CHECK (is_group_member(auth.uid(), group_id));