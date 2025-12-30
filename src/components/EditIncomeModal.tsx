import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Income, IncomeType, IncomeRepeat } from "@/hooks/useIncomes";
import { getIncomeTypeIcon, getIncomeTypeLabel } from "@/lib/incomeUtils";
import { toast } from "sonner";

interface EditIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Income) => void;
  onDelete?: (incomeId: string) => void;
  income: Income | null;
}

const INCOME_TYPES: IncomeType[] = ["salary", "bonus", "benefit", "other"];

export function EditIncomeModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  income,
}: EditIncomeModalProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<IncomeType>("salary");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [repeat, setRepeat] = useState<IncomeRepeat>("none");
  const [includedInSplit, setIncludedInSplit] = useState(true);

  useEffect(() => {
    if (income) {
      // Convert cents to kr
      setAmount((income.amount / 100).toFixed(2));
      setType(income.type);
      setNote(income.note || "");
      setDate(income.date);
      setRepeat(income.repeat);
      setIncludedInSplit(income.included_in_split);
    }
  }, [income]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!income || !amount) return;

    const amountKr = parseFloat(amount);

    // Validate amount is a valid positive number
    if (
      Number.isNaN(amountKr) ||
      !Number.isFinite(amountKr) ||
      amountKr <= 0
    ) {
      toast.error("Ange ett giltigt belopp större än 0");
      return;
    }

    // Convert to cents
    const amountCents = Math.round(amountKr * 100);

    onSave({
      ...income,
      amount: amountCents,
      type,
      note: note.trim() || null,
      date,
      repeat,
      included_in_split: includedInSplit,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && income && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-background border border-border rounded-md w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-6 my-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground">
                  Redigera inkomst
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-income-amount"
                    className="text-sm text-muted-foreground"
                  >
                    Belopp (kr)
                  </Label>
                  <Input
                    id="edit-income-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>


                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Typ</Label>
                  <div className="flex flex-wrap gap-2">
                    {INCOME_TYPES.map((incomeType) => (
                      <button
                        key={incomeType}
                        type="button"
                        onClick={() => setType(incomeType)}
                        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                          type === incomeType
                            ? "border-foreground bg-secondary"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <span>{getIncomeTypeIcon(incomeType)}</span>
                        <span className="text-foreground">
                          {getIncomeTypeLabel(incomeType)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-date"
                    className="text-sm text-muted-foreground"
                  >
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
                  <Label
                    htmlFor="edit-repeat"
                    className="text-sm text-muted-foreground"
                  >
                    Upprepa
                  </Label>
                  <select
                    id="edit-repeat"
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as IncomeRepeat)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="none">Ingen</option>
                    <option value="monthly">Månadsvis</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-note"
                    className="text-sm text-muted-foreground"
                  >
                    Anteckning (valfritt)
                  </Label>
                  <Input
                    id="edit-note"
                    placeholder="t.ex. Månadslön december"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2 p-3 border border-border rounded-md">
                  <Checkbox
                    id="edit-includedInSplit"
                    checked={includedInSplit}
                    onCheckedChange={(checked) =>
                      setIncludedInSplit(checked === true)
                    }
                  />
                  <Label
                    htmlFor="edit-includedInSplit"
                    className="text-sm font-normal text-foreground cursor-pointer"
                  >
                    Inkludera i 50/50-delning
                  </Label>
                </div>

                <div className="flex gap-3">
                  {onDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (income) {
                          onDelete(income.id);
                          onClose();
                        }
                      }}
                    >
                      Ta bort
                    </Button>
                  )}
                  <Button type="submit" className={onDelete ? "flex-1" : "w-full"}>
                    Spara
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
