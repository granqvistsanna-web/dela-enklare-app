import { useState, useMemo } from "react";
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
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useSettlements } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
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
  Users
} from "lucide-react";
import { toast } from "sonner";

const GroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, loading: groupsLoading, deleteGroup, addMembers, refetch } = useGroups();
  const { expenses, loading: expensesLoading, addExpense, updateExpense, deleteExpense } = useExpenses(id);
  const { settlements, loading: settlementsLoading, addSettlement } = useSettlements(id);

  const group = groups.find((g) => g.id === id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const loading = groupsLoading || expensesLoading || settlementsLoading;

  const balances = useMemo(
    () => (group ? calculateBalance(expenses, group.members) : []),
    [expenses, group]
  );

  const positiveBalance = balances.find((b) => b.balance > 0);
  const negativeBalance = balances.find((b) => b.balance < 0);
  const positiveUser = positiveBalance
    ? group?.members.find((u) => u.user_id === positiveBalance.userId)
    : undefined;
  const negativeUser = negativeBalance
    ? group?.members.find((u) => u.user_id === negativeBalance.userId)
    : undefined;
  const oweAmount = negativeBalance ? Math.abs(negativeBalance.balance) : 0;

  if (loading) {
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

  if (!group) {
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

  const handleAddExpense = async (newExpense: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }) => {
    await addExpense(newExpense);
  };

  const handleImportExpenses = async (newExpenses: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }[]) => {
    // Process imports in parallel for better performance
    try {
      await Promise.all(newExpenses.map(expense => addExpense(expense)));
    } catch (error) {
      console.error("Error importing expenses:", error);
      toast.error("Ett fel uppstod vid import av utgifter");
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleSaveExpense = async (updatedExpense: Expense) => {
    await updateExpense(updatedExpense.id, {
      amount: updatedExpense.amount,
      category: updatedExpense.category,
      description: updatedExpense.description,
      date: updatedExpense.date,
    });
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
  };

  const handleSettle = async () => {
    if (!negativeUser || !positiveUser || !id) return;

    await addSettlement({
      group_id: id,
      from_user: negativeUser.user_id,
      to_user: positiveUser.user_id,
      amount: Math.round(oweAmount),
    });
    setIsSettleModalOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!id) return;
    await deleteGroup(id);
    navigate("/dashboard");
  };

  const handleAddMembers = async (userIds: string[]) => {
    if (!id) return;
    await addMembers(id, userIds);
    await refetch();
  };

  const handleCopyCode = async () => {
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
  };

  const totalExpenses = expenses.reduce((sum, e) => {
    const amount = Number.isFinite(e.amount) ? e.amount : 0;
    return sum + amount;
  }, 0);

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
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-semibold text-foreground">{group.name}</h1>
                {group.is_temporary && (
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Tillfällig
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users size={16} />
                <span>{group.members.length} {group.members.length === 1 ? 'medlem' : 'medlemmar'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-2"
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
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
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {balances.map((b) => {
                const member = group.members.find((u) => u.user_id === b.userId);
                const isPositive = b.balance >= 0;
                const isZero = b.balance === 0;
                return (
                  <Card key={b.userId} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isPositive && !isZero
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : isZero
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          }`}>
                            {member?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {member?.name || "Okänd"}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${
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
        <Tabs defaultValue="expenses" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="h-10">
              <TabsTrigger value="expenses" className="gap-2">
                Utgifter
                {expenses.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {expenses.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                Historik
                {settlements.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {settlements.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="gap-2"
              >
                <Upload size={14} />
                <span className="hidden sm:inline">Importera</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2"
              >
                <Plus size={14} />
                Lägg till
              </Button>
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
    </div>
  );
};

export default GroupPage;
