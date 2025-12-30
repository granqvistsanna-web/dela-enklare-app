-- Drop existing restrictive policies for incomes
DROP POLICY IF EXISTS "Income recipients can delete their incomes" ON public.incomes;
DROP POLICY IF EXISTS "Income recipients can update their incomes" ON public.incomes;

-- Drop existing restrictive policies for expenses
DROP POLICY IF EXISTS "Expense creator can delete their expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expense creator can update their expenses" ON public.expenses;

-- Create new policies that allow any group member to manage incomes
CREATE POLICY "Group members can delete incomes"
ON public.incomes
FOR DELETE
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can update incomes"
ON public.incomes
FOR UPDATE
USING (is_group_member(auth.uid(), group_id));

-- Create new policies that allow any group member to manage expenses
CREATE POLICY "Group members can delete expenses"
ON public.expenses
FOR DELETE
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can update expenses"
ON public.expenses
FOR UPDATE
USING (is_group_member(auth.uid(), group_id));