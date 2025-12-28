import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Group, Expense, User } from "@/lib/types";
import { calculateBalance } from "@/lib/mockData";

interface GroupCardProps {
  group: Group;
  expenses: Expense[];
  users: User[];
}

export function GroupCard({ group, expenses, users }: GroupCardProps) {
  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  const balances = calculateBalance(groupExpenses, users);
  
  const positiveBalance = balances.find((b) => b.balance > 0);
  const positiveUser = users.find((u) => u.id === positiveBalance?.userId);
  const negativeBalance = balances.find((b) => b.balance < 0);
  const negativeUser = users.find((u) => u.id === negativeBalance?.userId);

  const totalExpenses = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
  const oweAmount = Math.abs(negativeBalance?.balance || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/grupp/${group.id}`}>
        <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {group.name}
                  </h3>
                  {group.isTemporary && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                      Tillfällig
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users size={14} />
                  <span>{users.map((u) => u.name).join(" & ")}</span>
                </div>
              </div>
              <ArrowRight
                size={20}
                className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Total denna period
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {totalExpenses.toLocaleString("sv-SE")} kr
                  </p>
                </div>
                
                {oweAmount > 0 && negativeUser && positiveUser && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Att göra upp
                    </p>
                    <p className="text-sm font-medium">
                      <span className="text-accent">{negativeUser.name}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-success">{positiveUser.name}</span>
                      <span className="text-foreground ml-1.5 font-semibold">
                        {Math.round(oweAmount).toLocaleString("sv-SE")} kr
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
