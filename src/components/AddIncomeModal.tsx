import { type FormEvent, type MouseEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GroupMember } from "@/hooks/useGroups";
import { IncomeType, IncomeRepeat, IncomeInput, Income } from "@/hooks/useIncomes";
import { getIncomeTypeIcon, getIncomeTypeLabel } from "@/lib/incomeUtils";
import { toast } from "sonner";

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (income: IncomeInput) => Promise<Income | null>;
  groupId: string;
  members: GroupMember[];
}

const INCOME_TYPES: IncomeType[] = ["salary", "bonus", "benefit", "other"];

export function AddIncomeModal({
  isOpen,
  onClose,
  onAdd,
  groupId,
  members,
}: AddIncomeModalProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(members[0]?.user_id || "");
  const [type, setType] = useState<IncomeType>("salary");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [repeat, setRepeat] = useState<IncomeRepeat>("none");
  const [includedInSplit, setIncludedInSplit] = useState(true);

  const resetForm = () => {
    setAmount("");
    setRecipient(members[0]?.user_id || "");
    setType("salary");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setRepeat("none");
    setIncludedInSplit(true);
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>,
    saveAndAddAnother: boolean = false
  ) => {
    e.preventDefault();

    // Validate required fields
    if (!amount || !recipient) {
      if (!amount) {
        toast.error("Ange ett belopp");
        return;
      }
      if (!recipient) {
        toast.error("Välj mottagare");
        return;
      }
      return;
    }

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

    const result = await onAdd({
      group_id: groupId,
      amount: amountCents,
      recipient,
      type,
      note: note.trim() || undefined,
      date,
      repeat,
      included_in_split: includedInSplit,
    });

    if (result) {
      if (saveAndAddAnother) {
        // Reset form but keep modal open
        resetForm();
        // Refocus on amount field
        setTimeout(() => {
          document.getElementById("income-amount")?.focus();
        }, 0);
      } else {
        resetForm();
        onClose();
      }
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
                  Ny inkomst
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center -mr-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="income-amount" className="text-sm text-muted-foreground">
                    Belopp (kr)
                  </Label>
                  <Input
                    id="income-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient" className="text-sm text-muted-foreground">
                    Mottagare
                  </Label>
                  <select
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                    style={{ fontSize: '16px' }}
                    required
                  >
                    {members.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Typ</Label>
                  <div className="flex flex-wrap gap-2">
                    {INCOME_TYPES.map((incomeType) => (
                      <button
                        key={incomeType}
                        type="button"
                        onClick={() => setType(incomeType)}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 sm:py-1.5 text-sm transition-colors active:scale-95 ${
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
                  <Label htmlFor="repeat" className="text-sm text-muted-foreground">
                    Upprepa
                  </Label>
                  <select
                    id="repeat"
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

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Spara
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleSubmit(e, true)}
                    className="flex-1"
                  >
                    Spara och lägg till ny
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
