-- Ensure created_by is always set to the current authenticated user (prevents spoofing)

-- 1) Update trigger function to ALWAYS override created_by
CREATE OR REPLACE FUNCTION public.set_group_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

-- 2) Replace INSERT policy to only require authentication
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups"
ON public.groups
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
