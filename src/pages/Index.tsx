import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MonthSelector } from "@/components/MonthSelector";
import { AddFab } from "@/components/AddFab";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { ImportModal } from "@/components/ImportModal";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useIncomes, Income, IncomeInput } from "@/hooks/useIncomes";
import { useAuth } from "@/hooks/useAuth";
import { useMonthSelection } from "@/hooks/useMonthSelection";
import {
  TrendingDown,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowRight,
  Upload,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household, loading: householdLoading } = useGroups();
  const { selectedYear, selectedMonth } = useMonthSelection();

  const {
    expenses,
    loading: expensesLoading,
    addExpense,
    addExpenses,
  } = useExpenses(household?.id);

  const { incomes, loading: incomesLoading, addIncome } = useIncomes(household?.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loading = householdLoading || expensesLoading || incomesLoading;

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
      <div className="lg:pl-64">
        <main className="container max-w-6xl py-8 px-4 sm:px-6 pb-24 lg:pb-8">
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

  // No household state
  if (!household) {
    return (
      <div className="lg:pl-64">
        <main className="container max-w-6xl py-8 px-4 sm:px-6 pb-24 lg:pb-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-semibold text-foreground mb-4">Välkommen!</h1>
            <p className="text-muted-foreground mb-8">
              Ditt hushåll skapas automatiskt. Vänta ett ögonblick...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="lg:pl-64">
      <main className="container max-w-6xl py-6 px-4 sm:px-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-heading text-2xl mb-1">Hem</h1>
          <p className="text-caption">{household.name}</p>
        </div>

        {/* Month selector */}
        <div className="mb-6">
          <MonthSelector />
        </div>

        {/* Summary grid - 2 columns */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          {/* Left column: Summering */}
          <div className="space-y-3">
            <h2 className="text-subheading">
              Översikt
            </h2>

            <Card>
              <CardContent className="p-5 space-y-3">
                {/* Total in */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-green-500/10">
                      <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-caption font-medium">Total in</span>
                  </div>
                  <span className="text-lg font-semibold text-foreground tabular-nums">
                    {totals.totalIncomes.toLocaleString("sv-SE")} kr
                  </span>
                </div>

                {/* Total ut */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-red-500/10">
                      <TrendingDown size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-caption font-medium">Total ut</span>
                  </div>
                  <span className="text-lg font-semibold text-foreground tabular-nums">
                    {totals.totalExpenses.toLocaleString("sv-SE")} kr
                  </span>
                </div>

                <div className="pt-3 border-t border-border/60">
                  {/* Netto */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${totals.netto >= 0 ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                        <DollarSign size={18} className={totals.netto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} />
                      </div>
                      <span className="text-caption font-medium">Netto</span>
                    </div>
                    <span className={`text-xl font-bold tabular-nums ${totals.netto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {totals.netto >= 0 ? '+' : ''}{totals.netto.toLocaleString("sv-SE")} kr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Visual diagram */}
          <div className="space-y-3">
            <h2 className="text-subheading">
              Fördelning
            </h2>

            <Card>
              <CardContent className="p-5">
                {/* Circular/bar visualization */}
                <div className="space-y-5">
                  {/* Bar chart */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">Inkomster</span>
                        <span className="text-caption">
                          {visualPercentages.incomeWidth.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-7 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${visualPercentages.incomeWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-600 dark:text-red-400 font-medium">Utgifter</span>
                        <span className="text-caption">
                          {visualPercentages.expenseWidth.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-7 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-500"
                          style={{ width: `${visualPercentages.expenseWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-foreground tabular-nums">
                        {filteredExpenses.length}
                      </p>
                      <p className="text-caption">Utgifter</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground tabular-nums">
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

        {/* Latest activities */}
        <div className="mb-6">
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
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {latestActivities.map((item) => {
                    if (item.type === 'expense') {
                      const expense = item.data as Expense;
                      return (
                        <div key={`expense-${expense.id}`} className="p-3.5 notion-hover cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-red-500/10 shrink-0">
                              <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm">{expense.description || expense.category}</p>
                              <p className="text-caption">
                                {household.members.find(m => m.user_id === expense.paid_by)?.name} •{' '}
                                {new Date(expense.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600 dark:text-red-400 tabular-nums text-sm">
                                -{expense.amount.toLocaleString('sv-SE')} kr
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const income = item.data as Income;
                      return (
                        <div key={`income-${income.id}`} className="p-3.5 notion-hover cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-green-500/10 shrink-0">
                              <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm">{income.note || 'Inkomst'}</p>
                              <p className="text-caption">
                                {household.members.find(m => m.user_id === income.recipient)?.name} •{' '}
                                {new Date(income.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600 dark:text-green-400 tabular-nums text-sm">
                                +{(income.amount / 100).toLocaleString('sv-SE')} kr
                              </p>
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
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Calendar size={20} className="text-muted-foreground" />
                </div>
                <p className="text-caption">Inga aktiviteter denna månad</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add FAB */}
      <AddFab
        onClick={() => setIsAddModalOpen(true)}
        onImportClick={() => setIsImportModalOpen(true)}
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
        onImport={handleImportExpenses}
        groupId={household.id}
        currentUserId={user?.id || ""}
      />
    </div>
  );
};

export default Index;
