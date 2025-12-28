-- Fix the group_members INSERT policy to properly handle invite code joins
-- The issue: When a user tries to join via invite code, the EXISTS check
-- against the groups table fails due to RLS (user isn't a member yet).
-- Solution: Use a SECURITY DEFINER function to bypass RLS for the creator check.

-- Create a security definer function to check if user is group creator
CREATE OR REPLACE FUNCTION public.is_group_creator(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND created_by = _user_id
  )
$$;

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can add themselves as members" ON public.group_members;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can add themselves as members"
ON public.group_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_group_creator(auth.uid(), group_id)
);
