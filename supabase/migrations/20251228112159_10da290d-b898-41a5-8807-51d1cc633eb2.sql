-- Set default value for created_by to use auth.uid() directly
ALTER TABLE public.groups ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Drop the trigger since we're using a column default instead
DROP TRIGGER IF EXISTS set_group_created_by ON public.groups;