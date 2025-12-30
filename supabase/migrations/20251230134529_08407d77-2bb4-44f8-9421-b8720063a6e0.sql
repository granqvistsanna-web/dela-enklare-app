-- Add repeat column to expenses table for recurring transactions
ALTER TABLE public.expenses
ADD COLUMN repeat text NOT NULL DEFAULT 'none';

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.repeat IS 'Recurring frequency: none, monthly, yearly';