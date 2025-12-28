import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface GroupMember {
  id: string;
  user_id: string;
  name: string;
}


export interface Group {
  id: string;
  name: string;
  is_temporary: boolean;
  created_by: string;
  created_at: string;
  members: GroupMember[];
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch groups the user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = memberData.map((m) => m.group_id);

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .in("id", groupIds);

      if (groupsError) throw groupsError;

      // Fetch all members for these groups
      const { data: allMembers, error: membersError } = await supabase
        .from("group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds);

      if (membersError) throw membersError;

      // Fetch profiles for all members
      const memberUserIds = [...new Set(allMembers?.map((m) => m.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from("public_profiles")
        .select("user_id, name, id")
        .in("user_id", memberUserIds);

      if (profilesError) throw profilesError;

      // Map profiles to a lookup
      const profileLookup = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      // Build groups with members
      const groupsWithMembers: Group[] = (groupsData || []).map((group) => {
        const groupMemberUserIds = allMembers
          ?.filter((m) => m.group_id === group.id)
          .map((m) => m.user_id) || [];

        const members: GroupMember[] = groupMemberUserIds
          .map((userId) => {
            const profile = profileLookup.get(userId);
            if (!profile) return null;
            return {
              id: profile.id,
              user_id: profile.user_id,
              name: profile.name,
            };
          })
          .filter(Boolean) as GroupMember[];

        return {
          id: group.id,
          name: group.name,
          is_temporary: group.is_temporary,
          created_by: group.created_by,
          created_at: group.created_at,
          members,
        };
      });

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Kunde inte hämta grupper");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, isTemporary: boolean = false) => {
    if (!user) {
      toast.error("Du måste vara inloggad");
      return null;
    }

    try {
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert(
          {
            name,
            is_temporary: isTemporary,
          } as any
        )
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as a member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupData.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      await fetchGroups();
      toast.success("Grupp skapad!");
      return groupData;
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Kunde inte skapa grupp");
      return null;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      await fetchGroups();
      toast.success("Grupp borttagen");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Kunde inte ta bort grupp");
    }
  };

  return {
    groups,
    loading,
    createGroup,
    deleteGroup,
    refetch: fetchGroups,
  };
}
