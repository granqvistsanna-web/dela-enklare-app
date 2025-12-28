import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const GroupPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();
  const { expenses, loading: expensesLoading, addExpense, updateExpense, deleteExpense } = useExpenses(id);
  const { settlements, loading: settlementsLoading, addSettlement } = useSettlements(id);

  const group = groups.find((g) => g.id === id);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
          <div className="h-8 w-48 rounded bg-secondary animate-pulse mb-8" />
          <div className="h-32 rounded-md bg-secondary animate-pulse" />
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <p className="text-muted-foreground">Gruppen hittades inte.</p>
          <Link to="/" className="text-sm text-foreground hover:underline mt-4 inline-block">
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Back & Title */}
        <div className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Tillbaka
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <h1 className="text-2xl font-medium text-foreground">{group.name}</h1>
            {group.is_temporary && (
              <span className="text-xs text-muted-foreground">tillfällig</span>
            )}
          </div>
        </div>

        {/* Balance */}
        <div className="mb-12 pb-8 border-b border-border">
          <p className="text-sm text-muted-foreground mb-2">
            {group.members.length === 1 ? "Totalt" : "Balans"}
          </p>
          {group.members.length === 1 ? (
            <p className="text-lg text-foreground">
              {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString("sv-SE")} kr
            </p>
          ) : oweAmount > 0 && negativeUser && positiveUser ? (
            <div className="flex items-center justify-between">
              <p className="text-lg text-foreground">
                {negativeUser.name} är skyldig {positiveUser.name} {Math.round(oweAmount).toLocaleString("sv-SE")} kr
              </p>
              <Button variant="outline" onClick={() => setIsSettleModalOpen(true)}>
                Avräkna
              </Button>
            </div>
          ) : (
            <p className="text-lg text-foreground">Ni är kvitt</p>
          )}

          {/* Per-person breakdown */}
          {group.members.length > 1 && (
            <div className="flex gap-8 mt-6 text-sm">
              {balances.map((b) => {
                const member = group.members.find((u) => u.user_id === b.userId);
                const isPositive = b.balance >= 0;
                return (
                  <div key={b.userId}>
                    <span className="text-muted-foreground">{member?.name || "Okänd"}</span>
                    <span className={`ml-2 ${isPositive ? "text-foreground" : "text-muted-foreground"}`}>
                      {isPositive ? "+" : ""}
                      {Math.round(b.balance).toLocaleString("sv-SE")} kr
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="mb-8 bg-transparent border-b border-border rounded-none w-full justify-start gap-4 p-0">
            <TabsTrigger 
              value="expenses" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2"
            >
              Utgifter
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2"
            >
              Historik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            {expenses.length > 0 ? (
              <div className="space-y-1">
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
              <div className="py-8">
                <p className="text-muted-foreground mb-4">
                  Inga utgifter ännu
                </p>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(true)} className="text-muted-foreground">
                + Lägg till utgift
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
    </div>
  );
};

export default GroupPage;
