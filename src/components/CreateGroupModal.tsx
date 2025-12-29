import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useAuth } from "@/hooks/useAuth";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, isTemporary: boolean, selectedUserIds: string[]) => void;
}

export function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
  const { user } = useAuth();
  const { users, loading: usersLoading } = useAllUsers();
  const [name, setName] = useState("");
  const [isTemporary, setIsTemporary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), isTemporary, selectedUserIds);
      setName("");
      setIsTemporary(false);
      setSelectedUserIds([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter out current user from the list
  const availableUsers = users.filter(u => u.user_id !== user?.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-background border border-border rounded-md w-full max-w-md p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground">Ny grupp</h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center -mr-1">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="text-sm text-muted-foreground">
                    Namn
                  </Label>
                  <Input
                    id="groupName"
                    placeholder="t.ex. Hushåll"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="h-11 sm:h-10"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="temporary" className="text-sm text-foreground">Tillfällig</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      För resor eller engångsprojekt
                    </p>
                  </div>
                  <Switch
                    id="temporary"
                    checked={isTemporary}
                    onCheckedChange={setIsTemporary}
                    className="shrink-0"
                  />
                </div>

                {availableUsers.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm text-foreground">
                      Lägg till medlemmar (valfritt)
                    </Label>
                    <div className="border border-border rounded-md max-h-48 overflow-y-auto">
                      {usersLoading ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          Laddar användare...
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {availableUsers.map((u) => (
                            <div
                              key={u.user_id}
                              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleUser(u.user_id)}
                            >
                              <Checkbox
                                checked={selectedUserIds.includes(u.user_id)}
                                onCheckedChange={() => toggleUser(u.user_id)}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-foreground">{u.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedUserIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedUserIds.length} {selectedUserIds.length === 1 ? 'medlem' : 'medlemmar'} valda
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-10"
                  disabled={isSubmitting || !name.trim()}
                >
                  {isSubmitting ? "Skapar..." : "Skapa"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
