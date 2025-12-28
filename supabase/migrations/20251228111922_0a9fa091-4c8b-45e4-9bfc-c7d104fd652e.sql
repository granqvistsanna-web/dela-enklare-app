-- Create a non-sensitive public profile table for group context (prevents email harvesting)

CREATE TABLE IF NOT EXISTS public.public_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own public profile, and profiles of users in any shared group
DROP POLICY IF EXISTS "Users can view public profiles" ON public.public_profiles;
CREATE POLICY "Users can view public profiles"
ON public.public_profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.group_members gm_me
    JOIN public.group_members gm_them
      ON gm_me.group_id = gm_them.group_id
    WHERE gm_me.user_id = auth.uid()
      AND gm_them.user_id = public.public_profiles.user_id
  )
);

-- Users can insert/update their own public profile
DROP POLICY IF EXISTS "Users can insert their own public profile" ON public.public_profiles;
CREATE POLICY "Users can insert their own public profile"
ON public.public_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own public profile" ON public.public_profiles;
CREATE POLICY "Users can update their own public profile"
ON public.public_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_public_profiles_updated_at ON public.public_profiles;
CREATE TRIGGER update_public_profiles_updated_at
BEFORE UPDATE ON public.public_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill from existing private profiles
INSERT INTO public.public_profiles (user_id, name)
SELECT user_id, name
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE
SET name = EXCLUDED.name;

-- Sync public_profiles whenever private profiles change
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profiles (user_id, name)
  VALUES (NEW.user_id, NEW.name)
  ON CONFLICT (user_id) DO UPDATE
  SET name = EXCLUDED.name,
      updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_profile_on_profiles ON public.profiles;
CREATE TRIGGER sync_public_profile_on_profiles
AFTER INSERT OR UPDATE OF name ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_profile();
