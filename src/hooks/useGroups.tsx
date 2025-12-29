import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface GroupMember {
  id: string;
  user_id: string;
  name: string;
}

interface PublicProfile {
  id: string;
  user_id: string;
  name: string;
}

interface GroupInsert {
  name: string;
  is_temporary: boolean;
}

export interface Group {
  id: string;
  name: string;
  is_temporary: boolean;
  created_by: string;
  created_at: string;
  invite_code: string;
  members: GroupMember[];
}

export function useGroups() {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureHouseholdExists = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if user already has a household
      const { data: memberData } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (memberData?.group_id) {
        return memberData.group_id;
      }

      // Create household if it doesn't exist (fallback for existing users)
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: "Mitt hushåll",
          is_temporary: false,
        } as { name: string; is_temporary: boolean; invite_code: string })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add user as member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupData.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      return groupData.id;
    } catch (error) {
      console.error("Error ensuring household exists:", error);
      return null;
    }
  }, [user]);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setHousehold(null);
      setLoading(false);
      return;
    }

    try {
      // Ensure household exists
      const householdId = await ensureHouseholdExists();

      if (!householdId) {
        setHousehold(null);
        setLoading(false);
        return;
      }

      // Fetch household data and members in parallel
      const [groupResult, membersResult] = await Promise.all([
        supabase
          .from("groups")
          .select("*")
          .eq("id", householdId)
          .single(),
        supabase
          .from("group_members")
          .select("group_id, user_id")
          .eq("group_id", householdId)
      ]);

      if (groupResult.error) throw groupResult.error;
      if (membersResult.error) throw membersResult.error;

      const groupData = groupResult.data;
      const membersData = membersResult.data;

      // Get unique user IDs to fetch profiles
      const userIds = [...new Set(membersData?.map(m => m.user_id) || [])];

      // Fetch profiles for all members
      const profilesMap = new Map<string, { id: string; user_id: string; name: string }>();

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("public_profiles")
          .select("id, user_id, name")
          .in("user_id", userIds);

        if (profilesError) {
          console.error("Error fetching member profiles:", profilesError);
          // Continue anyway - members will show with fallback names
        }

        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });
      }

      // Build members list with profiles
      const members: GroupMember[] = membersData.map((member) => {
        const profile = profilesMap.get(member.user_id);

        return profile
          ? {
              id: profile.id,
              user_id: profile.user_id,
              name: profile.name,
            }
          : {
              id: member.user_id,
              user_id: member.user_id,
              name: "Okänd användare",
            };
      });

      // Build household with members
      const householdWithMembers: Group = {
        id: groupData.id,
        name: groupData.name,
        is_temporary: groupData.is_temporary,
        created_by: groupData.created_by,
        created_at: groupData.created_at,
        invite_code: groupData.invite_code,
        members,
      };

      setHousehold(householdWithMembers);
    } catch (error) {
      console.error("Error fetching household:", error);
      toast.error("Kunde inte hämta hushåll");
    } finally {
      setLoading(false);
    }
  }, [user, ensureHouseholdExists]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const addMembers = async (userIds: string[]) => {
    if (!household) {
      toast.error("Hushåll finns inte");
      return;
    }

    try {
      const membersToAdd = userIds.map(userId => ({
        group_id: household.id,
        user_id: userId,
      }));

      const { error } = await supabase
        .from("group_members")
        .insert(membersToAdd);

      if (error) {
        console.error("Error adding members:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      await fetchGroups();
      toast.success(`${userIds.length} ${userIds.length === 1 ? 'medlem' : 'medlemmar'} tillagd${userIds.length === 1 ? '' : 'a'}!`);
    } catch (error) {
      console.error("Error adding members:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Kunde inte lägga till medlemmar";
      toast.error(errorMessage);
    }
  };

  const removeMember = async (userId: string) => {
    if (!household) {
      toast.error("Hushåll finns inte");
      return;
    }

    try {
      const { error } = await supabase.rpc("remove_group_member", {
        group_id_param: household.id,
        user_id_param: userId,
      }) as { data: boolean | null; error: Error | null };

      if (error) {
        console.error("Error removing member:", error);
        throw error;
      }

      await fetchGroups();
      toast.success("Medlem borttagen");
    } catch (error) {
      console.error("Error removing member:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Kunde inte ta bort medlem";
      toast.error(errorMessage);
    }
  };

  const regenerateInviteCode = async () => {
    if (!household) {
      toast.error("Hushåll finns inte");
      return null;
    }

    try {
      const { data: newCode, error } = await supabase.rpc("regenerate_invite_code", {
        group_id_param: household.id,
      }) as { data: string | null; error: Error | null };

      if (error) {
        console.error("Error regenerating invite code:", error);
        throw error;
      }

      await fetchGroups();
      toast.success("Ny inbjudningskod genererad");
      return newCode;
    } catch (error) {
      console.error("Error regenerating invite code:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Kunde inte generera ny kod";
      toast.error(errorMessage);
      return null;
    }
  };

  const updateHouseholdName = async (name: string) => {
    if (!household) {
      toast.error("Hushåll finns inte");
      return;
    }

    try {
      const { error } = await supabase
        .from("groups")
        .update({ name })
        .eq("id", household.id);

      if (error) {
        console.error("Error updating household:", error);
        throw error;
      }

      await fetchGroups();
      toast.success("Hushållsnamn uppdaterat");
    } catch (error) {
      console.error("Error updating household:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Kunde inte uppdatera hushållsnamn";
      toast.error(errorMessage);
    }
  };

  return {
    household,
    loading,
    addMembers,
    removeMember,
    regenerateInviteCode,
    updateHouseholdName,
    refetch: fetchGroups,
  };
}
