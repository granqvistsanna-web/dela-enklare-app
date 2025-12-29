import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MonthSelector } from "@/components/MonthSelector";
import { AddFab } from "@/components/AddFab";
import { Card, CardContent } from "@/components/ui/card";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
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
  } = useExpenses(household?.id);

  const { incomes, loading: incomesLoading, addIncome } = useIncomes(household?.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      <main className="container max-w-6xl py-8 px-4 sm:px-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Hem</h1>
          <p className="text-muted-foreground">{household.name}</p>
        </div>

        {/* Month selector */}
        <div className="mb-8">
          <MonthSelector />
        </div>

        {/* Summary grid - 2 columns */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Left column: Summering */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Översikt
            </h2>

            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Total in */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Total in</span>
                  </div>
                  <span className="text-xl font-bold text-foreground tabular-nums">
                    {totals.totalIncomes.toLocaleString("sv-SE")} kr
                  </span>
                </div>

                {/* Total ut */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Total ut</span>
                  </div>
                  <span className="text-xl font-bold text-foreground tabular-nums">
                    {totals.totalExpenses.toLocaleString("sv-SE")} kr
                  </span>
                </div>

                <div className="pt-4 border-t border-border">
                  {/* Netto */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${totals.netto >= 0 ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                        <DollarSign size={20} className={totals.netto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} />
                      </div>
                      <span className="text-sm text-muted-foreground">Netto</span>
                    </div>
                    <span className={`text-2xl font-bold tabular-nums ${totals.netto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {totals.netto >= 0 ? '+' : ''}{totals.netto.toLocaleString("sv-SE")} kr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Visual diagram */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Fördelning
            </h2>

            <Card>
              <CardContent className="p-6">
                {/* Circular/bar visualization */}
                <div className="space-y-6">
                  {/* Bar chart */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">Inkomster</span>
                        <span className="text-muted-foreground">
                          {visualPercentages.incomeWidth.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${visualPercentages.incomeWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-600 dark:text-red-400 font-medium">Utgifter</span>
                        <span className="text-muted-foreground">
                          {visualPercentages.expenseWidth.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-500"
                          style={{ width: `${visualPercentages.expenseWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-border grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {filteredExpenses.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Utgifter</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {filteredIncomes.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Inkomster</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Latest activities */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Senaste aktiviteter
            </h2>
            <button
              onClick={() => navigate("/aktivitet")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Se alla
              <ArrowRight size={14} />
            </button>
          </div>

          {latestActivities.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {latestActivities.map((item) => (
                    item.type === 'expense' ? (
                      <div key={`expense-${item.data.id}`} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500/10 shrink-0">
                            <TrendingDown size={18} className="text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{item.data.description || item.data.category}</p>
                            <p className="text-sm text-muted-foreground">
                              {household.members.find(m => m.user_id === item.data.paid_by)?.name} •{' '}
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
                              {household.members.find(m => m.user_id === item.data.recipient)?.name} •{' '}
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
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Calendar size={24} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Inga aktiviteter denna månad</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add FAB */}
      <AddFab onClick={() => setIsAddModalOpen(true)} />

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
    </div>
  );
};

export default Index;
