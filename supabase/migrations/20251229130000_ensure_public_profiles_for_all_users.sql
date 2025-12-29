-- Ensure all existing auth.users have a public_profile
-- This migration fixes the issue where users might not have a public_profile,
-- which causes household.members to be empty and prevents adding transactions

-- First, ensure all existing users from profiles table have public_profiles
INSERT INTO public.public_profiles (user_id, name)
SELECT user_id, COALESCE(name, 'Användare')
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.public_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Then, ensure all auth.users who don't have profiles or public_profiles get them
-- First create profiles for users without them
INSERT INTO public.profiles (user_id, name)
SELECT id, COALESCE(raw_user_meta_data->>'name', email, 'Användare')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Then create public_profiles for all users who don't have them
INSERT INTO public.public_profiles (user_id, name)
SELECT id, COALESCE(raw_user_meta_data->>'name', email, 'Användare')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.public_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Update the auto-create household function to also create public_profile if missing
CREATE OR REPLACE FUNCTION public.create_default_household_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_group_id uuid;
  new_invite_code text;
  user_name text;
BEGIN
  -- Get user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    'Användare'
  );

  -- Ensure user has a profile
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, user_name)
  ON CONFLICT (user_id) DO NOTHING;

  -- Ensure user has a public_profile
  INSERT INTO public.public_profiles (user_id, name)
  VALUES (NEW.id, user_name)
  ON CONFLICT (user_id) DO NOTHING;

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
