import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  date: string;
  month: string;
  created_at: string;
}

export function useSettlements(groupId?: string) {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettlements = useCallback(async () => {
    if (!user) {
      setSettlements([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from("settlements").select("*");

      if (groupId) {
        query = query.eq("group_id", groupId);
      }

      const { data, error } = await query.order("date", { ascending: false });

      if (error) throw error;

      setSettlements(data || []);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      toast.error("Kunde inte hämta avräkningar");
    } finally {
      setLoading(false);
    }
  }, [user, groupId]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const addSettlement = async (settlement: {
    group_id: string;
    from_user: string;
    to_user: string;
    amount: number;
  }) => {
    if (!user) {
      toast.error("Du måste vara inloggad");
      return null;
    }

    const now = new Date();
    const month = now.toLocaleDateString("sv-SE", {
      month: "long",
      year: "numeric",
    });

    try {
      const { data, error } = await supabase
        .from("settlements")
        .insert({
          ...settlement,
          date: now.toISOString().split("T")[0],
          month: month.charAt(0).toUpperCase() + month.slice(1),
        })
        .select()
        .single();

      if (error) throw error;

      await fetchSettlements();
      toast.success("Avräkning registrerad!");
      return data;
    } catch (error) {
      console.error("Error adding settlement:", error);
      toast.error("Kunde inte registrera avräkning");
      return null;
    }
  };

  return {
    settlements,
    loading,
    addSettlement,
    refetch: fetchSettlements,
  };
}
