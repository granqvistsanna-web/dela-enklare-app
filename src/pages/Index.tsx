import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseItem } from "@/components/ExpenseItem";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { SettlementModal } from "@/components/SettlementModal";
import { SettlementHistory } from "@/components/SettlementHistory";
import { ImportModal } from "@/components/ImportModal";
import { IncomeOverviewCard } from "@/components/IncomeOverviewCard";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useIncomes, Income } from "@/hooks/useIncomes";
import { useSettlements } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { calculateBalance } from "@/lib/balanceUtils";
import { calculateIncomeSettlement } from "@/lib/incomeUtils";
import {
  Plus,
  Upload,
  TrendingDown,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household, loading: householdLoading } = useGroups();

  const {
    expenses,
    loading: expensesLoading,
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
  } = useExpenses(household?.id);

  const { incomes, loading: incomesLoading, addIncome } = useIncomes(primaryGroup?.id);

  const { settlements, loading: settlementsLoading, addSettlement } = useSettlements(household?.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const loading = householdLoading || expensesLoading || incomesLoading || settlementsLoading;

  // Get current month and year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12
  const currentMonth = now.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });

  // Calculate expense balances
  const expenseBalances = useMemo(
    () => (household ? calculateBalance(expenses, household.members) : []),
    [expenses, household]
  );

  // Calculate expense summary
  const expenseSummary = useMemo(() => {
    const posBalance = expenseBalances.find((b) => b.balance > 0);
    const negBalance = expenseBalances.find((b) => b.balance < 0);

    return {
      positiveBalance: posBalance,
      negativeBalance: negBalance,
      positiveUser: posBalance ? household?.members.find((u) => u.user_id === posBalance.userId) : undefined,
      negativeUser: negBalance ? household?.members.find((u) => u.user_id === negBalance.userId) : undefined,
      oweAmount: negBalance ? Math.abs(negBalance.balance) : 0,
      totalExpenses: expenses.reduce((sum, e) => {
        const amount = Number.isFinite(e.amount) ? e.amount : 0;
        return sum + amount;
      }, 0),
    };
  }, [expenseBalances, household?.members, expenses]);

  // Calculate income settlement
  const incomeSettlement = useMemo(() => {
    if (!household || household.members.length < 2) {
      return null;
    }
    const [personA, personB] = household.members;
    return calculateIncomeSettlement(
      incomes,
      personA.user_id,
      personB.user_id,
      currentYear,
      currentMonthNum
    );
  }, [incomes, household, currentYear, currentMonthNum]);

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

  const handleAddIncome = useCallback(async (newIncome: any) => {
    return await addIncome(newIncome);
  }, [addIncome]);

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
    if (!expenseSummary.negativeUser || !expenseSummary.positiveUser || !household?.id) return;

    await addSettlement({
      group_id: household.id,
      from_user: expenseSummary.negativeUser.user_id,
      to_user: expenseSummary.positiveUser.user_id,
      amount: Math.round(expenseSummary.oweAmount),
    });
    setIsSettleModalOpen(false);
  }, [expenseSummary.negativeUser, expenseSummary.positiveUser, household?.id, addSettlement, expenseSummary.oweAmount]);

  // Combine expenses and incomes for "Denna månad" view
  const combinedItems = useMemo(() => {
    const items: Array<{ type: 'expense' | 'income'; data: Expense | Income; date: string }> = [];

    expenses.forEach(expense => {
      items.push({ type: 'expense', data: expense, date: expense.date });
    });

    incomes.forEach(income => {
      items.push({ type: 'income', data: income, date: income.date });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes]);

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
  if (!household) {
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
        {/* Month selector - non-intrusive at top */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            <span className="capitalize font-medium">{currentMonth}</span>
          </div>
        </div>

        {/* Group name with action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">{household.name}</h1>
          <div className="flex gap-3">
            <Button
              size="default"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 flex-1 sm:flex-initial hover:scale-105 active:scale-95 transition-transform shadow-sm"
            >
              <Plus size={16} />
              Lägg till
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsImportModalOpen(true)}
              className="gap-2 flex-1 sm:flex-initial hover:scale-105 active:scale-95 transition-transform"
            >
              <Upload size={16} />
              Importera
            </Button>
          </div>
        </div>

        {/* Summary Section - Comprehensive household overview */}
        <div className="mb-8">
          <div className="grid gap-6 mb-6">
            {/* Expenses Summary Card */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Utgifter</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {expenseSummary.totalExpenses.toLocaleString("sv-SE")} kr
                  </p>
                </div>

                {household.members.length > 1 && (
                  <>
                    <div className="space-y-2 mb-4">
                      {expenseBalances.map((b) => {
                        const member = household.members.find((u) => u.user_id === b.userId);
                        return (
                          <div key={b.userId} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{member?.name || "Okänd"} betalat</span>
                            <span className="font-semibold text-foreground tabular-nums">
                              {Math.abs(b.paid).toLocaleString("sv-SE")} kr
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Expense Settlement Result */}
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Utjämning</p>
                        {expenseSummary.oweAmount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSettleModalOpen(true)}
                            className="text-xs h-7 hover:scale-105 transition-transform"
                          >
                            Settla
                          </Button>
                        )}
                      </div>
                      {expenseSummary.oweAmount > 0 && expenseSummary.negativeUser && expenseSummary.positiveUser ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{expenseSummary.negativeUser.name}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm font-medium text-foreground">{expenseSummary.positiveUser.name}</span>
                          <span className="ml-auto text-lg font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                            {Math.round(expenseSummary.oweAmount).toLocaleString("sv-SE")} kr
                          </span>
                        </div>
                      ) : (
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">Kvitt ✓</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Income Summary Card */}
            {incomeSettlement && (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Inkomster</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      {(incomeSettlement.totalIncome / 100).toLocaleString("sv-SE")} kr
                    </p>
                  </div>

                  {household.members.length > 1 && (
                    <>
                      <div className="space-y-2 mb-4">
                        {household.members.map((member, idx) => {
                          const income = idx === 0 ? incomeSettlement.personAIncome : incomeSettlement.personBIncome;
                          return (
                            <div key={member.user_id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{member.name} tjänat</span>
                              <span className="font-semibold text-foreground tabular-nums">
                                {(income / 100).toLocaleString("sv-SE")} kr
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Income Settlement Result */}
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Utjämning</p>
                        {incomeSettlement.transferAmount > 0 && incomeSettlement.transferFrom && incomeSettlement.transferTo ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {household.members.find(m => m.user_id === incomeSettlement.transferFrom)?.name}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-sm font-medium text-foreground">
                              {household.members.find(m => m.user_id === incomeSettlement.transferTo)?.name}
                            </span>
                            <span className="ml-auto text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                              {(incomeSettlement.transferAmount / 100).toLocaleString("sv-SE")} kr
                            </span>
                          </div>
                        ) : (
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">Kvitt ✓</p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Income Overview */}
          <IncomeOverviewCard
            incomes={incomes}
            members={household.members}
            selectedYear={new Date().getFullYear()}
            selectedMonth={new Date().getMonth() + 1}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="h-11 w-full sm:w-auto mb-6 grid grid-cols-3">
            <TabsTrigger value="dashboard" className="gap-2 text-sm">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="transaktioner" className="gap-2 text-sm">
              Transaktioner
              {combinedItems.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {combinedItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 text-sm">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard tab - Summary overview */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="space-y-6">
              {/* Snabb översikt - senaste transaktioner */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Senaste aktivitet</h3>
                {combinedItems.length > 0 ? (
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/50">
                        {combinedItems.slice(0, 5).map((item) => (
                          item.type === 'expense' ? (
                            <div key={`expense-${item.data.id}`} className="p-4 hover:bg-muted/20 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10 shrink-0">
                                  <TrendingDown size={18} className="text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground">{item.data.description || item.data.category}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {household.members.find(m => m.user_id === item.data.paid_by)?.name} •
                                    {new Date(item.data.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-red-600 dark:text-red-400 tabular-nums">
                                    -{item.data.amount.toLocaleString('sv-SE')} kr
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div key={`income-${item.data.id}`} className="p-4 hover:bg-muted/20 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 shrink-0">
                                  <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground">{item.data.note || 'Inkomst'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {household.members.find(m => m.user_id === item.data.recipient)?.name} •
                                    {new Date(item.data.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                                    +{(item.data.amount / 100).toLocaleString('sv-SE')} kr
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-muted p-3 mb-4">
                        <Calendar size={24} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Inga transaktioner ännu</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddModalOpen(true)}
                        className="gap-2"
                      >
                        <Plus size={14} />
                        Lägg till
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Transaktioner tab - Full chronological list */}
          <TabsContent value="transaktioner" className="mt-0">
            {combinedItems.length > 0 ? (
              <div className="space-y-4">
                {/* Settle shortcut */}
                {expenseSummary.oweAmount > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSettleModalOpen(true)}
                      className="text-xs hover:scale-105 transition-transform"
                    >
                      Settla denna månad
                    </Button>
                  </div>
                )}

                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {combinedItems.map((item, index) => (
                        item.type === 'expense' ? (
                          <ExpenseItem
                            key={`expense-${item.data.id}`}
                            expense={item.data}
                            members={household.members}
                            index={index}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
                            currentUserId={user?.id}
                          />
                        ) : (
                          <div key={`income-${item.data.id}`} className="p-4 sm:p-6">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">
                                  {item.data.note || 'Inkomst'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {household.members.find(m => m.user_id === item.data.recipient)?.name} •
                                  {new Date(item.data.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                                  +{(item.data.amount / 100).toLocaleString('sv-SE')} kr
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground mb-4">Inga transaktioner denna månad</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus size={14} />
                    Lägg till
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics tab */}
          <TabsContent value="analytics" className="mt-0">
            <div className="space-y-6">
              {incomes.length > 0 ? (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {incomes.map((income) => (
                        <div key={income.id} className="p-3 rounded-lg">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {income.note || 'Inkomst'}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {household.members.find(m => m.user_id === income.recipient)?.name} •
                                {new Date(income.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                                +{(income.amount / 100).toLocaleString('sv-SE')} kr
                              </p>
                            </div>
                          </div>
                        </div>
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
                    <p className="text-sm text-muted-foreground">Ingen data att visa ännu</p>
                  </CardContent>
                </Card>
              )}

              {/* Utveckling över tid - placeholder */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Utveckling över tid</h3>
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-muted-foreground">Diagram kommer snart</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </main>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
        groupId={primaryGroup.id}
        members={primaryGroup.members}
        defaultType="expense"
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExpenses}
        groupId={household.id}
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
        members={household.members}
      />

      {expenseSummary.negativeUser && expenseSummary.positiveUser && (
        <SettlementModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          onConfirm={handleSettle}
          fromUser={expenseSummary.negativeUser}
          toUser={expenseSummary.positiveUser}
          amount={expenseSummary.oweAmount}
        />
      )}
    </div>
  );
};

export default Index;
