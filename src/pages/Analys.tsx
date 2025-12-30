import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncomes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December"
];

export default function Analys() {
  const { household, loading: householdLoading } = useGroups();
  const { expenses, loading: expensesLoading } = useExpenses(household?.id);
  const { incomes, loading: incomesLoading } = useIncomes(household?.id);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const loading = householdLoading || expensesLoading || incomesLoading;

  // Filter data by selected month
  const filteredData = useMemo(() => {
    const filteredExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
    });
    const filteredIncomes = incomes.filter(i => {
      const date = new Date(i.date);
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
    });

    return { filteredExpenses, filteredIncomes };
  }, [expenses, incomes, selectedYear, selectedMonth]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalExpenses = filteredData.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomes = filteredData.filteredIncomes.reduce((sum, i) => sum + i.amount / 100, 0);
    const netto = totalIncomes - totalExpenses;

    return { totalExpenses, totalIncomes, netto };
  }, [filteredData]);

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    filteredData.filteredExpenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredData.filteredExpenses]);

  // Group by month for trend (last 6 months including current)
  const monthlyTrend = useMemo(() => {
    // First, group all data in a single pass
    const groups = new Map<string, { expenses: number; incomes: number }>();

    // Single pass through expenses
    expenses.forEach(e => {
      const expDate = new Date(e.date);
      const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = groups.get(monthKey) || { expenses: 0, incomes: 0 };
      existing.expenses += e.amount;
      groups.set(monthKey, existing);
    });

    // Single pass through incomes
    incomes.forEach(i => {
      const incDate = new Date(i.date);
      const monthKey = `${incDate.getFullYear()}-${String(incDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = groups.get(monthKey) || { expenses: 0, incomes: 0 };
      existing.incomes += i.amount / 100;
      groups.set(monthKey, existing);
    });

    // Extract last 6 months
    const months: Array<{ month: string; expenses: number; incomes: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(selectedYear, selectedMonth - 1 - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const data = groups.get(monthKey) || { expenses: 0, incomes: 0 };
      months.push({
        month: monthKey,
        expenses: data.expenses,
        incomes: data.incomes
      });
    }

    return months;
  }, [expenses, incomes, selectedYear, selectedMonth]);

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentDate.getFullYear() - i);

  if (loading) {
    return (
      <div className="lg:pl-64">
        <main className="container max-w-6xl py-8 px-4 sm:px-6 pb-24 lg:pb-8">
          <div className="h-8 w-48 rounded bg-gray-100 animate-pulse mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded bg-gray-100 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="lg:pl-64">
        <main className="container max-w-6xl py-8 px-4 sm:px-6 pb-24 lg:pb-8">
          <p className="text-muted-foreground">Inget hushåll hittades.</p>
        </main>
      </div>
    );
  }

  const maxTrendValue = Math.max(
    ...monthlyTrend.map(m => Math.max(m.expenses, m.incomes)),
    1
  );

  return (
    <div className="lg:pl-64">
      <main className="container max-w-6xl py-8 px-4 sm:px-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Analys</h1>
          <p className="text-sm text-muted-foreground mt-1">Ekonomisk översikt och utveckling</p>
        </div>

        {/* Time Filter - Persistent Month Selection */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Månad
                </label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(Number(v))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  År
                </label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(Number(v))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Income */}
          <Card>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Inkomster
                </p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">
                  {totals.totalIncomes.toLocaleString("sv-SE")} kr
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Utgifter
                </p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">
                  {totals.totalExpenses.toLocaleString("sv-SE")} kr
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Balance */}
          <Card>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Netto
                </p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">
                  {totals.netto >= 0 ? '+' : ''}{totals.netto.toLocaleString("sv-SE")} kr
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Visualization - 6 Month View */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Utveckling</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Senaste 6 månaderna</p>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {monthlyTrend.some(m => m.expenses > 0 || m.incomes > 0) ? (
              <div className="space-y-6">
                {monthlyTrend.map((item) => {
                  const expenseHeight = maxTrendValue > 0 ? (item.expenses / maxTrendValue) * 100 : 0;
                  const incomeHeight = maxTrendValue > 0 ? (item.incomes / maxTrendValue) * 100 : 0;
                  const isCurrentMonth = item.month === `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

                  return (
                    <div key={item.month} className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className={`text-xs font-medium ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {MONTHS[parseInt(item.month.split('-')[1]) - 1]} {item.month.split('-')[0]}
                        </span>
                        <div className="flex gap-4 text-xs tabular-nums">
                          <span className="text-muted-foreground">
                            In: {item.incomes.toLocaleString("sv-SE")}
                          </span>
                          <span className="text-muted-foreground">
                            Ut: {item.expenses.toLocaleString("sv-SE")}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 h-2">
                        <div className="flex-1 bg-gray-100 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-gray-600 transition-all duration-300"
                            style={{ width: `${incomeHeight}%` }}
                          />
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-gray-400 transition-all duration-300"
                            style={{ width: `${expenseHeight}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Ingen data tillgänglig</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Utgifter per kategori</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {expensesByCategory.length > 0 ? (
              <div className="space-y-4">
                {expensesByCategory.map((item) => {
                  const percentage = totals.totalExpenses > 0
                    ? (item.amount / totals.totalExpenses) * 100
                    : 0;

                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {item.category}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {item.amount.toLocaleString("sv-SE")} kr · {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-700 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Inga utgifter för vald period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
