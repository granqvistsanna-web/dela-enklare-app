import { useState } from "react";
import { Header } from "@/components/Header";
import { GroupCard } from "@/components/GroupCard";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { CreateGroupModal } from "@/components/CreateGroupModal";

const Index = () => {
  const { groups, loading: groupsLoading, createGroup } = useGroups();
  const { expenses, loading: expensesLoading } = useExpenses();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loading = groupsLoading || expensesLoading;

  const handleCreateGroup = async (name: string, isTemporary: boolean) => {
    await createGroup(name, isTemporary);
    setIsCreateModalOpen(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Grupper
          </h1>
          <p className="text-muted-foreground">
            Hantera gemensamma utgifter
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-10 pb-8 border-b border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Totalt</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {loading ? "–" : `${totalExpenses.toLocaleString("sv-SE")} kr`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Grupper</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {loading ? "–" : groups.length}
            </p>
          </div>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="space-y-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded bg-secondary animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {groups.length > 0 ? (
              <div className="divide-y divide-border">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    expenses={expenses.filter((e) => e.group_id === group.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8">
                Inga grupper ännu
              </p>
            )}

            <div className="mt-8">
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(true)} className="text-muted-foreground">
                + Ny grupp
              </Button>
            </div>
          </>
        )}
      </main>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
};

export default Index;
