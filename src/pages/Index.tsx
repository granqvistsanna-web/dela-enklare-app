import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MonthSelector } from "@/components/MonthSelector";
import { AddFab } from "@/components/AddFab";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { EditIncomeModal } from "@/components/EditIncomeModal";
import { ImportModal } from "@/components/ImportModal";
import { SwishModal } from "@/components/SwishModal";
import { BalanceCard } from "@/components/BalanceCard";
import { MemberSummaryCard } from "@/components/MemberSummaryCard";
import { useGroups } from "@/hooks/useGroups";
import { GroupSelector } from "@/components/GroupSelector";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useIncomes, Income, IncomeInput } from "@/hooks/useIncomes";
import { useSettlements } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { useMonthSelection } from "@/hooks/useMonthSelection";
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  ArrowRight,
  Home,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household, allGroups, loading: householdLoading, selectGroup } = useGroups();
  const { selectedYear, selectedMonth } = useMonthSelection();

  const {
    expenses,
    loading: expensesLoading,
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
  } = useExpenses(household?.id);

  const {
    incomes,
    loading: incomesLoading,
    addIncome,
    updateIncome,
    deleteIncome,
  } = useIncomes(household?.id);

  const {
    settlements,
    loading: settlementsLoading,
    addSettlement,
  } = useSettlements(household?.id);

  const [isSettling, setIsSettling] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSwishModalOpen, setIsSwishModalOpen] = useState(false);

  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [isEditIncomeModalOpen, setIsEditIncomeModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const loading = householdLoading || expensesLoading || incomesLoading || settlementsLoading;

  // Filter expenses and incomes by selected month
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === selectedYear &&
             expenseDate.getMonth() + 1 === selectedMonth;
    });
  }, [expenses, selectedYear, selectedMonth]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getFullYear() === selectedYear &&
             incomeDate.getMonth() + 1 === selectedMonth;
    });
  }, [incomes, selectedYear, selectedMonth]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomes = filteredIncomes.reduce((sum, i) => sum + i.amount / 100, 0);
    const netto = totalIncomes - totalExpenses;

    return { totalExpenses, totalIncomes, netto };
  }, [filteredExpenses, filteredIncomes]);

  // Combine and sort latest activities
  const latestActivities = useMemo(() => {
    const items: Array<{ type: 'expense' | 'income'; data: Expense | Income; date: string }> = [];

    filteredExpenses.forEach(expense => {
      items.push({ type: 'expense', data: expense, date: expense.date });
    });

    filteredIncomes.forEach(income => {
      items.push({ type: 'income', data: income, date: income.date });
    });

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [filteredExpenses, filteredIncomes]);

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

  const handleAddIncome = useCallback(async (newIncome: IncomeInput) => {
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

  // Handle settlement
  const handleSettle = useCallback(async (fromUser: string, toUser: string, amount: number, date?: string) => {
    if (!household?.id) return;
    setIsSettling(true);
    try {
      await addSettlement({
        group_id: household.id,
        from_user: fromUser,
        to_user: toUser,
        amount,
        date,
      });
    } finally {
      setIsSettling(false);
    }
  }, [household?.id, addSettlement]);

  // Calculate percentages for visual bar
  const visualPercentages = useMemo(() => {
    const total = totals.totalIncomes + totals.totalExpenses;
    if (total === 0) return { incomeWidth: 50, expenseWidth: 50 };

    const incomeWidth = (totals.totalIncomes / total) * 100;
    const expenseWidth = (totals.totalExpenses / total) * 100;

    return { incomeWidth, expenseWidth };
  }, [totals]);

  // Loading state
  if (loading) {
    return (
      <div className="pt-14 lg:pt-0 lg:pl-64">
        <main className="container max-w-6xl py-6 px-4 sm:px-6 pb-6 lg:pb-8">
          <div className="mb-6">
            <div className="h-8 w-32 rounded-md skeleton-shimmer mb-2" />
            <div className="h-4 w-48 rounded-md skeleton-shimmer" />
          </div>
          <div className="h-12 w-full rounded-md skeleton-shimmer mb-6" />
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <div className="h-40 rounded-lg skeleton-shimmer" />
            <div className="h-40 rounded-lg skeleton-shimmer" />
          </div>
          <div className="h-32 rounded-lg skeleton-shimmer mb-6" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md skeleton-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // No household state
  if (!household) {
    return (
      <div className="pt-14 lg:pt-0 lg:pl-64">
        <main className="container max-w-6xl py-6 px-4 sm:px-6 pb-6 lg:pb-8">
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Home size={28} className="text-muted-foreground animate-pulse-soft" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Välkommen!</h1>
            <p className="text-caption text-center max-w-sm">
              Ditt hushåll skapas automatiskt. Vänta ett ögonblick...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pt-14 lg:pt-0 lg:pl-64">
      <main className="container max-w-6xl py-6 px-4 sm:px-6 pb-6 lg:pb-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-heading text-2xl mb-1">Hem</h1>
              <p className="text-caption">{household.name}</p>
            </div>
            <GroupSelector
              groups={allGroups}
              selectedGroupId={household.id}
              onSelectGroup={selectGroup}
            />
          </div>
        </div>

        {/* Month selector */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <MonthSelector />
        </div>

        {/* Summary grid - 2 columns */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          {/* Left column: Summering */}
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h2 className="text-subheading">
              Översikt
            </h2>

            <Card className="shadow-notion hover-lift">
              <CardContent className="p-5 space-y-3">
                {/* Total in */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-income-bg">
                      <ArrowDownLeft size={18} className="text-income" />
                    </div>
                    <span className="text-caption font-medium">Total in</span>
                  </div>
                  <span className="text-money-lg font-semibold text-foreground">
                    {totals.totalIncomes.toLocaleString("sv-SE")} kr
                  </span>
                </div>

                {/* Total ut */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-expense-bg">
                      <ArrowUpRight size={18} className="text-expense" />
                    </div>
                    <span className="text-caption font-medium">Total ut</span>
                  </div>
                  <span className="text-money-lg font-semibold text-foreground">
                    {totals.totalExpenses.toLocaleString("sv-SE")} kr
                  </span>
                </div>

                <div className="pt-3 border-t border-border/60">
                  {/* Netto */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${totals.netto >= 0 ? 'bg-income-bg' : 'bg-icon-pink-bg'}`}>
                        <DollarSign size={18} className={totals.netto >= 0 ? 'text-income' : 'text-icon-pink'} />
                      </div>
                      <span className="text-caption font-medium">Netto</span>
                    </div>
                    <span className={`text-money-xl font-bold ${totals.netto >= 0 ? 'text-income' : 'text-icon-pink'}`}>
                      {totals.netto >= 0 ? '+' : ''}{totals.netto.toLocaleString("sv-SE")} kr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Visual diagram */}
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <h2 className="text-subheading">
              Fördelning
            </h2>

            <Card className="shadow-notion hover-lift">
              <CardContent className="p-5">
                {/* Circular/bar visualization */}
                <div className="space-y-5">
                  {/* Bar chart */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-income font-medium">Inkomster</span>
                        <span className="text-caption">
                          {visualPercentages.incomeWidth.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-7 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-income transition-all duration-500"
                          style={{ width: `${visualPercentages.incomeWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-expense font-medium">Utgifter</span>
                        <span className="text-caption">
                          {visualPercentages.expenseWidth.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-7 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-expense transition-all duration-500"
                          style={{ width: `${visualPercentages.expenseWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-numeric text-xl font-bold text-foreground">
                        {filteredExpenses.length}
                      </p>
                      <p className="text-caption">Utgifter</p>
                    </div>
                    <div>
                      <p className="text-numeric text-xl font-bold text-foreground">
                        {filteredIncomes.length}
                      </p>
                      <p className="text-caption">Inkomster</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Member summary */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <MemberSummaryCard
            expenses={filteredExpenses}
            incomes={filteredIncomes}
            members={household.members}
          />
        </div>

        {/* Balance section */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <BalanceCard
            expenses={filteredExpenses}
            incomes={filteredIncomes}
            members={household.members}
            settlements={settlements}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSettle={handleSettle}
            isSettling={isSettling}
          />
        </div>

        {/* Latest activities */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-subheading">
              Senaste aktiviteter
            </h2>
            <button
              onClick={() => navigate("/aktivitet")}
              className="text-sm text-foreground hover:opacity-70 flex items-center gap-1 transition-opacity"
            >
              Se alla
              <ArrowRight size={14} />
            </button>
          </div>

          {latestActivities.length > 0 ? (
            <Card className="shadow-notion">
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                    {latestActivities.map((item, idx) => {
                      if (item.type === 'expense') {
                        const expense = item.data as Expense;
                        const canEdit = !!user?.id;

                        return (
                          <div
                            key={`expense-${expense.id}`}
                            className={`p-3.5 list-hover ${canEdit ? "cursor-pointer" : "cursor-default opacity-90"}`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => {
                              if (!canEdit) return;
                              setEditingExpense(expense);
                              setIsEditExpenseModalOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-expense-bg shrink-0">
                                <ArrowUpRight size={16} className="text-expense" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm">{expense.description || expense.category}</p>
                                <p className="text-caption">
                                  {household.members.find(m => m.user_id === expense.paid_by)?.name} •{' '}
                                  {new Date(expense.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <p className="font-semibold text-expense text-money-sm">
                                  -{expense.amount.toLocaleString('sv-SE')} kr
                                </p>
                                {canEdit && <span className="text-muted-foreground text-lg transition-transform group-hover:translate-x-0.5">›</span>}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        const income = item.data as Income;
                        const canEdit = !!user?.id;

                        return (
                          <div
                            key={`income-${income.id}`}
                            className={`p-3.5 list-hover ${canEdit ? "cursor-pointer" : "cursor-default opacity-90"}`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => {
                              if (!canEdit) return;
                              setEditingIncome(income);
                              setIsEditIncomeModalOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-income-bg shrink-0">
                                <ArrowDownLeft size={16} className="text-income" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm">{income.note || 'Inkomst'}</p>
                                <p className="text-caption">
                                  {household.members.find(m => m.user_id === income.recipient)?.name} •{' '}
                                  {new Date(income.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <p className="font-semibold text-income text-money-sm">
                                  +{(income.amount / 100).toLocaleString('sv-SE')} kr
                                </p>
                                {canEdit && <span className="text-muted-foreground text-lg transition-transform group-hover:translate-x-0.5">›</span>}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">Inga aktiviteter ännu</p>
                <p className="text-caption text-center mb-4">Lägg till din första utgift eller inkomst</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-sm font-medium text-primary hover:opacity-70 transition-opacity"
                >
                  Lägg till transaktion →
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add FAB */}
      <AddFab
        onClick={() => setIsAddModalOpen(true)}
        onImportClick={() => setIsImportModalOpen(true)}
        onSwishClick={() => setIsSwishModalOpen(true)}
      />

      {/* Add transaction modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
        groupId={household.id}
        members={household.members}
        defaultType="expense"
      />

      {/* Import modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportExpenses={handleImportExpenses}
        groupId={household.id}
        currentUserId={user?.id || ""}
      />

      {/* Swish modal */}
      <SwishModal
        isOpen={isSwishModalOpen}
        onClose={() => setIsSwishModalOpen(false)}
        onSubmit={handleSettle}
        members={household.members}
        currentUserId={user?.id || ""}
      />

      {/* Edit modals */}
      <EditExpenseModal
        isOpen={isEditExpenseModalOpen}
        onClose={() => {
          setIsEditExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={async (updatedExpense) => {
          await updateExpense(updatedExpense.id, {
            amount: updatedExpense.amount,
            category: updatedExpense.category,
            description: updatedExpense.description,
            date: updatedExpense.date,
            splits: updatedExpense.splits ?? null,
          });
          setIsEditExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onDelete={async (expenseId) => {
          await deleteExpense(expenseId);
          setIsEditExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
        members={household.members}
      />

      <EditIncomeModal
        isOpen={isEditIncomeModalOpen}
        onClose={() => {
          setIsEditIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={async (updatedIncome) => {
          await updateIncome(updatedIncome.id, {
            amount: updatedIncome.amount,
            type: updatedIncome.type,
            note: updatedIncome.note,
            date: updatedIncome.date,
            repeat: updatedIncome.repeat,
            included_in_split: updatedIncome.included_in_split,
            recipient: updatedIncome.recipient,
          });
          setIsEditIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onDelete={async (incomeId) => {
          await deleteIncome(incomeId);
          setIsEditIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        income={editingIncome}
        members={household.members}
      />
    </div>
  );
};

export default Index;
