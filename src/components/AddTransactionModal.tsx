import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GroupMember } from "@/hooks/useGroups";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { ExpenseSplit } from "@/hooks/useExpenses";
import { IncomeType, IncomeRepeat, IncomeInput, Income } from "@/hooks/useIncomes";
import { getIncomeTypeIcon, getIncomeTypeLabel } from "@/lib/incomeUtils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
    splits?: ExpenseSplit | null;
  }) => void;
  onAddIncome: (income: IncomeInput) => Promise<Income | null>;
  groupId: string;
  members: GroupMember[];
  defaultType?: "expense" | "income";
}

const INCOME_TYPES: IncomeType[] = ["salary", "bonus", "benefit", "other"];

export function AddTransactionModal({
  isOpen,
  onClose,
  onAddExpense,
  onAddIncome,
  groupId,
  members,
  defaultType = "expense",
}: AddTransactionModalProps) {
  const { user } = useAuth();

  // Transaction type
  const [transactionType, setTransactionType] = useState<"expense" | "income">(defaultType);

  // Common fields
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Expense-specific fields
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].id);
  const [description, setDescription] = useState("");
  const [useCustomSplit, setUseCustomSplit] = useState(false);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  // Income-specific fields
  // Use current user as fallback if members list is empty
  const [recipient, setRecipient] = useState(members[0]?.user_id || user?.id || "");
  const [incomeType, setIncomeType] = useState<IncomeType>("salary");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState<IncomeRepeat>("none");
  const [includedInSplit, setIncludedInSplit] = useState(true);

  // Initialize custom splits for expenses
  useEffect(() => {
    if (useCustomSplit && amount && members.length > 0 && transactionType === "expense") {
      const totalAmount = parseFloat(amount) || 0;
      const perPerson = totalAmount / members.length;
      const splits: Record<string, string> = {};
      members.forEach((member) => {
        splits[member.user_id] = perPerson.toFixed(2);
      });
      setCustomSplits(splits);
    }
  }, [useCustomSplit, members, amount, transactionType]);

  // Reset recipient when members change
  useEffect(() => {
    if (members.length > 0 && !recipient) {
      setRecipient(members[0].user_id);
    } else if (members.length === 0 && !recipient && user?.id) {
      // Fallback to current user if no members
      setRecipient(user.id);
    }
  }, [members, recipient, user]);

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

  const resetForm = () => {
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory(DEFAULT_CATEGORIES[0].id);
    setDescription("");
    setUseCustomSplit(false);
    setCustomSplits({});
    setRecipient(members[0]?.user_id || user?.id || "");
    setIncomeType("salary");
    setNote("");
    setRepeat("none");
    setIncludedInSplit(true);
  };

  const handleSubmitExpense = () => {
    // Validate required fields
    if (!amount || !category || !description) {
      if (!amount) {
        toast.error("Ange ett belopp");
        return false;
      }
      if (!description) {
        toast.error("Ange en beskrivning");
        return false;
      }
      if (!category) {
        toast.error("Välj en kategori");
        return false;
      }
      return false;
    }

    const totalAmount = parseFloat(amount);

    // Validate amount is a valid positive number
    if (Number.isNaN(totalAmount) || !Number.isFinite(totalAmount) || totalAmount <= 0) {
      toast.error("Ange ett giltigt belopp större än 0");
      return false;
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
        return false;
      }

      if (Math.abs(splitSum - totalAmount) > 0.01) {
        toast.error(`Summan av fördelningen (${splitSum.toFixed(2)} kr) måste vara lika med totala beloppet (${totalAmount.toFixed(2)} kr)`);
        return false;
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

    onAddExpense({
      group_id: groupId,
      amount: totalAmount,
      paid_by: user?.id || "",
      category,
      description,
      date,
      splits,
    });

    return true;
  };

  const handleSubmitIncome = async () => {
    // Validate required fields
    if (!amount || !recipient) {
      if (!amount) {
        toast.error("Ange ett belopp");
        return false;
      }
      if (!recipient) {
        toast.error("Välj mottagare");
        return false;
      }
      return false;
    }

    const amountKr = parseFloat(amount);

    // Validate amount is a valid positive number
    if (
      Number.isNaN(amountKr) ||
      !Number.isFinite(amountKr) ||
      amountKr <= 0
    ) {
      toast.error("Ange ett giltigt belopp större än 0");
      return false;
    }

    // Convert to cents
    const amountCents = Math.round(amountKr * 100);

    const result = await onAddIncome({
      group_id: groupId,
      amount: amountCents,
      recipient,
      type: incomeType,
      note: note.trim() || undefined,
      date,
      repeat,
      included_in_split: includedInSplit,
    });

    return !!result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let success = false;
    if (transactionType === "expense") {
      success = handleSubmitExpense();
    } else {
      success = await handleSubmitIncome();
    }

    if (success) {
      resetForm();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-background border border-border rounded-md w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground">
                  Lägg till transaktion
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center -mr-1"
                >
                  ✕
                </button>
              </div>

              {/* Transaction Type Selector */}
              <div className="flex gap-2 mb-6 p-1 bg-muted rounded-md">
                <button
                  type="button"
                  onClick={() => setTransactionType("expense")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    transactionType === "expense"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Utgift
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType("income")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    transactionType === "income"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Inkomst
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount - Common field */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm text-muted-foreground">
                    Belopp (kr)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {/* Expense-specific fields */}
                {transactionType === "expense" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Kategori</Label>
                      <div className="flex flex-wrap gap-2">
                        {DEFAULT_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 sm:py-1.5 text-sm transition-colors active:scale-95 ${
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
                      <Label htmlFor="description" className="text-sm text-muted-foreground">
                        Beskrivning
                      </Label>
                      <Input
                        id="description"
                        placeholder="t.ex. ICA Maxi"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm text-muted-foreground">
                        Datum
                      </Label>
                      <Input
                        id="date"
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
                        <div className="space-y-3 p-3 sm:p-3 border border-border rounded-md bg-secondary/20">
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
                                className="w-28 sm:w-24 h-10 sm:h-9"
                              />
                              <span className="text-sm text-muted-foreground shrink-0">kr</span>
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
                  </>
                )}

                {/* Income-specific fields */}
                {transactionType === "income" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-sm text-muted-foreground">
                        Mottagare
                      </Label>
                      <select
                        id="recipient"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        {members.length > 0 ? (
                          members.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.name}
                            </option>
                          ))
                        ) : user?.id ? (
                          <option value={user.id}>Mig själv</option>
                        ) : (
                          <option value="">Välj mottagare</option>
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Typ</Label>
                      <div className="flex flex-wrap gap-2">
                        {INCOME_TYPES.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setIncomeType(type)}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 sm:py-1.5 text-sm transition-colors active:scale-95 ${
                              incomeType === type
                                ? "border-foreground bg-secondary"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <span>{getIncomeTypeIcon(type)}</span>
                            <span className="text-foreground">
                              {getIncomeTypeLabel(type)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="income-date" className="text-sm text-muted-foreground">
                        Datum
                      </Label>
                      <Input
                        id="income-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="repeat" className="text-sm text-muted-foreground">
                        Upprepa
                      </Label>
                      <select
                        id="repeat"
                        value={repeat}
                        onChange={(e) => setRepeat(e.target.value as IncomeRepeat)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="none">Ingen</option>
                        <option value="monthly">Månadsvis</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="note" className="text-sm text-muted-foreground">
                        Anteckning (valfritt)
                      </Label>
                      <Input
                        id="note"
                        placeholder="t.ex. Månadslön december"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-border rounded-md">
                      <Checkbox
                        id="includedInSplit"
                        checked={includedInSplit}
                        onCheckedChange={(checked) =>
                          setIncludedInSplit(checked === true)
                        }
                      />
                      <Label
                        htmlFor="includedInSplit"
                        className="text-sm font-normal text-foreground cursor-pointer"
                      >
                        Inkludera i 50/50-delning
                      </Label>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full">
                  Lägg till {transactionType === "expense" ? "utgift" : "inkomst"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
