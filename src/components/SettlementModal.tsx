import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupMember } from "@/hooks/useGroups";

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromUser: GroupMember;
  toUser: GroupMember;
  amount: number;
}

export function SettlementModal({
  isOpen,
  onClose,
  onConfirm,
  fromUser,
  toUser,
  amount,
}: SettlementModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <Card className="border-border shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-success" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
                <CardTitle className="text-xl">Gör avräkning</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
                <p className="text-muted-foreground text-sm">
                  Bekräfta att betalningen har genomförts för att nollställa balansen.
                </p>

                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="text-center">
                    <div className="h-14 w-14 rounded-full bg-accent/15 flex items-center justify-center text-xl font-bold text-accent mx-auto mb-2">
                      {fromUser.name[0]}
                    </div>
                    <p className="font-medium text-foreground">{fromUser.name}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <p className="text-2xl font-bold text-foreground mb-1">
                      {Math.round(amount).toLocaleString("sv-SE")} kr
                    </p>
                    <ArrowRight size={24} className="text-primary" />
                  </div>

                  <div className="text-center">
                    <div className="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center text-xl font-bold text-success mx-auto mb-2">
                      {toUser.name[0]}
                    </div>
                    <p className="font-medium text-foreground">{toUser.name}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Avbryt
                  </Button>
                  <Button variant="success" className="flex-1" onClick={onConfirm}>
                    <Check size={18} />
                    Bekräfta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
