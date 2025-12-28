import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Settlement } from "@/hooks/useSettlements";
import { GroupMember } from "@/hooks/useGroups";

interface SettlementHistoryProps {
  settlements: Settlement[];
  members: GroupMember[];
}

export function SettlementHistory({ settlements, members }: SettlementHistoryProps) {
  if (settlements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Ingen avräkningshistorik ännu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement, index) => {
        const fromUser = members.find((u) => u.user_id === settlement.from_user);
        const toUser = members.find((u) => u.user_id === settlement.to_user);

        return (
          <motion.div
            key={settlement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center">
                      <Check size={16} className="text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {fromUser?.name || "Okänd"}
                        <ArrowRight size={14} className="inline mx-1.5 text-muted-foreground" />
                        {toUser?.name || "Okänd"}
                      </p>
                      <p className="text-sm text-muted-foreground">{settlement.month}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">
                    {settlement.amount.toLocaleString("sv-SE")} kr
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
