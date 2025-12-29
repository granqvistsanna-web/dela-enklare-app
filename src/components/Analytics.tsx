import { useMemo } from "react";
import { Expense } from "@/hooks/useExpenses";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, BarChartData } from "@/components/charts/BarChart";
import { DonutChart, DonutChartData } from "@/components/charts/DonutChart";
import {
  calculateCategoryBreakdown,
  calculateMonthlyTrends,
  calculateSpendingInsights,
  getCurrentMonthComparison,
} from "@/lib/analyticsUtils";
import { TrendingUp, TrendingDown, Minus, Calendar, PieChart, Award } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/lib/types";

interface AnalyticsProps {
  expenses: Expense[];
}

export function Analytics({ expenses }: AnalyticsProps) {
  const insights = useMemo(() => calculateSpendingInsights(expenses), [expenses]);
  const categoryBreakdown = useMemo(() => calculateCategoryBreakdown(expenses), [expenses]);
  const monthlyTrends = useMemo(() => calculateMonthlyTrends(expenses, 6), [expenses]);
  const monthComparison = useMemo(() => getCurrentMonthComparison(expenses), [expenses]);

  // Prepare data for charts
  const barChartData: BarChartData[] = monthlyTrends.map((month) => ({
    label: month.monthLabel.split(" ")[0], // Just month name
    value: month.total,
  }));

  const donutChartData: DonutChartData[] = categoryBreakdown.slice(0, 5).map((cat) => {
    const category = DEFAULT_CATEGORIES.find((c) => c.id === cat.categoryId);
    return {
      label: cat.categoryName,
      value: cat.total,
      color: category?.color || "bg-gray-500",
      icon: cat.icon,
    };
  });

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <PieChart size={32} className="text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground mb-2">Ingen data att visa</p>
        <p className="text-sm text-muted-foreground">
          Lägg till utgifter för att se analys
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Spending */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground">Total utgifter</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {insights.totalSpending.toLocaleString("sv-SE")} kr
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} utgifter
            </p>
          </CardContent>
        </Card>

        {/* Average Expense */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Minus size={16} className="text-blue-500" />
              <p className="text-xs text-muted-foreground">Genomsnitt</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {Math.round(insights.averageExpense).toLocaleString("sv-SE")} kr
            </p>
            <p className="text-xs text-muted-foreground mt-1">per utgift</p>
          </CardContent>
        </Card>

        {/* Monthly Average */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-purple-500" />
              <p className="text-xs text-muted-foreground">Månadsnitt</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {Math.round(insights.monthlyAverage).toLocaleString("sv-SE")} kr
            </p>
            <p className="text-xs text-muted-foreground mt-1">senaste 3 mån</p>
          </CardContent>
        </Card>

        {/* Month Comparison */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {monthComparison.trend === "up" && (
                <TrendingUp size={16} className="text-orange-500" />
              )}
              {monthComparison.trend === "down" && (
                <TrendingDown size={16} className="text-green-500" />
              )}
              {monthComparison.trend === "same" && (
                <Minus size={16} className="text-muted-foreground" />
              )}
              <p className="text-xs text-muted-foreground">Denna månad</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {Math.round(monthComparison.currentMonth).toLocaleString("sv-SE")} kr
            </p>
            <p
              className={`text-xs mt-1 ${
                monthComparison.trend === "up"
                  ? "text-orange-500"
                  : monthComparison.trend === "down"
                  ? "text-green-500"
                  : "text-muted-foreground"
              }`}
            >
              {monthComparison.trend === "same"
                ? "Oförändrat"
                : `${monthComparison.percentageChange > 0 ? "+" : ""}${Math.round(
                    monthComparison.percentageChange
                  )}% vs förra mån`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Månadsutveckling
          </h3>
          <BarChart data={barChartData} height={240} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Utgifter per kategori
            </h3>
            <DonutChart
              data={donutChartData}
              size={180}
              centerValue={`${insights.categoriesCount}`}
              centerLabel="kategorier"
            />
          </CardContent>
        </Card>

        {/* Top Categories List */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Topp kategorier
            </h3>
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 5).map((cat, index) => {
                const category = DEFAULT_CATEGORIES.find((c) => c.id === cat.categoryId);
                return (
                  <div key={cat.categoryId} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                      <span className="text-lg">{cat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {cat.categoryName}
                        </span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          {cat.total.toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${category?.color || "bg-primary"}`}
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.count} utgifter
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.topExpense && insights.mostExpensiveCategory && (
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award size={18} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Insikter</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="text-2xl">{insights.mostExpensiveCategory.icon}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Mest spenderat på
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    {insights.mostExpensiveCategory.categoryName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insights.mostExpensiveCategory.total.toLocaleString("sv-SE")} kr (
                    {insights.mostExpensiveCategory.percentage.toFixed(1)}%)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="text-2xl">🏆</div>
                <div>
                  <p className="text-sm font-medium text-foreground">Största utgiften</p>
                  <p className="text-lg font-semibold text-primary truncate">
                    {insights.topExpense.description || "Utgift"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insights.topExpense.amount.toLocaleString("sv-SE")} kr
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
