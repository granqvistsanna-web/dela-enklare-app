import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupMember } from "@/hooks/useGroups";
import { Expense } from "@/hooks/useExpenses";
import { Settlement } from "@/hooks/useSettlements";
import { calculateBalance } from "@/lib/balanceUtils";
import { SettlementModal } from "@/components/SettlementModal";
import { ArrowRight, Check, Users, Loader2 } from "lucide-react";

interface BalanceCardProps {
  expenses: Expense[];
  members: GroupMember[];
  settlements: Settlement[];
  selectedYear: number;
  selectedMonth: number;
  onSettle: (fromUser: string, toUser: string, amount: number) => Promise<void>;
  isSettling?: boolean;
}

export function BalanceCard({
  expenses,
  members,
  settlements,
  selectedYear,
  selectedMonth,
  onSettle,
  isSettling = false,
}: BalanceCardProps) {
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Filter settlements for the selected month
  const monthlySettlements = useMemo(() => {
    return settlements.filter((s) => {
      const date = new Date(s.date);
      return (
        date.getFullYear() === selectedYear &&
        date.getMonth() + 1 === selectedMonth
      );
    });
  }, [settlements, selectedYear, selectedMonth]);

  // Calculate balances from expenses
  const rawBalances = useMemo(
    () => calculateBalance(expenses, members),
    [expenses, members]
  );

  // Adjust balances based on settlements for this month
  const adjustedBalances = useMemo(() => {
    const balanceMap: Record<string, number> = {};

    // Initialize with raw balances
    rawBalances.forEach((b) => {
      balanceMap[b.userId] = b.balance;
    });

    // Apply settlements (reduce the debt/credit)
    monthlySettlements.forEach((s) => {
      // from_user paid to_user, so from_user's debt decreases (balance increases)
      // and to_user's credit decreases (balance decreases)
      if (balanceMap[s.from_user] !== undefined) {
        balanceMap[s.from_user] += s.amount;
      }
      if (balanceMap[s.to_user] !== undefined) {
        balanceMap[s.to_user] -= s.amount;
      }
    });

    return members.map((m) => ({
      userId: m.user_id,
      balance: balanceMap[m.user_id] || 0,
    }));
  }, [rawBalances, monthlySettlements, members]);

  // Find who owes whom
  const { positiveUser, negativeUser, oweAmount } = useMemo(() => {
    const posBalance = adjustedBalances.find((b) => b.balance > 0.5);
    const negBalance = adjustedBalances.find((b) => b.balance < -0.5);

    return {
      positiveUser: posBalance
        ? members.find((m) => m.user_id === posBalance.userId)
        : undefined,
      negativeUser: negBalance
        ? members.find((m) => m.user_id === negBalance.userId)
        : undefined,
      oweAmount: negBalance ? Math.abs(negBalance.balance) : 0,
    };
  }, [adjustedBalances, members]);

  const handleConfirmSettle = async () => {
    if (!negativeUser || !positiveUser) return;
    await onSettle(negativeUser.user_id, positiveUser.user_id, Math.round(oweAmount));
    setIsSettleModalOpen(false);
  };

  // No balance section if only one member
  if (members.length < 2) {
    return (
      <div className="space-y-3">
        <h2 className="text-subheading">Balans</h2>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Users size={18} />
              <p className="text-sm">Lägg till fler medlemmar för att se balansen.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All settled
  if (oweAmount < 1) {
    return (
      <div className="space-y-3">
        <h2 className="text-subheading">Balans</h2>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <Check size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">Ni är jämna!</p>
                <p className="text-sm text-muted-foreground">
                  Inga utestående skulder denna månad.
                </p>
              </div>
            </div>

            {monthlySettlements.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground mb-2">
                  Avräkningar denna månad
                </p>
                <div className="space-y-1">
                  {monthlySettlements.map((s) => {
                    const from = members.find((m) => m.user_id === s.from_user);
                    const to = members.find((m) => m.user_id === s.to_user);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {from?.name} → {to?.name}
                        </span>
                        <span className="font-medium text-foreground tabular-nums">
                          {s.amount.toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-subheading">Balans</h2>
      <Card>
        <CardContent className="p-5">
          {/* Balance overview */}
          <div className="space-y-4">
            {/* Who owes whom */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <ArrowRight size={18} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Att betala</p>
                  <p className="text-base font-medium text-foreground">
                    {negativeUser?.name} → {positiveUser?.name}
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {Math.round(oweAmount).toLocaleString("sv-SE")} kr
              </p>
            </div>

            {/* Individual balances */}
            <div className="pt-4 border-t border-border/60">
              <p className="text-xs text-muted-foreground mb-3">Individuella balanser</p>
              <div className="space-y-2">
                {adjustedBalances.map((balance) => {
                  const member = members.find((m) => m.user_id === balance.userId);
                  const isPositive = balance.balance > 0;
                  const isNegative = balance.balance < 0;

                  return (
                    <div
                      key={balance.userId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {(member?.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground">
                          {member?.name || "Okänd"}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          isPositive
                            ? "text-green-600 dark:text-green-400"
                            : isNegative
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {Math.round(balance.balance).toLocaleString("sv-SE")} kr
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settlement history for this month */}
            {monthlySettlements.length > 0 && (
              <div className="pt-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground mb-2">
                  Avräkningar denna månad
                </p>
                <div className="space-y-1">
                  {monthlySettlements.map((s) => {
                    const from = members.find((m) => m.user_id === s.from_user);
                    const to = members.find((m) => m.user_id === s.to_user);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {from?.name} → {to?.name}
                        </span>
                        <span className="font-medium text-foreground tabular-nums">
                          {s.amount.toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick settle button */}
            <Button
              className="w-full mt-2"
              onClick={() => setIsSettleModalOpen(true)}
              disabled={isSettling}
            >
              {isSettling ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Registrerar...
                </>
              ) : (
                "Registrera betalning"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settlement modal */}
      {negativeUser && positiveUser && (
        <SettlementModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          onConfirm={handleConfirmSettle}
          fromUser={negativeUser}
          toUser={positiveUser}
          amount={oweAmount}
        />
      )}
    </div>
  );
}
