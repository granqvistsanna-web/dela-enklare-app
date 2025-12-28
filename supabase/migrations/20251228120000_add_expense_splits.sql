-- Add splits column to expenses table to support flexible expense splitting
-- Format: { "user_id": amount_owed, ... }
-- Example: { "uuid-1": 300, "uuid-2": 700 } for a 1000kr expense
ALTER TABLE public.expenses
ADD COLUMN splits jsonb;

-- Add a check constraint to ensure splits sum equals amount (optional but recommended)
-- This will be enforced at the application level for now to allow for existing data

-- Add comment to document the column
COMMENT ON COLUMN public.expenses.splits IS 'JSONB object mapping user IDs to amounts owed. If null, defaults to equal split among all group members.';
