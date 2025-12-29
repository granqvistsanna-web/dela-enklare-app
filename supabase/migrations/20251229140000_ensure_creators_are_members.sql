-- Ensure all group creators are also members of their groups
-- This fixes the issue where a user who created a household might not be listed as a member

INSERT INTO public.group_members (group_id, user_id)
SELECT g.id, g.created_by
FROM public.groups g
WHERE NOT EXISTS (
  SELECT 1
  FROM public.group_members gm
  WHERE gm.group_id = g.id
  AND gm.user_id = g.created_by
)
ON CONFLICT (group_id, user_id) DO NOTHING;
