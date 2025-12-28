-- Add invite_code column to groups table
ALTER TABLE public.groups 
ADD COLUMN invite_code TEXT UNIQUE;

-- Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 6 character code
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to auto-generate invite code on group creation
CREATE OR REPLACE FUNCTION public.set_group_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := generate_invite_code();
    SELECT EXISTS(SELECT 1 FROM groups WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.invite_code := new_code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_create_set_invite_code
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_group_invite_code();

-- Backfill existing groups with invite codes
DO $$
DECLARE
  g RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR g IN SELECT id FROM groups WHERE invite_code IS NULL LOOP
    LOOP
      new_code := generate_invite_code();
      SELECT EXISTS(SELECT 1 FROM groups WHERE invite_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE groups SET invite_code = new_code WHERE id = g.id;
  END LOOP;
END;
$$;

-- Make invite_code NOT NULL after backfill
ALTER TABLE public.groups ALTER COLUMN invite_code SET NOT NULL;