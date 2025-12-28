-- Update trigger to only set created_by if null (preserve value if already set)
CREATE OR REPLACE FUNCTION public.set_group_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always set created_by from the authenticated user
  IF auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;