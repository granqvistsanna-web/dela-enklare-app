import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddFab } from "@/components/AddFab";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useIncomes, Income, IncomeInput } from "@/hooks/useIncomes";
import { ExpenseItem } from "@/components/ExpenseItem";
import { IncomeItem } from "@/components/IncomeItem";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { EditIncomeModal } from "@/components/EditIncomeModal";
import { useAuth } from "@/hooks/useAuth";
import { Search, ArrowUpDown, Plus, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "date" | "amount" | "category";
type SortDirection = "asc" | "desc";

const MONTHS = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December"
];

export default function Aktivitet() {
  const { user } = useAuth();
  const { household, loading: householdLoading } = useGroups();
  const { expenses, loading: expensesLoading, updateExpense, deleteExpense, addExpense } = useExpenses(household?.id);
  const { incomes, loading: incomesLoading, updateIncome, deleteIncome, addIncome } = useIncomes(household?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [isEditIncomeModalOpen, setIsEditIncomeModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const loading = householdLoading || expensesLoading || incomesLoading;

  // Combine expenses and incomes
  const combinedItems = useMemo(() => {
    const items: Array<{
      type: 'expense' | 'income';
      data: Expense | Income;
      date: Date;
      amount: number;
      description: string;
      category?: string;
    }> = [];

    expenses.forEach(expense => {
      items.push({
        type: 'expense',
        data: expense,
        date: new Date(expense.date),
        amount: expense.amount,
        description: expense.description || expense.category,
        category: expense.category,
      });
    });

    incomes.forEach(income => {
      items.push({
        type: 'income',
        data: income,
        date: new Date(income.date),
        amount: income.amount / 100,
        description: income.note || 'Inkomst',
      });
    });

    return items;
  }, [expenses, incomes]);

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return combinedItems;

    const query = searchQuery.toLowerCase();
    return combinedItems.filter(item => {
      const description = item.description.toLowerCase();
      const category = item.category?.toLowerCase() || '';
      const amount = item.amount.toString();

      return description.includes(query) || category.includes(query) || amount.includes(query);
    });
  }, [combinedItems, searchQuery]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredItems, sortBy, sortDirection]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups = new Map<string, typeof sortedItems>();

    // Efficiently group items by pushing to arrays
    sortedItems.forEach(item => {
      const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(item);
    });

    // Sort month keys in descending order (newest first)
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

    return sortedKeys.map(key => ({
      monthKey: key,
      items: groups.get(key) || [],
    }));
  }, [sortedItems]);

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditExpenseModalOpen(true);
  };

  const handleSaveExpense = async (updatedExpense: Expense) => {
    await updateExpense(updatedExpense.id, {
      amount: updatedExpense.amount,
      category: updatedExpense.category,
      description: updatedExpense.description,
      date: updatedExpense.date,
    });
    setIsEditExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsEditIncomeModalOpen(true);
  };

  const handleSaveIncome = async (updatedIncome: Income) => {
    await updateIncome(updatedIncome.id, {
      amount: updatedIncome.amount,
      recipient: updatedIncome.recipient,
      type: updatedIncome.type,
      note: updatedIncome.note,
      date: updatedIncome.date,
      repeat: updatedIncome.repeat,
      included_in_split: updatedIncome.included_in_split,
    });
    setIsEditIncomeModalOpen(false);
    setEditingIncome(null);
  };

  const handleDeleteIncome = async (incomeId: string) => {
    await deleteIncome(incomeId);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

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

  if (loading) {
    return (
      <div className="lg:pl-64">
        <main className="container max-w-6xl py-6 px-4 sm:px-6 pb-24 lg:pb-8">
          <div className="h-8 w-32 rounded-md skeleton-shimmer mb-6" />
          <div className="h-24 rounded-lg skeleton-shimmer mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-6 w-32 rounded-md skeleton-shimmer mb-3" />
                <div className="h-32 rounded-lg skeleton-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="lg:pl-64">
        <main className="container max-w-6xl py-6 px-4 sm:px-6 pb-24 lg:pb-8">
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText size={28} className="text-muted-foreground" />
            </div>
            <p className="text-caption">Inget hushåll hittades.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="lg:pl-64">
      <main className="container max-w-6xl py-6 px-4 sm:px-6 pb-24 lg:pb-8">
        <h1 className="text-heading text-2xl mb-6 animate-fade-in">Aktivitet</h1>

        {/* Search and filters */}
        <Card className="mb-6 shadow-notion animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Sök aktivitet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sort options */}
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Datum</SelectItem>
                    <SelectItem value="amount">Summa</SelectItem>
                    <SelectItem value="category">Kategori</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={toggleSortDirection} className="h-9 w-9 shrink-0">
                  <ArrowUpDown size={16} />
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-3 text-caption">
              {filteredItems.length} {filteredItems.length === 1 ? 'aktivitet' : 'aktiviteter'}
              {searchQuery && ` hittades för "${searchQuery}"`}
            </div>
          </CardContent>
        </Card>

        {/* Activity list grouped by month */}
        {groupedByMonth.length > 0 ? (
          <div className="space-y-6">
            {groupedByMonth.map(({ monthKey, items }, groupIdx) => {
              const [year, month] = monthKey.split('-');
              const monthName = MONTHS[parseInt(month) - 1];
              const totalExpenses = items.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0);
              const totalIncomes = items.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);

              return (
                <div 
                  key={monthKey} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${100 + groupIdx * 50}ms` }}
                >
                  {/* Month header */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-heading text-base">
                        {monthName} {year}
                      </h2>
                      <div className="flex gap-3 text-sm font-medium">
                        <span className="text-income tabular-nums">
                          +{totalIncomes.toLocaleString("sv-SE")} kr
                        </span>
                        <span className="text-expense tabular-nums">
                          -{totalExpenses.toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                    </div>
                    <div className="h-px bg-border/60" />
                  </div>

                  {/* Items for this month */}
                  <Card className="shadow-notion">
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/40">
                        {items.map((item, index) => {
                          if (item.type === 'expense') {
                            const expense = item.data as Expense;
                            return (
                              <ExpenseItem
                                key={`expense-${expense.id}`}
                                expense={expense}
                                members={household.members}
                                index={index}
                                onEdit={handleEditExpense}
                                onDelete={handleDeleteExpense}
                                currentUserId={user?.id}
                              />
                            );
                          } else {
                            const income = item.data as Income;
                            return (
                              <IncomeItem
                                key={`income-${income.id}`}
                                income={income}
                                members={household.members}
                                onEdit={handleEditIncome}
                                onDelete={handleDeleteIncome}
                                currentUserId={user?.id}
                              />
                            );
                          }
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/20 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Plus size={24} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">Inga aktiviteter</p>
              <p className="text-caption text-center mb-4">
                {searchQuery ? 'Inga resultat matchade din sökning' : 'Börja genom att lägga till en utgift eller inkomst'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-sm font-medium text-primary hover:opacity-70 transition-opacity"
                >
                  Lägg till transaktion →
                </button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add FAB */}
      <AddFab onClick={() => setIsAddModalOpen(true)} />

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
        groupId={household.id}
        members={household.members}
        defaultType="expense"
      />

      <EditExpenseModal
        isOpen={isEditExpenseModalOpen}
        onClose={() => {
          setIsEditExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        expense={editingExpense}
        members={household.members}
      />

      <EditIncomeModal
        isOpen={isEditIncomeModalOpen}
        onClose={() => {
          setIsEditIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        onDelete={handleDeleteIncome}
        income={editingIncome}
        members={household.members}
      />
    </div>
  );
}