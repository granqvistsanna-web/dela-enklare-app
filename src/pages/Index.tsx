import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { GroupCard } from "@/components/GroupCard";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { JoinGroupModal } from "@/components/JoinGroupModal";
const Index = () => {
  const {
    groups,
    loading: groupsLoading,
    createGroup,
    refetch
  } = useGroups();
  const {
    expenses,
    loading: expensesLoading
  } = useExpenses();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const loading = groupsLoading || expensesLoading;
  const handleCreateGroup = async (name: string, isTemporary: boolean, selectedUserIds: string[]) => {
    await createGroup(name, isTemporary, selectedUserIds);
    setIsCreateModalOpen(false);
  };

  // Memoize total and grouped expenses to avoid recalculation on every render
  const { totalExpenses, expensesByGroup } = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byGroup = expenses.reduce((acc, expense) => {
      if (!acc[expense.group_id]) {
        acc[expense.group_id] = [];
      }
      acc[expense.group_id].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);
    return { totalExpenses: total, expensesByGroup: byGroup };
  }, [expenses]);
  return <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 sm:py-12 md:py-16 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-3 tracking-tight">
            Dina grupper
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">Skapa grupper och hantera gemensamma utgifter.</p>
        </div>

        {/* Stats Cards */}
        {!loading && groups.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 sm:mb-12">
            <div className="bg-secondary/50 rounded-lg p-5 sm:p-6 border border-border hover:bg-secondary transition-colors">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Totala utgifter</p>
              <p className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">
                {totalExpenses.toLocaleString("sv-SE")} kr
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-5 sm:p-6 border border-border hover:bg-secondary transition-colors">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Aktiva grupper</p>
              <p className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">
                {groups.length}
              </p>
            </div>
          </div>}

        {/* Action Buttons */}
        {!loading && <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-foreground text-background hover:bg-foreground/90 font-medium w-full sm:w-auto">
              + Skapa ny grupp
            </Button>
            <Button variant="outline" onClick={() => setIsJoinModalOpen(true)} className="font-medium w-full sm:w-auto">
              Gå med i grupp
            </Button>
          </div>}

        {/* Groups List */}
        {loading ? <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-lg bg-secondary/50 animate-pulse" />)}
          </div> : <>
            {groups.length > 0 ? <div className="space-y-3">
                {groups.map(group => <GroupCard key={group.id} group={group} expenses={expensesByGroup[group.id] || []} />)}
              </div> : <div className="text-center py-20 px-6">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Välkommen till Päronsplit
                  </h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Skapa din första grupp för att börja dela utgifter med vänner,
                    familj eller kollegor. Eller gå med i en befintlig grupp om någon
                    bjudit in dig.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-foreground text-background hover:bg-foreground/90 font-medium">
                      + Skapa din första grupp
                    </Button>
                    <Button variant="outline" onClick={() => setIsJoinModalOpen(true)} className="font-medium">
                      Gå med i grupp
                    </Button>
                  </div>
                </div>
              </div>}
          </>}
      </main>

      <CreateGroupModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateGroup} />

      <JoinGroupModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} onSuccess={refetch} />
    </div>;
};
export default Index;