import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Scale, History, TrendingUp, TrendingDown, Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseItem } from "@/components/ExpenseItem";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { SettlementModal } from "@/components/SettlementModal";
import { SettlementHistory } from "@/components/SettlementHistory";
import { ImportModal } from "@/components/ImportModal";
import { mockGroups, mockExpenses, mockUsers, mockSettlements, calculateBalance } from "@/lib/mockData";
import { Expense } from "@/lib/types";
import { toast } from "sonner";

const GroupPage = () => {
  const { id } = useParams();
  const group = mockGroups.find((g) => g.id === id);
  
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const groupExpenses = useMemo(
    () => expenses.filter((e) => e.groupId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, id]
  );

  const groupSettlements = mockSettlements.filter((s) => s.groupId === id);
  
  const balances = calculateBalance(groupExpenses, mockUsers);
  const positiveBalance = balances.find((b) => b.balance > 0);
  const negativeBalance = balances.find((b) => b.balance < 0);
  const positiveUser = mockUsers.find((u) => u.id === positiveBalance?.userId);
  const negativeUser = mockUsers.find((u) => u.id === negativeBalance?.userId);
  const oweAmount = Math.abs(negativeBalance?.balance || 0);

  // Default to first user for now (would be current logged in user)
  const currentUserId = mockUsers[0].id;

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <p className="text-muted-foreground">Gruppen hittades inte.</p>
          <Link to="/">
            <Button variant="link" className="mt-4">
              <ArrowLeft size={16} />
              Tillbaka
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const handleAddExpense = (newExpense: Omit<Expense, "id" | "createdAt">) => {
    const expense: Expense = {
      ...newExpense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, expense]);
  };

  const handleImportExpenses = (newExpenses: Omit<Expense, "id" | "createdAt">[]) => {
    const expensesWithIds = newExpenses.map((e, i) => ({
      ...e,
      id: `import-${Date.now()}-${i}`,
      createdAt: new Date().toISOString(),
    }));
    setExpenses((prev) => [...prev, ...expensesWithIds]);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleSaveExpense = (updatedExpense: Expense) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e))
    );
    toast.success("Utgift uppdaterad");
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    toast.success("Utgift borttagen");
  };

  const handleSettle = () => {
    // In a real app, this would save to the database
    setIsSettleModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Back button & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft size={16} />
              Tillbaka
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
            {group.isTemporary && (
              <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent">
                Tillfällig
              </span>
            )}
          </div>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-success" />
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                    Aktuell balans
                  </p>
                  {oweAmount > 0 && negativeUser && positiveUser ? (
                    <p className="text-xl font-semibold text-foreground">
                      <span className="text-accent">{negativeUser.name}</span>
                      <span className="text-muted-foreground mx-2">är skyldig</span>
                      <span className="text-success">{positiveUser.name}</span>
                      <span className="text-foreground ml-2">
                        {Math.round(oweAmount).toLocaleString("sv-SE")} kr
                      </span>
                    </p>
                  ) : (
                    <p className="text-xl font-semibold text-success">Ni är kvitt! ✓</p>
                  )}
                </div>
                {oweAmount > 0 && (
                  <Button variant="accent" onClick={() => setIsSettleModalOpen(true)}>
                    <Scale size={18} />
                    Gör avräkning
                  </Button>
                )}
              </div>

              {/* Per-person breakdown */}
              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-border">
                {balances.map((b) => {
                  const user = mockUsers.find((u) => u.id === b.userId);
                  const isPositive = b.balance >= 0;
                  return (
                    <div key={b.userId} className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isPositive ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
                        }`}
                      >
                        {user?.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user?.name}</p>
                        <p
                          className={`text-sm font-semibold flex items-center gap-1 ${
                            isPositive ? "text-success" : "text-accent"
                          }`}
                        >
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isPositive ? "+" : ""}
                          {Math.round(b.balance).toLocaleString("sv-SE")} kr
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="expenses">Utgifter</TabsTrigger>
              <TabsTrigger value="history">Historik</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Alla utgifter ({groupExpenses.length})
                </h2>
                <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                  <Upload size={18} />
                  Importera CSV
                </Button>
              </div>

              {groupExpenses.length > 0 ? (
                <div className="space-y-3">
                  {groupExpenses.map((expense, index) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      users={mockUsers}
                      index={index}
                      onEdit={handleEditExpense}
                      onDelete={handleDeleteExpense}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Plus size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Inga utgifter ännu. Lägg till din första!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                      <Upload size={18} />
                      Importera CSV
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus size={18} />
                      Lägg till utgift
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <div className="flex items-center gap-2 mb-4">
                <History size={20} className="text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Avräkningshistorik</h2>
              </div>
              <SettlementHistory settlements={groupSettlements} users={mockUsers} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExpense}
        groupId={group.id}
        users={mockUsers}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExpenses}
        groupId={group.id}
        currentUserId={currentUserId}
      />

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        expense={editingExpense}
        users={mockUsers}
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

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.3 }}
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors sm:h-auto sm:w-auto sm:px-6 sm:py-3 sm:rounded-xl sm:gap-2"
      >
        <Plus size={24} />
        <span className="hidden sm:inline font-semibold">Lägg till utgift</span>
      </motion.button>
    </div>
  );
};

export default GroupPage;
