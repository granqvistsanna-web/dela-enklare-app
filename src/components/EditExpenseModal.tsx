import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GroupMember } from "@/hooks/useGroups";
import { Expense, ExpenseSplit } from "@/hooks/useExpenses";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { toast } from "sonner";

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  expense: Expense | null;
  members: GroupMember[];
}

export function EditExpenseModal({ isOpen, onClose, onSave, expense, members }: EditExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [useCustomSplit, setUseCustomSplit] = useState(false);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setDescription(expense.description || "");
      setDate(expense.date);

      // Load splits if they exist
      if (expense.splits) {
        setUseCustomSplit(true);
        const splits: Record<string, string> = {};
        Object.entries(expense.splits).forEach(([userId, value]) => {
          splits[userId] = value.toString();
        });
        setCustomSplits(splits);
      } else {
        setUseCustomSplit(false);
        setCustomSplits({});
      }
    }
  }, [expense]);

  // Initialize custom splits when toggled on or when amount/members change
  useEffect(() => {
    if (useCustomSplit && amount && members.length > 0) {
      const totalAmount = parseFloat(amount) || 0;
      const currentSum = calculateSplitSum();

      // If splits are empty or don't exist for all members, initialize with equal split
      const hasAllMembers = members.every(m => m.user_id in customSplits);
      if (Object.keys(customSplits).length === 0 || !hasAllMembers) {
        const perPerson = totalAmount / members.length;
        const splits: Record<string, string> = {};
        members.forEach((member) => {
          splits[member.user_id] = perPerson.toFixed(2);
        });
        setCustomSplits(splits);
      } else if (currentSum > 0 && Math.abs(currentSum - totalAmount) > 0.01) {
        // If amount changed and splits exist, scale them proportionally
        const scaleFactor = totalAmount / currentSum;
        const splits: Record<string, string> = {};
        members.forEach((member) => {
          const currentValue = parseFloat(customSplits[member.user_id] || "0");
          splits[member.user_id] = (currentValue * scaleFactor).toFixed(2);
        });
        setCustomSplits(splits);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCustomSplit, amount, members]);

  const handleSplitChange = (userId: string, value: string) => {
    setCustomSplits((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const calculateSplitSum = () => {
    return Object.values(customSplits).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense || !amount || !category || !description) return;

    const totalAmount = parseFloat(amount);

    // Validate amount is a valid positive number
    if (Number.isNaN(totalAmount) || !Number.isFinite(totalAmount) || totalAmount <= 0) {
      toast.error("Ange ett giltigt belopp större än 0");
      return;
    }

    // Validate custom splits if enabled
    if (useCustomSplit) {
      const splitSum = calculateSplitSum();

      // Validate all split values are valid numbers
      const hasInvalidSplit = Object.values(customSplits).some(val => {
        const num = parseFloat(val);
        return Number.isNaN(num) || !Number.isFinite(num) || num < 0;
      });

      if (hasInvalidSplit) {
        toast.error("Alla fördelningsvärden måste vara giltiga positiva tal");
        return;
      }

      if (Math.abs(splitSum - totalAmount) > 0.01) {
        toast.error(`Summan av fördelningen (${splitSum.toFixed(2)} kr) måste vara lika med totala beloppet (${totalAmount.toFixed(2)} kr)`);
        return;
      }
    }

    // Build splits object
    let splits: ExpenseSplit | null = null;
    if (useCustomSplit) {
      splits = {};
      Object.entries(customSplits).forEach(([userId, value]) => {
        splits![userId] = parseFloat(value) || 0;
      });
    }

    onSave({
      ...expense,
      amount: totalAmount,
      category,
      description,
      date,
      splits,
    });

    onClose();
  };

  const payer = members.find((m) => m.user_id === expense?.paid_by);

  return (
    <AnimatePresence>
      {isOpen && expense && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-background border border-border rounded-md w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-6 my-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground">Redigera utgift</h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount" className="text-sm text-muted-foreground">
                    Belopp (kr)
                  </Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Betalades av</Label>
                  <div className="rounded-md border border-border bg-secondary/50 py-2 px-3 text-foreground">
                    {payer?.name || "Okänd"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Kategori</Label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                          category === cat.id
                            ? "border-foreground bg-secondary"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="text-foreground">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-sm text-muted-foreground">
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

                <div className="space-y-2">
                  <Label htmlFor="edit-date" className="text-sm text-muted-foreground">
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Fördelning</Label>
                    <button
                      type="button"
                      onClick={() => setUseCustomSplit(!useCustomSplit)}
                      className="text-sm text-primary hover:underline"
                    >
                      {useCustomSplit ? "Jämn delning" : "Anpassad delning"}
                    </button>
                  </div>

                  {useCustomSplit && amount && (
                    <div className="space-y-2 p-3 border border-border rounded-md bg-secondary/20">
                      <p className="text-xs text-muted-foreground mb-2">
                        Fördela {parseFloat(amount).toFixed(2)} kr mellan gruppmedlemmar:
                      </p>
                      {members.map((member) => (
                        <div key={member.user_id} className="flex items-center gap-2">
                          <Label className="text-sm flex-1 text-foreground">
                            {member.name}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={customSplits[member.user_id] || ""}
                            onChange={(e) => handleSplitChange(member.user_id, e.target.value)}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">kr</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-border mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Summa:</span>
                          <span className={`font-medium ${
                            Math.abs(calculateSplitSum() - (parseFloat(amount) || 0)) < 0.01
                              ? "text-green-600"
                              : "text-destructive"
                          }`}>
                            {calculateSplitSum().toFixed(2)} kr
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!useCustomSplit && (
                    <p className="text-xs text-muted-foreground">
                      Delas lika mellan alla gruppmedlemmar
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Spara ändringar
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
