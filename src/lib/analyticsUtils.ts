import { Expense } from "@/hooks/useExpenses";
import { DEFAULT_CATEGORIES } from "./types";
import { startOfMonth, endOfMonth, format, subMonths, isSameMonth } from "date-fns";

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlySpending {
  month: string;
  monthLabel: string;
  total: number;
  count: number;
  byCategory: Record<string, number>;
}

export interface SpendingInsights {
  totalSpending: number;
  averageExpense: number;
  mostExpensiveCategory: CategorySpending | null;
  topExpense: Expense | null;
  monthlyAverage: number;
  categoriesCount: number;
}

/**
 * Calculate spending breakdown by category
 */
export function calculateCategoryBreakdown(expenses: Expense[]): CategorySpending[] {
  const categoryTotals = new Map<string, { total: number; count: number }>();
  let grandTotal = 0;

  // Calculate totals per category
  expenses.forEach((expense) => {
    const amount = Number.isFinite(expense.amount) && expense.amount >= 0 ? expense.amount : 0;
    grandTotal += amount;

    const current = categoryTotals.get(expense.category) || { total: 0, count: 0 };
    categoryTotals.set(expense.category, {
      total: current.total + amount,
      count: current.count + 1,
    });
  });

  // Convert to array with percentages
  const breakdown: CategorySpending[] = Array.from(categoryTotals.entries()).map(
    ([categoryId, data]) => {
      const category = DEFAULT_CATEGORIES.find((c) => c.id === categoryId) || {
        id: categoryId,
        name: "Övrigt",
        icon: "📦",
        color: "bg-gray-500",
      };

      return {
        categoryId,
        categoryName: category.name,
        icon: category.icon,
        color: category.color,
        total: data.total,
        count: data.count,
        percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      };
    }
  );

  // Sort by total spending (highest first)
  return breakdown.sort((a, b) => b.total - a.total);
}

/**
 * Calculate monthly spending trends
 */
export function calculateMonthlyTrends(
  expenses: Expense[],
  monthsBack: number = 6
): MonthlySpending[] {
  const now = new Date();
  const months: MonthlySpending[] = [];

  // Generate last N months
  for (let i = monthsBack - 1; i >= 0; i--) {
    const targetDate = subMonths(now, i);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Filter expenses for this month
    const monthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    // Calculate totals
    const total = monthExpenses.reduce((sum, expense) => {
      const amount = Number.isFinite(expense.amount) && expense.amount >= 0 ? expense.amount : 0;
      return sum + amount;
    }, 0);

    // Calculate by category
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach((expense) => {
      const amount = Number.isFinite(expense.amount) && expense.amount >= 0 ? expense.amount : 0;
      byCategory[expense.category] = (byCategory[expense.category] || 0) + amount;
    });

    // Format Swedish month names manually
    const monthNames = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const monthIndex = targetDate.getMonth();
    const year = targetDate.getFullYear();

    months.push({
      month: format(targetDate, "yyyy-MM"),
      monthLabel: `${monthNames[monthIndex]} ${year}`,
      total,
      count: monthExpenses.length,
      byCategory,
    });
  }

  return months;
}

/**
 * Calculate spending insights and statistics
 */
export function calculateSpendingInsights(expenses: Expense[]): SpendingInsights {
  const validExpenses = expenses.filter(
    (e) => Number.isFinite(e.amount) && e.amount >= 0
  );

  const totalSpending = validExpenses.reduce((sum, e) => sum + e.amount, 0);
  const averageExpense = validExpenses.length > 0 ? totalSpending / validExpenses.length : 0;

  // Find most expensive category
  const categoryBreakdown = calculateCategoryBreakdown(validExpenses);
  const mostExpensiveCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Find top expense
  const topExpense = validExpenses.length > 0
    ? validExpenses.reduce((max, e) => (e.amount > max.amount ? e : max))
    : null;

  // Calculate monthly average (last 3 months)
  const threeMonthsAgo = subMonths(new Date(), 3);
  const recentExpenses = validExpenses.filter(
    (e) => new Date(e.date) >= threeMonthsAgo
  );
  const recentTotal = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyAverage = recentTotal / 3;

  // Count unique categories used
  const categoriesCount = new Set(validExpenses.map((e) => e.category)).size;

  return {
    totalSpending,
    averageExpense,
    mostExpensiveCategory,
    topExpense,
    monthlyAverage,
    categoriesCount,
  };
}

/**
 * Get current month spending compared to previous month
 */
export function getCurrentMonthComparison(expenses: Expense[]): {
  currentMonth: number;
  previousMonth: number;
  percentageChange: number;
  trend: "up" | "down" | "same";
} {
  const now = new Date();
  const lastMonth = subMonths(now, 1);

  const currentMonthTotal = expenses
    .filter((e) => isSameMonth(new Date(e.date), now))
    .reduce((sum, e) => {
      const amount = Number.isFinite(e.amount) && e.amount >= 0 ? e.amount : 0;
      return sum + amount;
    }, 0);

  const previousMonthTotal = expenses
    .filter((e) => isSameMonth(new Date(e.date), lastMonth))
    .reduce((sum, e) => {
      const amount = Number.isFinite(e.amount) && e.amount >= 0 ? e.amount : 0;
      return sum + amount;
    }, 0);

  const percentageChange =
    previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0;

  const trend =
    Math.abs(percentageChange) < 1
      ? "same"
      : currentMonthTotal > previousMonthTotal
      ? "up"
      : "down";

  return {
    currentMonth: currentMonthTotal,
    previousMonth: previousMonthTotal,
    percentageChange,
    trend,
  };
}
