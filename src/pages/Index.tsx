import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseItem } from "@/components/ExpenseItem";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { SettlementModal } from "@/components/SettlementModal";
import { SettlementHistory } from "@/components/SettlementHistory";
import { ImportModal } from "@/components/ImportModal";
import { IncomeOverviewCard } from "@/components/IncomeOverviewCard";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncomes";
import { useSettlements } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { calculateBalance } from "@/lib/balanceUtils";
import {
  Plus,
  Upload,
  TrendingUp,
  ArrowRight,
  Calendar,
  PiggyBank,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();

  // Find the primary household economy group (first group or one named "Hushållsekonomi")
  const primaryGroup = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    return groups.find(g => g.name.toLowerCase().includes("hushåll")) || groups[0];
  }, [groups]);

  const {
    expenses,
    loading: expensesLoading,
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
  } = useExpenses(primaryGroup?.id);

  const { incomes, loading: incomesLoading } = useIncomes(primaryGroup?.id);

  const { settlements, loading: settlementsLoading, addSettlement } = useSettlements(primaryGroup?.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const loading = groupsLoading || expensesLoading || incomesLoading || settlementsLoading;

  // Calculate balances
  const balances = useMemo(
    () => (primaryGroup ? calculateBalance(expenses, primaryGroup.members) : []),
    [expenses, primaryGroup]
  );

  // Calculate summary data
  const { positiveBalance, negativeBalance, positiveUser, negativeUser, oweAmount, totalExpenses } = useMemo(() => {
    const posBalance = balances.find((b) => b.balance > 0);
    const negBalance = balances.find((b) => b.balance < 0);

    return {
      positiveBalance: posBalance,
      negativeBalance: negBalance,
      positiveUser: posBalance ? primaryGroup?.members.find((u) => u.user_id === posBalance.userId) : undefined,
      negativeUser: negBalance ? primaryGroup?.members.find((u) => u.user_id === negBalance.userId) : undefined,
      oweAmount: negBalance ? Math.abs(negBalance.balance) : 0,
      totalExpenses: expenses.reduce((sum, e) => {
        const amount = Number.isFinite(e.amount) ? e.amount : 0;
        return sum + amount;
      }, 0),
    };
  }, [balances, primaryGroup?.members, expenses]);

  // Get current month display
  const currentMonth = new Date().toLocaleDateString("sv-SE", { month: "long", year: "numeric" });

  const handleAddExpense = useCallback(async (newExpense: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }) => {
    await addExpense(newExpense);
  }, [addExpense]);

  const handleImportExpenses = useCallback(async (newExpenses: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }[]) => {
    await addExpenses(newExpenses);
  }, [addExpenses]);

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveExpense = useCallback(async (updatedExpense: Expense) => {
    await updateExpense(updatedExpense.id, {
      amount: updatedExpense.amount,
      category: updatedExpense.category,
      description: updatedExpense.description,
      date: updatedExpense.date,
    });
    setIsEditModalOpen(false);
    setEditingExpense(null);
  }, [updateExpense]);

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    await deleteExpense(expenseId);
  }, [deleteExpense]);

  const handleSettle = useCallback(async () => {
    if (!negativeUser || !positiveUser || !primaryGroup?.id) return;

    await addSettlement({
      group_id: primaryGroup.id,
      from_user: negativeUser.user_id,
      to_user: positiveUser.user_id,
      amount: Math.round(oweAmount),
    });
    setIsSettleModalOpen(false);
  }, [negativeUser, positiveUser, primaryGroup?.id, addSettlement, oweAmount]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="h-6 w-48 rounded bg-secondary animate-pulse mb-4" />
          <div className="h-8 w-64 rounded bg-secondary animate-pulse mb-8" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded bg-secondary animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // No groups state
  if (!primaryGroup) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center py-20">
            <h1 className="text-2xl font-semibold text-foreground mb-4">Välkommen!</h1>
            <p className="text-muted-foreground mb-8">
              Du har inga grupper ännu. Gå till Inställningar för att skapa din första grupp.
            </p>
            <Button onClick={() => navigate("/installningar")}>
              Gå till Inställningar
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl py-8 px-4 sm:px-6">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar size={16} />
            <span className="capitalize">{currentMonth}</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">{primaryGroup.name}</h1>
          <p className="text-muted-foreground">Din hushållsekonomi i ett ögonkast</p>
        </div>

        {/* Summary Section */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Översikt denna månad
          </h2>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {/* Total Expenses Card */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Gemensamma utgifter</p>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-foreground tabular-nums">
                  {totalExpenses.toLocaleString("sv-SE")} kr
                </p>
                {primaryGroup.members.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    {balances.map((b) => {
                      const member = primaryGroup.members.find((u) => u.user_id === b.userId);
                      return (
                        <div key={b.userId} className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{member?.name || "Okänd"} betalat</span>
                          <span className="font-medium text-foreground tabular-nums">
                            {Math.abs(b.paid).toLocaleString("sv-SE")} kr
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Balance Card */}
            {primaryGroup.members.length > 1 ? (
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${oweAmount > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                        <ArrowRight size={18} className={oweAmount > 0 ? 'text-orange-600' : 'text-green-600'} />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Utgiftsbalans</p>
                    </div>
                    {oweAmount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSettleModalOpen(true)}
                        className="text-xs h-7"
                      >
                        Avräkna
                      </Button>
                    )}
                  </div>
                  {oweAmount > 0 && negativeUser && positiveUser ? (
                    <div>
                      <p className="text-base text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">{negativeUser.name}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium text-foreground">{positiveUser.name}</span>
                      </p>
                      <p className="text-2xl font-semibold text-foreground tabular-nums">
                        {Math.round(oweAmount).toLocaleString("sv-SE")} kr
                      </p>
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">Kvitt ✓</p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Income and Savings Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <IncomeOverviewCard
              incomes={incomes}
              members={primaryGroup.members}
              selectedYear={new Date().getFullYear()}
              selectedMonth={new Date().getMonth() + 1}
            />

            <Card className="border-border/50 border-dashed opacity-60">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-muted">
                    <PiggyBank size={18} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Gemensamt sparande</p>
                </div>
                <p className="text-lg text-muted-foreground">Kommer snart</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="h-10 w-full sm:w-auto">
              <TabsTrigger value="expenses" className="gap-2 flex-1 sm:flex-initial">
                Utgifter
                {expenses.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {expenses.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 flex-1 sm:flex-initial">
                Historik
                {settlements.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {settlements.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="gap-2 h-9 sm:h-8 flex-1 sm:flex-initial"
              >
                <Upload size={14} />
                <span className="hidden sm:inline">Importera</span>
                <span className="sm:hidden">Importera</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 h-9 sm:h-8 flex-1 sm:flex-initial"
              >
                <Plus size={14} />
                Lägg till
              </Button>
            </div>
          </div>

          <TabsContent value="expenses" className="mt-0">
            {expenses.length > 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {expenses.map((expense, index) => (
                      <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        members={primaryGroup.members}
                        index={index}
                        onEdit={handleEditExpense}
                        onDelete={handleDeleteExpense}
                        currentUserId={user?.id}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <TrendingUp size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Inga utgifter ännu</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus size={14} />
                    Lägg till första utgiften
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <SettlementHistory settlements={settlements} members={primaryGroup.members} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExpense}
        groupId={primaryGroup.id}
        members={primaryGroup.members}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExpenses}
        groupId={primaryGroup.id}
        currentUserId={user?.id || ""}
      />

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        expense={editingExpense}
        members={primaryGroup.members}
      />

      {negativeUser && positiveUser && (
        <SettlementModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          onConfirm={handleSettle}
          fromUser={negativeUser}
          toUser={positiveUser}
          amount={oweAmount}
        />
      )}
    </div>
  );
};

export default Index;
