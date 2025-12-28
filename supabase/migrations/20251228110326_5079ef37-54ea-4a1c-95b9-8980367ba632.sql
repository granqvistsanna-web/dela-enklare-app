-- Create groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_temporary boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create group_members junction table
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  paid_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create settlements table
CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  month text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Helper function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Groups policies
CREATE POLICY "Users can view groups they are members of"
ON public.groups FOR SELECT
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
ON public.groups FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
ON public.groups FOR DELETE
USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group creators can add members"
ON public.group_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Group creators can remove members"
ON public.group_members FOR DELETE
USING (EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid()));

-- Expenses policies
CREATE POLICY "Members can view group expenses"
ON public.expenses FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create expenses"
ON public.expenses FOR INSERT
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = paid_by);

CREATE POLICY "Expense creator can update their expenses"
ON public.expenses FOR UPDATE
USING (auth.uid() = paid_by);

CREATE POLICY "Expense creator can delete their expenses"
ON public.expenses FOR DELETE
USING (auth.uid() = paid_by);

-- Settlements policies
CREATE POLICY "Members can view group settlements"
ON public.settlements FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create settlements"
ON public.settlements FOR INSERT
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = from_user);

CREATE POLICY "Settlement creator can delete their settlements"
ON public.settlements FOR DELETE
USING (auth.uid() = from_user);