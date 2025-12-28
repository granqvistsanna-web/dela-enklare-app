import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Group } from "@/hooks/useGroups";
import { Expense } from "@/hooks/useExpenses";
import { calculateBalance } from "@/lib/balanceUtils";

interface GroupCardProps {
  group: Group;
  expenses: Expense[];
}

export function GroupCard({ group, expenses }: GroupCardProps) {
  const balances = calculateBalance(expenses, group.members);
  
  const positiveBalance = balances.find((b) => b.balance > 0);
  const positiveUser = group.members.find((u) => u.user_id === positiveBalance?.userId);
  const negativeBalance = balances.find((b) => b.balance < 0);
  const negativeUser = group.members.find((u) => u.user_id === negativeBalance?.userId);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const oweAmount = Math.abs(negativeBalance?.balance || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/grupp/${group.id}`}>
        <Card className="group cursor-pointer hover:bg-secondary/50 border-border transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {group.name}
                  </h3>
                  {group.is_temporary && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Tillfällig
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={15} />
                  <span>
                    {group.members.length > 0
                      ? group.members.map((u) => u.name).join(", ")
                      : "Inga medlemmar"}
                  </span>
                </div>
              </div>
              <ArrowRight
                size={18}
                className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-1"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Total
                </p>
                <p className="text-xl font-semibold text-foreground tabular-nums">
                  {totalExpenses.toLocaleString("sv-SE")} kr
                </p>
              </div>

              {oweAmount > 0 && negativeUser && positiveUser && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    Att göra upp
                  </p>
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground">{negativeUser.name}</span>
                    <span className="text-muted-foreground/50 mx-1">→</span>
                    <span className="text-muted-foreground">{positiveUser.name}</span>
                    <span className="text-foreground ml-2 font-semibold tabular-nums">
                      {Math.round(oweAmount).toLocaleString("sv-SE")} kr
                    </span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
