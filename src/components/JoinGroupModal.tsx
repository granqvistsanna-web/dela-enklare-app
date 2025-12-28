import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("invite_code", code.trim().toUpperCase())
        .single();

      if (groupError || !group) {
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

      if (memberError) throw memberError;

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
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">Gå med i grupp</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X size={18} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
