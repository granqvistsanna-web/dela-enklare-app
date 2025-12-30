import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupMember } from "@/hooks/useGroups";
import { Expense } from "@/hooks/useExpenses";
import { Settlement } from "@/hooks/useSettlements";
import { calculateBalance } from "@/lib/balanceUtils";
import { SettlementModal } from "@/components/SettlementModal";
import { Check, Users, Loader2 } from "lucide-react";

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

  // Calculate balances from expenses and settlements
  const adjustedBalances = useMemo(
    () => calculateBalance(expenses, members, monthlySettlements),
    [expenses, members, monthlySettlements]
  );

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
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-subheading">Balans</h2>
        <Card>
          <CardContent className="p-4 sm:p-5">
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
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-subheading">Balans</h2>
        <Card className="border-income/20 bg-income-bg">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-income-bg">
                <Check size={18} className="text-income sm:hidden" />
                <Check size={20} className="text-income hidden sm:block" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground text-sm sm:text-base">Ni är jämna!</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Inga utestående skulder denna månad.
                </p>
              </div>
            </div>

            {monthlySettlements.length > 0 && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground mb-2">
                  Avräkningar denna månad
                </p>
                <div className="space-y-1.5">
                  {monthlySettlements.map((s) => {
                    const from = members.find((m) => m.user_id === s.from_user);
                    const to = members.find((m) => m.user_id === s.to_user);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-xs sm:text-sm gap-2"
                      >
                        <span className="text-muted-foreground truncate">
                          {from?.name} → {to?.name}
                        </span>
                        <span className="font-medium text-foreground tabular-nums shrink-0">
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
    <div className="space-y-2 sm:space-y-3">
      <h2 className="text-subheading">Balans</h2>
      <Card>
        <CardContent className="p-4 sm:p-5">
          {/* Balance overview */}
          <div className="space-y-3 sm:space-y-4">
            {/* Who owes whom - stacked on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Att betala</p>
                <p className="text-sm sm:text-base font-medium text-foreground truncate">
                  {negativeUser?.name} → {positiveUser?.name}
                </p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
                {Math.round(oweAmount).toLocaleString("sv-SE")} kr
              </p>
            </div>

            {/* Individual balances */}
            <div className="pt-3 sm:pt-4 border-t border-border/60">
              <p className="text-xs text-muted-foreground mb-2 sm:mb-3">Individuella balanser</p>
              <div className="space-y-2">
                {adjustedBalances.map((balance) => {
                  const member = members.find((m) => m.user_id === balance.userId);
                  const isPositive = balance.balance > 0;
                  const isNegative = balance.balance < 0;

                  return (
                    <div
                      key={balance.userId}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-icon-blue-bg flex items-center justify-center text-xs font-semibold text-icon-blue shrink-0">
                          {(member?.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground truncate">
                          {member?.name || "Okänd"}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium tabular-nums shrink-0 ${
                          isPositive
                            ? "text-income"
                            : isNegative
                            ? "text-expense"
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
              <div className="pt-3 sm:pt-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground mb-2">
                  Avräkningar denna månad
                </p>
                <div className="space-y-1.5">
                  {monthlySettlements.map((s) => {
                    const from = members.find((m) => m.user_id === s.from_user);
                    const to = members.find((m) => m.user_id === s.to_user);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-xs sm:text-sm gap-2"
                      >
                        <span className="text-muted-foreground truncate">
                          {from?.name} → {to?.name}
                        </span>
                        <span className="font-medium text-foreground tabular-nums shrink-0">
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
              className="w-full mt-1 sm:mt-2"
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
