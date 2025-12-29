-- Fix handle_new_user to also create public_profiles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Användare'),
    NEW.email
  );

  -- Also insert into public_profiles table
  INSERT INTO public.public_profiles (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Användare')
  );

  RETURN NEW;
END;
$$;

-- Create function to fetch user's groups with all members
-- This is a security definer function to bypass RLS and ensure consistent data
CREATE OR REPLACE FUNCTION public.get_user_groups()
RETURNS TABLE(
  group_id uuid,
  group_name text,
  group_is_temporary boolean,
  group_created_by uuid,
  group_created_at timestamptz,
  group_invite_code text,
  member_id uuid,
  member_user_id uuid,
  member_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get all groups the current user is a member of
  SELECT
    g.id as group_id,
    g.name as group_name,
    g.is_temporary as group_is_temporary,
    g.created_by as group_created_by,
    g.created_at as group_created_at,
    g.invite_code as group_invite_code,
    pp.id as member_id,
    pp.user_id as member_user_id,
    pp.name as member_name
  FROM public.groups g
  INNER JOIN public.group_members gm_user ON g.id = gm_user.group_id
  INNER JOIN public.group_members gm_all ON g.id = gm_all.group_id
  LEFT JOIN public.public_profiles pp ON gm_all.user_id = pp.user_id
  WHERE gm_user.user_id = auth.uid()
  ORDER BY g.created_at DESC, pp.name
$$;
