import { motion } from "framer-motion";
import { Plus, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { GroupCard } from "@/components/GroupCard";
import { Button } from "@/components/ui/button";
import { mockGroups, mockExpenses, mockUsers } from "@/lib/mockData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Välkommen tillbaka! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Håll koll på era gemensamma utgifter
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Receipt size={20} className="text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {mockExpenses.length}
            </p>
            <p className="text-sm text-muted-foreground">Utgifter denna månad</p>
          </div>
          <div className="rounded-xl bg-success/10 border border-success/20 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {mockGroups.length}
            </p>
            <p className="text-sm text-muted-foreground">Aktiva grupper</p>
          </div>
        </motion.div>

        {/* Groups Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-semibold text-foreground">Dina grupper</h2>
          <Button variant="outline" size="sm">
            <Plus size={16} />
            Ny grupp
          </Button>
        </motion.div>

        {/* Groups List */}
        <div className="space-y-4">
          {mockGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <GroupCard group={group} expenses={mockExpenses} users={mockUsers} />
            </motion.div>
          ))}
        </div>

        {/* Empty State - hidden when groups exist */}
        {mockGroups.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Receipt size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Inga grupper ännu
            </h3>
            <p className="text-muted-foreground mb-4">
              Skapa din första grupp för att börja dela utgifter
            </p>
            <Button>
              <Plus size={18} />
              Skapa grupp
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Index;
