-- Make created_by nullable temporarily to allow INSERT without it, trigger will set it
ALTER TABLE public.groups ALTER COLUMN created_by DROP NOT NULL;

-- Re-create the trigger to always set created_by
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

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_group_created_by ON public.groups;
CREATE TRIGGER set_group_created_by
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_group_created_by();

-- Update the RLS policy to be more permissive for INSERT
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (true);