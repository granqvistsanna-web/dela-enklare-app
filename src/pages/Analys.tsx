import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncomes";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimePeriod = "month" | "quarter" | "year";
type QuickSelect = "30days" | "3months" | "6months" | "1year" | "custom";

const MONTHS = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December"
];

export default function Analys() {
  const { household, loading: householdLoading } = useGroups();
  const { expenses, loading: expensesLoading } = useExpenses(household?.id);
  const { incomes, loading: incomesLoading } = useIncomes(household?.id);

  const currentDate = new Date();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [quickSelect, setQuickSelect] = useState<QuickSelect>("30days");
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loading = householdLoading || expensesLoading || incomesLoading;

  // Calculate date range based on quick select
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (quickSelect) {
      case "30days":
        start.setDate(now.getDate() - 30);
        break;
      case "3months":
        start.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        start.setMonth(now.getMonth() - 6);
        break;
      case "1year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      case "custom":
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
        }
        break;
    }

    return { start, end };
  }, [quickSelect, startDate, endDate]);

  // Filter data by selected time period and month
  const filteredData = useMemo(() => {
    let filteredExpenses = expenses;
    let filteredIncomes = incomes;

    if (timePeriod === "month") {
      filteredExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
      });
      filteredIncomes = incomes.filter(i => {
        const date = new Date(i.date);
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
      });
    } else {
      filteredExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date >= dateRange.start && date <= dateRange.end;
      });
      filteredIncomes = incomes.filter(i => {
        const date = new Date(i.date);
        return date >= dateRange.start && date <= dateRange.end;
      });
    }

    return { filteredExpenses, filteredIncomes };
  }, [expenses, incomes, timePeriod, selectedYear, selectedMonth, dateRange]);

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

  // Group by month for chart
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { expenses: number; incomes: number }>();

    filteredData.filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthMap.get(key) || { expenses: 0, incomes: 0 };
      monthMap.set(key, { ...current, expenses: current.expenses + expense.amount });
    });

    filteredData.filteredIncomes.forEach(income => {
      const date = new Date(income.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthMap.get(key) || { expenses: 0, incomes: 0 };
      monthMap.set(key, { ...current, incomes: current.incomes + income.amount / 100 });
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, ...data }));
  }, [filteredData]);

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentDate.getFullYear() - i);

  if (loading) {
    return (
      <div className="lg:pl-64">
        <main className="container max-w-6xl py-8 px-4 sm:px-6 pb-24 lg:pb-8">
          <div className="h-8 w-48 rounded bg-secondary animate-pulse mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded bg-secondary animate-pulse" />
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

  return (
    <div className="lg:pl-64">
      <main className="container max-w-6xl py-8 px-4 sm:px-6 pb-24 lg:pb-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Analys</h1>

        {/* Time filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Tidsfilter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Period selector */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={timePeriod === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("month")}
              >
                Månad
              </Button>
              <Button
                variant={timePeriod === "quarter" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("quarter")}
              >
                Kvartal
              </Button>
              <Button
                variant={timePeriod === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod("year")}
              >
                År
              </Button>
            </div>

            {/* Month selector (shown when period is "month") */}
            {timePeriod === "month" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Månad</label>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger>
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
                  <label className="text-sm text-muted-foreground">År</label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger>
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
            )}

            {/* Quick select options */}
            {timePeriod !== "month" && (
              <div>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Button
                    variant={quickSelect === "30days" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickSelect("30days")}
                  >
                    Senaste 30 dagarna
                  </Button>
                  <Button
                    variant={quickSelect === "3months" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickSelect("3months")}
                  >
                    3 månader
                  </Button>
                  <Button
                    variant={quickSelect === "6months" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickSelect("6months")}
                  >
                    6 månader
                  </Button>
                  <Button
                    variant={quickSelect === "1year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickSelect("1year")}
                  >
                    1 år
                  </Button>
                  <Button
                    variant={quickSelect === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickSelect("custom")}
                  >
                    Anpassat
                  </Button>
                </div>

                {quickSelect === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Från datum</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Till datum</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total in</p>
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {totals.totalIncomes.toLocaleString("sv-SE")} kr
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total ut</p>
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {totals.totalExpenses.toLocaleString("sv-SE")} kr
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${totals.netto >= 0 ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                  <DollarSign size={20} className={totals.netto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Netto</p>
              </div>
              <p className={`text-3xl font-bold tabular-nums ${totals.netto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {totals.netto >= 0 ? '+' : ''}{totals.netto.toLocaleString("sv-SE")} kr
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly chart visualization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Utveckling över tid</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <div className="space-y-4">
                {monthlyData.map((item) => {
                  const maxValue = Math.max(item.expenses, item.incomes);
                  const expenseWidth = maxValue > 0 ? (item.expenses / maxValue) * 100 : 0;
                  const incomeWidth = maxValue > 0 ? (item.incomes / maxValue) * 100 : 0;

                  return (
                    <div key={item.month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {MONTHS[parseInt(item.month.split('-')[1]) - 1]} {item.month.split('-')[0]}
                        </span>
                        <div className="flex gap-4 text-xs">
                          <span className="text-green-600 dark:text-green-400">
                            In: {item.incomes.toLocaleString("sv-SE")} kr
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            Ut: {item.expenses.toLocaleString("sv-SE")} kr
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${incomeWidth}%` }}
                          />
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{ width: `${expenseWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar size={48} className="text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Ingen data för vald period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Utgifter per kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <div className="space-y-4">
                {expensesByCategory.map((item) => {
                  const percentage = totals.totalExpenses > 0
                    ? (item.amount / totals.totalExpenses) * 100
                    : 0;

                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{item.category}</span>
                        <span className="text-muted-foreground">
                          {item.amount.toLocaleString("sv-SE")} kr ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingDown size={48} className="text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Inga utgifter för vald period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
