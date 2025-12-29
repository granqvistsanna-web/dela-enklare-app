-- Create a function to auto-create a household for new users
CREATE OR REPLACE FUNCTION public.create_default_household_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_group_id uuid;
  new_invite_code text;
BEGIN
  -- Generate a unique invite code
  new_invite_code := public.generate_invite_code();

  -- Create the household group
  INSERT INTO public.groups (name, is_temporary, created_by, invite_code)
  VALUES ('Mitt hushåll', false, NEW.id, new_invite_code)
  RETURNING id INTO new_group_id;

  -- Add the user as a member of their household
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (new_group_id, NEW.id);

  RETURN NEW;
END;
$$;

-- Create trigger to run after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_household_for_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_default_household_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_household_for_user() TO service_role;
