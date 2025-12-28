-- Update invite code generation to use easier-to-spell pattern
-- Uses consonant-vowel alternating pattern for more pronounceable codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  -- Consonants (excluding L to avoid confusion with I)
  consonants TEXT := 'BCDFGHJKMNPQRSTVWXZ';
  -- Vowels (excluding O and I to avoid confusion with 0 and 1)
  vowels TEXT := 'AEUY';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 6 character code with C-V-C-V-C-V pattern
  -- This makes codes like BAKETU, FUMYDE, etc. - easier to pronounce and remember
  FOR i IN 1..3 LOOP
    -- Add consonant
    result := result || substr(consonants, floor(random() * length(consonants) + 1)::int, 1);
    -- Add vowel
    result := result || substr(vowels, floor(random() * length(vowels) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
