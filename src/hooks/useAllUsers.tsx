import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PublicUser {
  id: string;
  user_id: string;
  name: string;
}

export function useAllUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!user) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_all_users");

        if (error) {
          console.error("Error fetching all users:", error);
          setUsers([]);
        } else {
          setUsers(data || []);
        }
      } catch (error) {
        console.error("Error fetching all users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, [user]);

  return { users, loading };
}
