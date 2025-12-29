import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JoinGroupModal({ isOpen, onClose, onSuccess }: JoinGroupModalProps) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!user || !code.trim()) return;

    setLoading(true);
    try {
      // Validate code format (6 alphanumeric characters)
      const trimmedCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(trimmedCode)) {
        toast.error("Ogiltig kod", { description: "Koden måste vara 6 tecken lång." });
        setLoading(false);
        return;
      }

      // Find group by invite code using RPC function to bypass RLS
      const { data, error: groupError } = await supabase
        .rpc("lookup_group_by_invite_code", { code: trimmedCode }) as {
          data: Array<{ id: string; name: string; created_by: string }> | null;
          error: Error | null;
        };

      if (groupError) {
        console.error("Error looking up group:", groupError);
        toast.error("Ogiltig kod", { description: "Ingen grupp hittades med den koden." });
        setLoading(false);
        return;
      }

      const group = data?.[0];
      if (!group) {
        toast.error("Ogiltig kod", { description: "Ingen grupp hittades med den koden." });
        setLoading(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        toast.info("Du är redan medlem i denna grupp");
        onClose();
        onSuccess();
        return;
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert([{ group_id: group.id, user_id: user.id }]);

      if (memberError) {
        console.error("Error joining group:", memberError);
        console.error("Error details:", {
          code: memberError.code,
          message: memberError.message,
          details: memberError.details,
          hint: memberError.hint,
        });
        throw memberError;
      }

      toast.success(`Du gick med i ${group.name}`);
      setCode("");
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Kunde inte gå med i gruppen");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-background border border-border rounded-md w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground">Gå med i grupp</h2>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    Ange gruppkod
                  </label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>
                <Button 
                  onClick={handleJoin} 
                  className="w-full"
                  disabled={loading || code.length < 6}
                >
                  {loading ? "Går med..." : "Gå med"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
