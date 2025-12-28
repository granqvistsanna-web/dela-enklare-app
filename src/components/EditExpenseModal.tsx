import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, DollarSign, Tag, User as UserIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Expense, DEFAULT_CATEGORIES } from "@/lib/types";

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  expense: Expense | null;
  users: User[];
}

export function EditExpenseModal({ isOpen, onClose, onSave, expense, users }: EditExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setPaidBy(expense.paidBy);
      setCategory(expense.category);
      setDescription(expense.description);
      setDate(expense.date);
    }
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense || !amount || !paidBy || !category || !description) return;

    onSave({
      ...expense,
      amount: parseFloat(amount),
      paidBy,
      category,
      description,
      date,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && expense && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-x-4 top-4 bottom-4 z-50 flex items-start justify-center overflow-y-auto sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-4"
          >
            <Card className="border-border shadow-lg w-full my-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl">Redigera utgift</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount" className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign size={16} className="text-muted-foreground" />
                      Belopp (kr)
                    </Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg font-semibold h-12"
                      required
                    />
                  </div>

                  {/* Paid by */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <UserIcon size={16} className="text-muted-foreground" />
                      Vem betalade?
                    </Label>
                    <div className="flex gap-2">
                      {users.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setPaidBy(user.id)}
                          className={`flex-1 rounded-lg border-2 py-3 px-4 font-medium transition-all ${
                            paidBy === user.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary/50 text-foreground hover:border-primary/30"
                          }`}
                        >
                          {user.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Tag size={16} className="text-muted-foreground" />
                      Kategori
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2 px-1 transition-all ${
                            category === cat.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/50 hover:border-primary/30"
                          }`}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className="text-xs font-medium text-muted-foreground">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="flex items-center gap-2 text-sm font-medium">
                      <FileText size={16} className="text-muted-foreground" />
                      Beskrivning
                    </Label>
                    <Input
                      id="edit-description"
                      placeholder="t.ex. ICA Maxi veckoinköp"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-date" className="flex items-center gap-2 text-sm font-medium">
                      <Calendar size={16} className="text-muted-foreground" />
                      Datum
                    </Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Spara ändringar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
