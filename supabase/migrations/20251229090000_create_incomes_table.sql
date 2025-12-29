-- Create incomes table for tracking household income with 50/50 sharing
CREATE TABLE IF NOT EXISTS public.incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0), -- Amount in cents
  recipient uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('salary', 'bonus', 'benefit', 'other')),
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  repeat text NOT NULL DEFAULT 'none' CHECK (repeat IN ('none', 'monthly')),
  included_in_split boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can view incomes in their groups
CREATE POLICY "Group members can view incomes"
  ON public.incomes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = incomes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Policy: Group members can create incomes in their groups
CREATE POLICY "Group members can create incomes"
  ON public.incomes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = incomes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Policy: Only income creator can update their own incomes
CREATE POLICY "Income creator can update their own incomes"
  ON public.incomes
  FOR UPDATE
  USING (recipient = auth.uid())
  WITH CHECK (recipient = auth.uid());

-- Policy: Only income creator can delete their own incomes
CREATE POLICY "Income creator can delete their own incomes"
  ON public.incomes
  FOR DELETE
  USING (recipient = auth.uid());

-- Create index for faster queries by group and date
CREATE INDEX IF NOT EXISTS incomes_group_id_idx ON public.incomes(group_id);
CREATE INDEX IF NOT EXISTS incomes_date_idx ON public.incomes(date DESC);
CREATE INDEX IF NOT EXISTS incomes_group_date_idx ON public.incomes(group_id, date DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_incomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_incomes_updated_at();
