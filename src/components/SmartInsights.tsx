import { useMemo } from "react";
import { TrendingUp, TrendingDown, Target, Award } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface Income {
  id: string;
  amount: number;
  date: string;
}

interface SmartInsightsProps {
  currentExpenses: Expense[];
  currentIncomes: Income[];
  allExpenses: Expense[];
  allIncomes: Income[];
  currentYear: number;
  currentMonth: number;
  netto: number;
}

interface Insight {
  type: "trend" | "savings" | "category" | "achievement";
  message: string;
  icon: React.ReactNode;
  variant: "default" | "success" | "neutral";
}

export const SmartInsights = ({
  currentExpenses,
  currentIncomes,
  allExpenses,
  allIncomes,
  currentYear,
  currentMonth,
  netto,
}: SmartInsightsProps) => {
  const insights = useMemo(() => {
    const results: Insight[] = [];

    // Calculate previous month totals for comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const prevExpenses = allExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getFullYear() === prevYear &&
        expenseDate.getMonth() + 1 === prevMonth
      );
    });

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 1. Month-over-month trend
    if (prevTotal > 0) {
      const percentChange = ((currentTotal - prevTotal) / prevTotal) * 100;
      if (Math.abs(percentChange) >= 5) {
        const isIncrease = percentChange > 0;
        results.push({
          type: "trend",
          message: `${isIncrease ? "↑" : "↓"} ${Math.abs(percentChange).toFixed(0)}% ${isIncrease ? "mer" : "mindre"} utgifter än förra månaden`,
          icon: isIncrease ? (
            <TrendingUp size={16} className="text-muted-foreground" />
          ) : (
            <TrendingDown size={16} className="text-muted-foreground" />
          ),
          variant: isIncrease ? "default" : "success",
        });
      }
    }

    // 2. Savings insight
    if (netto > 0) {
      results.push({
        type: "savings",
        message: `Du har sparat ${netto.toLocaleString("sv-SE")} kr denna månad`,
        icon: <Target size={16} className="text-muted-foreground" />,
        variant: "success",
      });
    }

    // 3. Top spending category
    if (currentExpenses.length > 0) {
      const categoryTotals = currentExpenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      const topCategory = Object.entries(categoryTotals).sort(
        ([, a], [, b]) => b - a
      )[0];

      if (topCategory) {
        const [category, amount] = topCategory;
        const percentage = ((amount / currentTotal) * 100).toFixed(0);
        results.push({
          type: "category",
          message: `Mest utgifter: ${category} (${percentage}%)`,
          icon: <Award size={16} className="text-muted-foreground" />,
          variant: "neutral",
        });
      }
    }

    return results;
  }, [
    currentExpenses,
    currentIncomes,
    allExpenses,
    allIncomes,
    currentYear,
    currentMonth,
    netto,
  ]);

  if (insights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 animate-fade-in" style={{ animationDelay: "50ms" }}>
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm
            ${
              insight.variant === "success"
                ? "bg-income-bg/30 text-foreground"
                : insight.variant === "neutral"
                ? "bg-muted text-foreground"
                : "bg-muted text-foreground"
            }
            transition-base hover:scale-[1.02]
          `}
        >
          {insight.icon}
          <span className="text-caption font-medium">{insight.message}</span>
        </div>
      ))}
    </div>
  );
};
