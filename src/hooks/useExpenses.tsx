import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ExpenseSplit {
  [userId: string]: number;
}

export interface Expense {
  id: string;
  group_id: string;
  amount: number;
  paid_by: string;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
  splits?: ExpenseSplit | null;
}

export function useExpenses(groupId?: string) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from("expenses").select("*");

      if (groupId) {
        query = query.eq("group_id", groupId);
      }

      const { data, error } = await query.order("date", { ascending: false });

      if (error) throw error;

      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Kunde inte hämta utgifter");
    } finally {
      setLoading(false);
    }
  }, [user, groupId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expense: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
    splits?: ExpenseSplit | null;
  }) => {
    if (!user) {
      toast.error("Du måste vara inloggad");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...expense,
          paid_by: user.id, // Always use current user
        })
        .select()
        .single();

      if (error) throw error;

      await fetchExpenses();
      toast.success("Utgift tillagd!");
      return data;
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Kunde inte lägga till utgift");
      return null;
    }
  };

  const updateExpense = async (
    expenseId: string,
    updates: Partial<Omit<Expense, "id" | "created_at">>
  ) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", expenseId);

      if (error) throw error;

      await fetchExpenses();
      toast.success("Utgift uppdaterad!");
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Kunde inte uppdatera utgift");
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      await fetchExpenses();
      toast.success("Utgift borttagen!");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Kunde inte ta bort utgift");
    }
  };

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
