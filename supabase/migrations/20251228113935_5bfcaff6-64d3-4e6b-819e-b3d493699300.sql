-- 1. Update SELECT policy on groups to allow creator OR member to view
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of"
ON public.groups
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR is_group_member(auth.uid(), id)
);

-- 2. Add unique constraint on group_members to prevent duplicates
ALTER TABLE public.group_members 
DROP CONSTRAINT IF EXISTS group_members_group_user_unique;
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_group_user_unique UNIQUE (group_id, user_id);

-- 3. Create trigger function to auto-add creator as member
CREATE OR REPLACE FUNCTION public.auto_add_group_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically add the group creator as a member
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS auto_add_creator_as_member ON public.groups;
CREATE TRIGGER auto_add_creator_as_member
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_group_creator_as_member();

-- 5. Backfill: ensure all existing group creators are members
INSERT INTO public.group_members (group_id, user_id)
SELECT g.id, g.created_by
FROM public.groups g
WHERE g.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = g.id AND gm.user_id = g.created_by
  )
ON CONFLICT (group_id, user_id) DO NOTHING;