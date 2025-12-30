-- Add support for custom split amounts per expense
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS splits jsonb;

COMMENT ON COLUMN public.expenses.splits IS 'Optional per-user split map: {"userId": amount}. Null means equal split.';