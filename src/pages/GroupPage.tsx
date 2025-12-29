import { useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ExpenseItem } from "@/components/ExpenseItem";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { SettlementModal } from "@/components/SettlementModal";
import { SettlementHistory } from "@/components/SettlementHistory";
import { ImportModal } from "@/components/ImportModal";
import { AddMembersModal } from "@/components/AddMembersModal";
import { IncomeItem } from "@/components/IncomeItem";
import { AddIncomeModal } from "@/components/AddIncomeModal";
import { EditIncomeModal } from "@/components/EditIncomeModal";
import { IncomeOverviewCard } from "@/components/IncomeOverviewCard";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useIncomes, Income, IncomeType } from "@/hooks/useIncomes";
import { useSettlements } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { getIncomesForMonth } from "@/lib/incomeUtils";
import { calculateBalance } from "@/lib/balanceUtils";
import {
  Trash2,
  Copy,
  Check,
  Plus,
  Upload,
  MoreHorizontal,
  ArrowRight,
  TrendingUp,
  Users,
  RefreshCw,
  UserMinus
} from "lucide-react";
import { toast } from "sonner";

const GroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, loading: groupsLoading, deleteGroup, addMembers, removeMember, regenerateInviteCode, refetch } = useGroups();
  const { expenses, loading: expensesLoading, addExpense, addExpenses, updateExpense, deleteExpense } = useExpenses(id);
  const { incomes, loading: incomesLoading, addIncome, updateIncome, deleteIncome } = useIncomes(id);
  const { settlements, loading: settlementsLoading, addSettlement } = useSettlements(id);

  // Memoize group lookup to prevent recalculation and potential race conditions
  const group = useMemo(() => groups.find((g) => g.id === id), [groups, id]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);

  // Income modal states
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isEditIncomeModalOpen, setIsEditIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  // Income filter states
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [filterRecipient, setFilterRecipient] = useState<string | "all">("all");
  const [filterType, setFilterType] = useState<IncomeType | "all">("all");
  const [filterIncluded, setFilterIncluded] = useState<"all" | "included" | "excluded">("all");

  // Track active tab
  const [activeTab, setActiveTab] = useState("expenses");

  const loading = groupsLoading || expensesLoading || incomesLoading || settlementsLoading;

  const balances = useMemo(
    () => (group ? calculateBalance(expenses, group.members) : []),
    [expenses, group]
  );

  // Optimize repeated find() calls by combining them into a single useMemo
  const { positiveBalance, negativeBalance, positiveUser, negativeUser, oweAmount, totalExpenses } = useMemo(() => {
    const posBalance = balances.find((b) => b.balance > 0);
    const negBalance = balances.find((b) => b.balance < 0);

    return {
      positiveBalance: posBalance,
      negativeBalance: negBalance,
      positiveUser: posBalance ? group?.members.find((u) => u.user_id === posBalance.userId) : undefined,
      negativeUser: negBalance ? group?.members.find((u) => u.user_id === negBalance.userId) : undefined,
      oweAmount: negBalance ? Math.abs(negBalance.balance) : 0,
      totalExpenses: expenses.reduce((sum, e) => {
        const amount = Number.isFinite(e.amount) ? e.amount : 0;
        return sum + amount;
      }, 0)
    };
  }, [balances, group?.members, expenses]);

  // All useCallback hooks must be called before any conditional returns
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

  const handleImportExpenses = useCallback(async (newExpenses: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }[]) => {
    // Batch insert all expenses in a single database query
    try {
      await addExpenses(newExpenses);
    } catch (error) {
      console.error("Error importing expenses:", error);
      toast.error("Ett fel uppstod vid import av utgifter");
    }
  }, [addExpenses]);

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveExpense = useCallback(async (updatedExpense: Expense) => {
    await updateExpense(updatedExpense.id, {
      amount: updatedExpense.amount,
      category: updatedExpense.category,
      description: updatedExpense.description,
      date: updatedExpense.date,
    });
    setIsEditModalOpen(false);
    setEditingExpense(null);
  }, [updateExpense]);

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    await deleteExpense(expenseId);
  }, [deleteExpense]);

  // Income handlers
  const handleAddIncome = useCallback(async (newIncome: any) => {
    return await addIncome(newIncome);
  }, [addIncome]);

  const handleEditIncome = useCallback((income: Income) => {
    setEditingIncome(income);
    setIsEditIncomeModalOpen(true);
  }, []);

  const handleSaveIncome = useCallback(async (updatedIncome: Income) => {
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
  }, [updateIncome]);

  const handleDeleteIncome = useCallback(async (incomeId: string) => {
    await deleteIncome(incomeId);
  }, [deleteIncome]);

  // Filtered incomes based on selected month and filters
  const filteredIncomes = useMemo(() => {
    let filtered = getIncomesForMonth(incomes, selectedYear, selectedMonth);

    if (filterRecipient !== "all") {
      filtered = filtered.filter((i) => i.recipient === filterRecipient);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((i) => i.type === filterType);
    }

    if (filterIncluded === "included") {
      filtered = filtered.filter((i) => i.included_in_split);
    } else if (filterIncluded === "excluded") {
      filtered = filtered.filter((i) => !i.included_in_split);
    }

    return filtered;
  }, [incomes, selectedYear, selectedMonth, filterRecipient, filterType, filterIncluded]);

  const handleSettle = useCallback(async () => {
    if (!negativeUser || !positiveUser || !id) return;

    await addSettlement({
      group_id: id,
      from_user: negativeUser.user_id,
      to_user: positiveUser.user_id,
      amount: Math.round(oweAmount),
    });
    setIsSettleModalOpen(false);
  }, [negativeUser, positiveUser, id, addSettlement, oweAmount]);

  const handleDeleteGroup = useCallback(async () => {
    if (!id) return;
    await deleteGroup(id);
    navigate("/dashboard");
  }, [id, deleteGroup, navigate]);

  const handleAddMembers = useCallback(async (userIds: string[]) => {
    if (!id) return;
    await addMembers(id, userIds);
    // addMembers already calls fetchGroups internally, no need to refetch
  }, [id, addMembers]);

  const handleRemoveMember = useCallback(async () => {
    if (!id || !memberToRemove) return;
    await removeMember(id, memberToRemove.id);
    setIsRemoveMemberDialogOpen(false);
    setMemberToRemove(null);
  }, [id, memberToRemove, removeMember]);

  const handleRegenerateCode = useCallback(async () => {
    if (!id) return;
    setIsRegeneratingCode(true);
    try {
      await regenerateInviteCode(id);
    } finally {
      setIsRegeneratingCode(false);
    }
  }, [id, regenerateInviteCode]);

  const handleCopyCode = useCallback(async () => {
    if (!group?.invite_code) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(group.invite_code);
        setCopiedCode(true);
        toast.success("Kod kopierad!");
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        // Fallback for browsers that don't support clipboard API
        toast.error("Kopiering stöds inte i din webbläsare");
      }
    } catch (error) {
      console.error("Failed to copy invite code:", error);
      toast.error("Kunde inte kopiera kod");
    }
  }, [group?.invite_code]);

  // Conditional returns must come after ALL hooks
  // Show loading state if any data is still loading OR if group data is inconsistent
  if (loading || (id && !group && groups.length > 0)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="h-6 w-32 rounded bg-secondary animate-pulse mb-4" />
          <div className="h-8 w-48 rounded bg-secondary animate-pulse mb-8" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded bg-secondary animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show not found state only when we're done loading and group is definitely not found
  if (!group && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <p className="text-muted-foreground mb-4">Gruppen hittades inte.</p>
          <Link to="/dashboard" className="text-sm text-foreground hover:underline">
            ← Tillbaka
          </Link>
        </main>
      </div>
    );
  }

  // Final safety check - should never happen due to above conditions
  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl py-8 px-4 sm:px-6">
        {/* Back & Title */}
        <div className="mb-10">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            ← Tillbaka
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground break-words">{group.name}</h1>
                {group.is_temporary && (
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground shrink-0">
                    Tillfällig
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users size={16} />
                <span>{group.members.length} {group.members.length === 1 ? 'medlem' : 'medlemmar'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-2 h-9 sm:h-8"
              >
                {copiedCode ? (
                  <>
                    <Check size={14} />
                    <span className="hidden sm:inline">Kopierad</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span className="hidden sm:inline">Kod: {group.invite_code}</span>
                    <span className="sm:hidden">{group.invite_code}</span>
                  </>
                )}
              </Button>

              {user?.id === group.created_by && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreHorizontal size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsAddMembersModalOpen(true)}>
                      <Users size={14} className="mr-2" />
                      Lägg till medlemmar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleRegenerateCode}
                      disabled={isRegeneratingCode}
                    >
                      <RefreshCw size={14} className={`mr-2 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                      {isRegeneratingCode ? 'Genererar...' : 'Ny inbjudningskod'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {group.members.length > 1 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Ta bort medlem
                        </div>
                        {group.members
                          .filter(m => m.user_id !== user?.id)
                          .map(member => (
                            <DropdownMenuItem
                              key={member.user_id}
                              onClick={() => {
                                setMemberToRemove({ id: member.user_id, name: member.name });
                                setIsRemoveMemberDialogOpen(true);
                              }}
                              className="text-orange-600 focus:text-orange-600"
                            >
                              <UserMinus size={14} className="mr-2" />
                              {member.name}
                            </DropdownMenuItem>
                          ))
                        }
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive py-3 sm:py-2"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Radera grupp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="mb-10">
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {/* Total Expenses Card */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp size={18} className="text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Totala utgifter</p>
                </div>
                <p className="text-3xl font-semibold text-foreground tabular-nums">
                  {totalExpenses.toLocaleString("sv-SE")} kr
                </p>
              </CardContent>
            </Card>

            {/* Balance Card */}
            {group.members.length > 1 ? (
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${oweAmount > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                        <ArrowRight size={18} className={oweAmount > 0 ? 'text-orange-600' : 'text-green-600'} />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Balans</p>
                    </div>
                    {oweAmount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSettleModalOpen(true)}
                        className="text-xs h-7"
                      >
                        Avräkna
                      </Button>
                    )}
                  </div>
                  {oweAmount > 0 && negativeUser && positiveUser ? (
                    <div>
                      <p className="text-base text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">{negativeUser.name}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium text-foreground">{positiveUser.name}</span>
                      </p>
                      <p className="text-2xl font-semibold text-foreground tabular-nums">
                        {Math.round(oweAmount).toLocaleString("sv-SE")} kr
                      </p>
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">Kvitt ✓</p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Per-person breakdown */}
          {group.members.length > 1 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {balances.map((b) => {
                const member = group.members.find((u) => u.user_id === b.userId);
                const isPositive = b.balance >= 0;
                const isZero = b.balance === 0;
                return (
                  <Card key={b.userId} className="border-border/50">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isPositive && !isZero
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : isZero
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          }`}>
                            {member?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">
                            {member?.name || "Okänd"}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums shrink-0 ${
                          isPositive && !isZero
                            ? 'text-green-600 dark:text-green-400'
                            : isZero
                            ? 'text-muted-foreground'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {isPositive && !isZero ? "+" : ""}{Math.round(b.balance).toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="h-10 w-full sm:w-auto">
              <TabsTrigger value="expenses" className="gap-2 flex-1 sm:flex-initial">
                Utgifter
                {expenses.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {expenses.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="incomes" className="gap-2 flex-1 sm:flex-initial">
                Inkomster
                {incomes.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {incomes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 flex-1 sm:flex-initial">
                Historik
                {settlements.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {settlements.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {activeTab === "expenses" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportModalOpen(true)}
                  className="gap-2 h-9 sm:h-8 flex-1 sm:flex-initial"
                >
                  <Upload size={14} />
                  <span className="hidden sm:inline">Importera</span>
                  <span className="sm:hidden">Importera</span>
                </Button>
              )}
              {(activeTab === "expenses" || activeTab === "incomes") && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (activeTab === "expenses") {
                      setIsAddModalOpen(true);
                    } else if (activeTab === "incomes") {
                      setIsAddIncomeModalOpen(true);
                    }
                  }}
                  className="gap-2 h-9 sm:h-8 flex-1 sm:flex-initial"
                >
                  <Plus size={14} />
                  Lägg till
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="expenses" className="mt-0">
            {expenses.length > 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {expenses.map((expense, index) => (
                      <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        members={group.members}
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
                    onClick={() => setIsAddModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus size={14} />
                    Lägg till första utgiften
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="incomes" className="mt-0">
            <div className="space-y-6">
              {/* Month selector and filters */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Månad</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <option key={month} value={month}>
                            {new Date(2000, month - 1, 1).toLocaleDateString("sv-SE", { month: "long" })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">År</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        {Array.from({ length: 3 }, (_, i) => currentDate.getFullYear() - i).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Person</label>
                      <select
                        value={filterRecipient}
                        onChange={(e) => setFilterRecipient(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="all">Alla</option>
                        {group.members.map((member) => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Status</label>
                      <select
                        value={filterIncluded}
                        onChange={(e) => setFilterIncluded(e.target.value as any)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="all">Alla</option>
                        <option value="included">Inkluderade</option>
                        <option value="excluded">Exkluderade</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Income overview card */}
              <IncomeOverviewCard
                incomes={incomes}
                members={group.members}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
              />

              {/* Income list */}
              {filteredIncomes.length > 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {filteredIncomes.map((income) => (
                        <IncomeItem
                          key={income.id}
                          income={income}
                          members={group.members}
                          onEdit={handleEditIncome}
                          onDelete={handleDeleteIncome}
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
                    <p className="text-sm text-muted-foreground mb-4">
                      Inga inkomster för denna period
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddIncomeModalOpen(true)}
                      className="gap-2"
                    >
                      <Plus size={14} />
                      Lägg till inkomst
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <SettlementHistory settlements={settlements} members={group.members} />
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
        groupId={group.id}
        members={group.members}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExpenses}
        groupId={group.id}
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
        members={group.members}
      />

      {negativeUser && positiveUser && (
        <SettlementModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          onConfirm={handleSettle}
          fromUser={negativeUser}
          toUser={positiveUser}
          amount={oweAmount}
        />
      )}

      <AddMembersModal
        isOpen={isAddMembersModalOpen}
        onClose={() => setIsAddMembersModalOpen(false)}
        onSubmit={handleAddMembers}
        currentMembers={group?.members || []}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera grupp</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill radera gruppen "{group.name}"? Detta kommer permanent ta bort gruppen och alla dess utgifter och avräkningar. Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Radera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRemoveMemberDialogOpen} onOpenChange={setIsRemoveMemberDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort medlem</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort {memberToRemove?.name} från gruppen? Medlemmen kommer inte längre kunna se gruppens utgifter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToRemove(null)}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Income Modals */}
      <AddIncomeModal
        isOpen={isAddIncomeModalOpen}
        onClose={() => setIsAddIncomeModalOpen(false)}
        onAdd={handleAddIncome}
        groupId={group.id}
        members={group.members}
      />

      <EditIncomeModal
        isOpen={isEditIncomeModalOpen}
        onClose={() => {
          setIsEditIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        income={editingIncome}
        members={group.members}
      />
    </div>
  );
};

export default GroupPage;
