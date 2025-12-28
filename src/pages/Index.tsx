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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        <div className="mb-12">
          <h1 className="text-2xl font-medium text-foreground mb-1">
            Dina grupper
          </h1>
          <p className="text-muted-foreground">
            Håll koll på gemensamma utgifter
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-12 text-sm">
          <div>
            <span className="text-muted-foreground">Utgifter</span>
            <span className="ml-2 text-foreground font-medium">
              {loading ? "–" : expenses.length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Grupper</span>
            <span className="ml-2 text-foreground font-medium">
              {loading ? "–" : groups.length}
            </span>
          </div>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-md bg-secondary animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                expenses={expenses.filter((e) => e.group_id === group.id)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && groups.length === 0 && (
          <div className="py-12">
            <p className="text-muted-foreground mb-4">
              Inga grupper ännu
            </p>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
              Skapa grupp
            </Button>
          </div>
        )}

        {/* Add Group Button */}
        {!loading && groups.length > 0 && (
          <div className="mt-8">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(true)} className="text-muted-foreground">
              + Ny grupp
            </Button>
          </div>
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
