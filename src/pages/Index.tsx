import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExpenseItem } from "@/components/ExpenseItem";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { SettlementModal } from "@/components/SettlementModal";
import { SettlementHistory } from "@/components/SettlementHistory";
import { ImportModal } from "@/components/ImportModal";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncomes";
import { useSettlements } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { calculateBalance } from "@/lib/balanceUtils";
import { calculateIncomeSettlement } from "@/lib/incomeUtils";
import { toast } from "sonner";
import {
  Plus,
  Upload,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  PiggyBank,
  Receipt,
  DollarSign,
  Loader2,
  Info,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();

  // Find the primary household economy group (first group or one named "Hushållsekonomi")
  const primaryGroup = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    return groups.find(g => g.name.toLowerCase().includes("hushåll")) || groups[0];
  }, [groups]);

  const {
    expenses,
    loading: expensesLoading,
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
  } = useExpenses(primaryGroup?.id);

  const { incomes, loading: incomesLoading } = useIncomes(primaryGroup?.id);
  const { settlements, loading: settlementsLoading, addSettlement } = useSettlements(primaryGroup?.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'expense' | 'income'>('expense');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loading = groupsLoading || expensesLoading || incomesLoading || settlementsLoading;

  // Get current month and year from selected date
  const currentYear = selectedDate.getFullYear();
  const currentMonthNum = selectedDate.getMonth() + 1; // 1-12
  const currentMonth = selectedDate.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });

  // Month navigation
  const goToPreviousMonth = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getMonth() === selectedDate.getMonth() &&
           now.getFullYear() === selectedDate.getFullYear();
  }, [selectedDate]);

  // Calculate expense balances
  const expenseBalances = useMemo(
    () => (primaryGroup ? calculateBalance(expenses, primaryGroup.members) : []),
    [expenses, primaryGroup]
  );

  // Calculate expense summary
  const expenseSummary = useMemo(() => {
    const posBalance = expenseBalances.find((b) => b.balance > 0);
    const negBalance = expenseBalances.find((b) => b.balance < 0);

    return {
      positiveBalance: posBalance,
      negativeBalance: negBalance,
      positiveUser: posBalance ? primaryGroup?.members.find((u) => u.user_id === posBalance.userId) : undefined,
      negativeUser: negBalance ? primaryGroup?.members.find((u) => u.user_id === negBalance.userId) : undefined,
      oweAmount: negBalance ? Math.abs(negBalance.balance) : 0,
      totalExpenses: expenses.reduce((sum, e) => {
        const amount = Number.isFinite(e.amount) ? e.amount : 0;
        return sum + amount;
      }, 0),
    };
  }, [expenseBalances, primaryGroup?.members, expenses]);

  // Calculate income settlement
  const incomeSettlement = useMemo(() => {
    if (!primaryGroup || primaryGroup.members.length < 2) {
      return null;
    }
    const [personA, personB] = primaryGroup.members;
    return calculateIncomeSettlement(
      incomes,
      personA.user_id,
      personB.user_id,
      currentYear,
      currentMonthNum
    );
  }, [incomes, primaryGroup, currentYear, currentMonthNum]);

  const handleAddExpense = useCallback(async (newExpense: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }) => {
    try {
      await addExpense(newExpense);
      toast.success("Utgift tillagd!");
    } catch (error) {
      toast.error("Kunde inte lägga till utgift. Försök igen.");
    }
  }, [addExpense]);

  const handleImportExpenses = useCallback(async (newExpenses: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }[]) => {
    try {
      await addExpenses(newExpenses);
      toast.success(`${newExpenses.length} utgifter importerade!`);
    } catch (error) {
      toast.error("Kunde inte importera utgifter. Försök igen.");
    }
  }, [addExpenses]);

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveExpense = useCallback(async (updatedExpense: Expense) => {
    try {
      await updateExpense(updatedExpense.id, {
        amount: updatedExpense.amount,
        category: updatedExpense.category,
        description: updatedExpense.description,
        date: updatedExpense.date,
      });
      setIsEditModalOpen(false);
      setEditingExpense(null);
      toast.success("Utgift uppdaterad!");
    } catch (error) {
      toast.error("Kunde inte uppdatera utgift. Försök igen.");
    }
  }, [updateExpense]);

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      toast.success("Utgift borttagen!");
    } catch (error) {
      toast.error("Kunde inte ta bort utgift. Försök igen.");
    }
  }, [deleteExpense]);

  const handleSettle = useCallback(async () => {
    if (!expenseSummary.negativeUser || !expenseSummary.positiveUser || !primaryGroup?.id) return;

    setIsSettling(true);
    const settlementData = {
      group_id: primaryGroup.id,
      from_user: expenseSummary.negativeUser.user_id,
      to_user: expenseSummary.positiveUser.user_id,
      amount: Math.round(expenseSummary.oweAmount),
    };

    try {
      await addSettlement(settlementData);
      setIsSettleModalOpen(false);

      // Success toast with undo action
      toast.success("Utjämning registrerad!", {
        description: `${expenseSummary.negativeUser.name} → ${expenseSummary.positiveUser.name}: ${Math.round(expenseSummary.oweAmount).toLocaleString("sv-SE")} kr`,
        duration: 5000,
        action: {
          label: "Ångra",
          onClick: async () => {
            // TODO: Implement undo functionality
            toast.info("Ångra-funktionen kommer snart");
          },
        },
      });
    } catch (error) {
      toast.error("Kunde inte registrera utjämning. Försök igen.");
    } finally {
      setIsSettling(false);
    }
  }, [expenseSummary.negativeUser, expenseSummary.positiveUser, primaryGroup?.id, addSettlement, expenseSummary.oweAmount]);

  // Combine expenses and incomes for "Denna månad" view
  const combinedItems = useMemo(() => {
    const items: Array<{ type: 'expense' | 'income'; data: Expense | any; date: string }> = [];

    expenses.forEach(expense => {
      items.push({ type: 'expense', data: expense, date: expense.date });
    });

    incomes.forEach(income => {
      items.push({ type: 'income', data: income, date: income.date });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes]);

  // Open add modal with specific type
  const openAddExpenseModal = useCallback(() => {
    setAddModalType('expense');
    setIsAddModalOpen(true);
  }, []);

  const openAddIncomeModal = useCallback(() => {
    setAddModalType('income');
    setIsAddModalOpen(true);
  }, []);

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
  if (!primaryGroup) {
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
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container max-w-4xl py-8 px-4 sm:px-6">
          {/* Month selector - Interactive with navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
                aria-label="Föregående månad"
              >
                <ChevronLeft size={16} />
              </Button>

              <div className="flex items-center gap-2 min-w-[180px] justify-center">
                <Calendar size={16} className="text-muted-foreground" />
                <span className="capitalize font-medium text-sm">{currentMonth}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
                aria-label="Nästa månad"
              >
                <ChevronRight size={16} />
              </Button>
            </div>

            {!isCurrentMonth && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
                className="text-xs"
              >
                Idag
              </Button>
            )}
          </div>

          {/* Group name - cleaner hierarchy */}
          <h1 className="text-3xl font-bold text-foreground mb-8">{primaryGroup.name}</h1>

          {/* Summary Section - Comprehensive household overview */}
          <div className="mb-8">
            <div className="grid gap-6 mb-6">
              {/* Expenses Summary Card */}
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-red-500/10">
                      <TrendingUp size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Utgifter</p>
                      <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                        {expenseSummary.totalExpenses.toLocaleString("sv-SE")} kr
                      </p>
                    </div>
                  </div>

                  {primaryGroup.members.length > 1 && (
                    <>
                      <div className="space-y-2 mb-4">
                        {expenseBalances.map((b) => {
                          const member = primaryGroup.members.find((u) => u.user_id === b.userId);
                          return (
                            <div key={b.userId} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{member?.name || "Okänd användare"} betalat</span>
                              <span className="font-semibold text-foreground tabular-nums">
                                {Math.abs(b.paid).toLocaleString("sv-SE")} kr
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Expense Settlement Result */}
                      <div className="pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Utjämning</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={14} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Hur mycket som behöver överföras för att ni ska vara kvitt</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {expenseSummary.oweAmount > 0 && expenseSummary.negativeUser && expenseSummary.positiveUser ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{expenseSummary.negativeUser.name}</span>
                            <ArrowRight size={16} className="text-orange-600 dark:text-orange-400" aria-label="betalar till" />
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
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-green-500/10">
                        <DollarSign size={20} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inkomster</p>
                        <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                          {(incomeSettlement.totalIncome / 100).toLocaleString("sv-SE")} kr
                        </p>
                      </div>
                    </div>

                    {primaryGroup.members.length > 1 && (
                      <>
                        <div className="space-y-2 mb-4">
                          {primaryGroup.members.map((member, idx) => {
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
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Utjämning</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info size={14} className="text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">50/50 delning av gemensamma inkomster</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          {incomeSettlement.transferAmount > 0 && incomeSettlement.transferFrom && incomeSettlement.transferTo ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {primaryGroup.members.find(m => m.user_id === incomeSettlement.transferFrom)?.name}
                              </span>
                              <ArrowRight size={16} className="text-blue-600 dark:text-blue-400" aria-label="betalar till" />
                              <span className="text-sm font-medium text-foreground">
                                {primaryGroup.members.find(m => m.user_id === incomeSettlement.transferTo)?.name}
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

              {/* Savings Placeholder */}
              <Card className="border-border/50 border-dashed opacity-60">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-muted">
                      <PiggyBank size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gemensamt sparande</p>
                      <p className="text-sm text-muted-foreground mt-1">Planerat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Primary Actions - Specific buttons */}
          <div className="flex gap-3 mb-8">
            <Button
              size="default"
              onClick={openAddExpenseModal}
              className="gap-2 flex-1 sm:flex-initial hover:scale-105 active:scale-95 transition-transform shadow-sm"
            >
              <Plus size={16} />
              Lägg till utgift
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={openAddIncomeModal}
              className="gap-2 flex-1 sm:flex-initial hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus size={16} />
              Lägg till inkomst
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsImportModalOpen(true)}
              className="gap-2 hover:scale-105 active:scale-95 transition-transform"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Importera</span>
            </Button>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="denna-manad" className="w-full">
            <TabsList className="h-11 w-full sm:w-auto mb-6 grid grid-cols-4">
              <TabsTrigger value="denna-manad" className="gap-2 text-sm">
                Översikt
              </TabsTrigger>
              <TabsTrigger value="utgifter" className="gap-2 text-sm">
                Utgifter
                {expenses.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                    {expenses.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="inkomster" className="gap-2 text-sm">
                Inkomster
                {incomes.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                    {incomes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sparande" className="gap-2 text-sm">
                Sparande
              </TabsTrigger>
            </TabsList>

            {/* Denna månad tab - Chronological list of all items */}
            <TabsContent value="denna-manad" className="mt-0">
              {combinedItems.length > 0 ? (
                <div className="space-y-4">
                  {/* Single settlement button - only action */}
                  {expenseSummary.oweAmount > 0 && (
                    <div className="flex justify-end">
                      <Button
                        variant="default"
                        size="default"
                        onClick={() => setIsSettleModalOpen(true)}
                        disabled={isSettling}
                        className="gap-2 hover:scale-105 active:scale-95 transition-transform"
                      >
                        {isSettling ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Registrerar...
                          </>
                        ) : (
                          <>
                            <Receipt size={16} />
                            Registrera utjämning
                          </>
                        )}
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
                              members={primaryGroup.members}
                              index={index}
                              onEdit={handleEditExpense}
                              onDelete={handleDeleteExpense}
                              currentUserId={user?.id}
                            />
                          ) : (
                            <div key={`income-${item.data.id}`} className="p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 shrink-0">
                                  <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground">
                                    {item.data.note || 'Inkomst'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {primaryGroup.members.find(m => m.user_id === item.data.recipient)?.name || 'Okänd användare'} •{' '}
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
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Calendar size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Inga transaktioner denna månad</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openAddExpenseModal}
                        className="gap-2"
                      >
                        <Plus size={14} />
                        Lägg till utgift
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openAddIncomeModal}
                        className="gap-2"
                      >
                        <Plus size={14} />
                        Lägg till inkomst
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Utgifter tab */}
            <TabsContent value="utgifter" className="mt-0">
              {expenses.length > 0 ? (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {expenses.map((expense, index) => (
                        <ExpenseItem
                          key={expense.id}
                          expense={expense}
                          members={primaryGroup.members}
                          index={index}
                          onEdit={handleEditExpense}
                          onDelete={handleDeleteExpense}
                          currentUserId={user?.id}
                        />
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
                    <p className="text-sm text-muted-foreground mb-4">Inga utgifter ännu</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAddExpenseModal}
                      className="gap-2"
                    >
                      <Plus size={14} />
                      Lägg till första utgiften
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Inkomster tab */}
            <TabsContent value="inkomster" className="mt-0">
              {incomes.length > 0 ? (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {incomes.map((income) => (
                        <div key={income.id} className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10 shrink-0">
                              <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {income.note || 'Inkomst'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {primaryGroup.members.find(m => m.user_id === income.recipient)?.name || 'Okänd användare'} •{' '}
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
                      <DollarSign size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Inga inkomster ännu</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAddIncomeModal}
                      className="gap-2"
                    >
                      <Plus size={14} />
                      Lägg till första inkomsten
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sparande tab */}
            <TabsContent value="sparande" className="mt-0">
              <Card className="border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <PiggyBank size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Sparande planerat</p>
                  <p className="text-xs text-muted-foreground">Här kommer du kunna följa era gemensamma sparkonton</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Modals */}
        <AddExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddExpense}
          groupId={primaryGroup.id}
          members={primaryGroup.members}
        />

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportExpenses}
          groupId={primaryGroup.id}
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
          members={primaryGroup.members}
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
    </TooltipProvider>
  );
};

export default Index;
