-- Fix group creation: set created_by server-side and allow created_by to be omitted on insert

-- 1) Trigger function
CREATE OR REPLACE FUNCTION public.set_group_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Trigger
DROP TRIGGER IF EXISTS set_group_created_by ON public.groups;
CREATE TRIGGER set_group_created_by
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_group_created_by();

-- 3) Replace INSERT policy to permit omitted created_by but still prevent spoofing
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups"
ON public.groups
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR auth.uid() = created_by));