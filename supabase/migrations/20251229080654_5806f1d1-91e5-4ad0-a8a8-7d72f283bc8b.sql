-- Create function to lookup group by invite code (for joining groups)
-- This is a security definer function to allow looking up groups without RLS restrictions
CREATE OR REPLACE FUNCTION public.lookup_group_by_invite_code(code text)
RETURNS TABLE(id uuid, name text, created_by uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name, g.created_by
  FROM public.groups g
  WHERE UPPER(TRIM(g.invite_code)) = UPPER(TRIM(code))
  LIMIT 1
$$;

-- Create function to get all users in groups the current user is a member of
-- This respects privacy - users can only see other users they share groups with
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, user_id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pp.id, pp.user_id, pp.name
  FROM public.public_profiles pp
  WHERE pp.user_id IN (
    SELECT DISTINCT gm2.user_id
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
  )
  OR pp.user_id = auth.uid()
$$;

-- Create function to regenerate invite code (only for group creator)
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(group_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  is_creator BOOLEAN;
BEGIN
  -- Check if user is the group creator
  SELECT EXISTS(
    SELECT 1 FROM public.groups 
    WHERE id = group_id_param AND created_by = auth.uid()
  ) INTO is_creator;
  
  IF NOT is_creator THEN
    RAISE EXCEPTION 'Only the group creator can regenerate the invite code';
  END IF;
  
  -- Generate new unique code
  LOOP
    new_code := generate_invite_code();
    SELECT EXISTS(SELECT 1 FROM groups WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Update the group with new code
  UPDATE public.groups SET invite_code = new_code WHERE id = group_id_param;
  
  RETURN new_code;
END;
$$;

-- Create function to check if user is group admin/creator
CREATE OR REPLACE FUNCTION public.is_group_admin(user_id_param uuid, group_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id_param AND created_by = user_id_param
  )
$$;

-- Create function to remove member from group (only for group creator)
CREATE OR REPLACE FUNCTION public.remove_group_member(group_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_creator BOOLEAN;
BEGIN
  -- Check if current user is the group creator
  SELECT EXISTS(
    SELECT 1 FROM public.groups 
    WHERE id = group_id_param AND created_by = auth.uid()
  ) INTO is_creator;
  
  IF NOT is_creator THEN
    RAISE EXCEPTION 'Only the group creator can remove members';
  END IF;
  
  -- Cannot remove the creator themselves
  IF user_id_param = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself from the group';
  END IF;
  
  -- Remove the member
  DELETE FROM public.group_members 
  WHERE group_id = group_id_param AND user_id = user_id_param;
  
  RETURN TRUE;
END;
$$;