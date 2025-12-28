import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
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
import { ExpenseItem } from "@/components/ExpenseItem";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { SettlementModal } from "@/components/SettlementModal";
import { SettlementHistory } from "@/components/SettlementHistory";
import { ImportModal } from "@/components/ImportModal";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useSettlements } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { calculateBalance } from "@/lib/balanceUtils";
import { Trash2 } from "lucide-react";

const GroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, loading: groupsLoading, deleteGroup } = useGroups();
  const { expenses, loading: expensesLoading, addExpense, updateExpense, deleteExpense } = useExpenses(id);
  const { settlements, loading: settlementsLoading, addSettlement } = useSettlements(id);

  const group = groups.find((g) => g.id === id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const loading = groupsLoading || expensesLoading || settlementsLoading;

  const balances = useMemo(
    () => (group ? calculateBalance(expenses, group.members) : []),
    [expenses, group]
  );

  const positiveBalance = balances.find((b) => b.balance > 0);
  const negativeBalance = balances.find((b) => b.balance < 0);
  const positiveUser = group?.members.find((u) => u.user_id === positiveBalance?.userId);
  const negativeUser = group?.members.find((u) => u.user_id === negativeBalance?.userId);
  const oweAmount = Math.abs(negativeBalance?.balance || 0);

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
          <Link to="/" className="text-sm text-foreground hover:underline">
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
    for (const expense of newExpenses) {
      await addExpense(expense);
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
    navigate("/");
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Back & Title */}
        <div className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Tillbaka
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mt-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{group.name}</h1>
              {group.is_temporary && (
                <span className="text-xs text-muted-foreground">tillfällig</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Kod:</span>
                <code className="text-sm font-mono bg-secondary px-2 py-0.5 rounded select-all">
                  {group.invite_code}
                </code>
              </div>
              {user?.id === group.created_by && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="mb-10 pb-8 border-b border-border">
          {group.members.length === 1 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Totalt</p>
              <p className="text-3xl font-semibold text-foreground tabular-nums">
                {totalExpenses.toLocaleString("sv-SE")} kr
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Balans</p>
                {oweAmount > 0 && negativeUser && positiveUser ? (
                  <p className="text-lg text-foreground">
                    <span className="font-medium">{negativeUser.name}</span>
                    <span className="text-muted-foreground mx-2">→</span>
                    <span className="font-medium">{positiveUser.name}</span>
                    <span className="ml-3 text-2xl font-semibold tabular-nums">
                      {Math.round(oweAmount).toLocaleString("sv-SE")} kr
                    </span>
                  </p>
                ) : (
                  <p className="text-lg text-foreground">Kvitt ✓</p>
                )}
              </div>
              {oweAmount > 0 && (
                <Button variant="outline" onClick={() => setIsSettleModalOpen(true)}>
                  Avräkna
                </Button>
              )}
            </div>
          )}

          {/* Per-person breakdown */}
          {group.members.length > 1 && (
            <div className="flex gap-6 mt-6 text-sm">
              {balances.map((b) => {
                const member = group.members.find((u) => u.user_id === b.userId);
                const isPositive = b.balance >= 0;
                return (
                  <div key={b.userId} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{member?.name || "Okänd"}</span>
                    <span className={isPositive ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {isPositive ? "+" : ""}{Math.round(b.balance).toLocaleString("sv-SE")} kr
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="expenses">Utgifter</TabsTrigger>
            <TabsTrigger value="history">Historik</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            {expenses.length > 0 ? (
              <div className="divide-y divide-border">
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
            ) : (
              <p className="text-muted-foreground py-8">
                Inga utgifter ännu
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(true)} className="text-muted-foreground">
                + Lägg till
              </Button>
              <Button variant="ghost" onClick={() => setIsImportModalOpen(true)} className="text-muted-foreground">
                Importera
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <SettlementHistory settlements={settlements} members={group.members} />
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
