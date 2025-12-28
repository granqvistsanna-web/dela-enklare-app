import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { parseFile, ParsedTransaction } from "@/lib/fileParser";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (expenses: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }[]) => void;
  groupId: string;
  currentUserId: string;
}

type ImportStep = "upload" | "categorizing" | "review";

export function ImportModal({ isOpen, onClose, onImport, groupId, currentUserId }: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');

    if (!isExcel && !isCsv) {
      toast.error("Endast CSV- och Excel-filer stöds");
      return;
    }

    try {
      let parsed: ParsedTransaction[];
      
      if (isExcel) {
        const buffer = await file.arrayBuffer();
        parsed = await parseFile(buffer, file.name);

        // Fallback: some banks export ".xls" that is actually HTML/text
        if (parsed.length === 0) {
          const text = await file.text();
          parsed = await parseFile(text, file.name);
        }
      } else {
        const content = await file.text();
        parsed = await parseFile(content, file.name);
      }
      
      if (parsed.length === 0) {
        const message = isExcel
          ? "Inga transaktioner hittades. Filen verkar vara en layoutad bank-export. Prova att exportera som CSV, eller spara om som riktig .xlsx."
          : "Inga transaktioner hittades. Kontrollera att filen innehåller datum + belopp. Ibland ligger rubriken längre ner i filen.";
        toast.error(message);
        return;
      }

      toast.success(`${parsed.length} transaktioner hittades. Kategoriserar med AI...`);

      setTransactions(parsed);
      setStep("categorizing");

      // Call AI categorization
      const { data, error } = await supabase.functions.invoke("categorize-transactions", {
        body: { 
          transactions: parsed.map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
          })),
          existingRules: [],
        },
      });

      if (error) {
        console.error("Categorization error:", error);
        setTransactions(parsed.map(t => ({ ...t, category: "ovrigt", isShared: true })));
      } else if (data?.categorizations) {
        const categorized = parsed.map((t, i) => {
          const cat = data.categorizations.find((c: any) => c.index === i);
          return {
            ...t,
            category: cat?.category || "ovrigt",
            isShared: cat?.isShared ?? true,
          };
        });
        setTransactions(categorized);
      }

      setStep("review");

    } catch (err: any) {
      console.error("File parsing error:", err);
      toast.error(
        err?.message ||
        "Kunde inte läsa filen. Om det är en bank-Excel, prova exportera som CSV eller spara om som .xlsx."
      );
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const toggleTransaction = (id: string) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t)
    );
  };

  const updateCategory = (id: string, category: string) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
  };

  const toggleShared = (id: string) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, isShared: !t.isShared } : t)
    );
  };

  const handleImport = () => {
    const selected = transactions.filter(t => t.selected && t.isShared);

    if (selected.length === 0) {
      toast.error("Välj minst en delad utgift att importera");
      return;
    }

    // Validate all selected transactions before importing
    const expenses = selected
      .filter(t => {
        // Filter out invalid transactions
        if (!Number.isFinite(t.amount) || t.amount <= 0) {
          console.warn(`Skipping transaction with invalid amount: ${t.id}`, t);
          return false;
        }
        if (!t.description || t.description.trim() === "") {
          console.warn(`Skipping transaction with empty description: ${t.id}`, t);
          return false;
        }
        if (!t.date) {
          console.warn(`Skipping transaction with missing date: ${t.id}`, t);
          return false;
        }
        return true;
      })
      .map(t => ({
        group_id: groupId,
        amount: t.amount,
        paid_by: currentUserId,
        category: t.category || "ovrigt",
        description: t.description.trim(),
        date: t.date,
      }));

    if (expenses.length === 0) {
      toast.error("Inga giltiga utgifter att importera");
      return;
    }

    if (expenses.length < selected.length) {
      toast.warning(`${selected.length - expenses.length} ogiltiga transaktioner hoppades över`);
    }

    onImport(expenses);

    toast.success(`${expenses.length} utgifter importerade`);

    setStep("upload");
    setTransactions([]);
    onClose();
  };

  const handleClose = () => {
    setStep("upload");
    setTransactions([]);
    onClose();
  };

  const selectedCount = transactions.filter(t => t.selected && t.isShared).length;
  const totalAmount = transactions
    .filter(t => t.selected && t.isShared)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-background border border-border rounded-md w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-hidden my-auto flex flex-col">
              <div className="flex items-center justify-between p-6 pb-4 shrink-0">
                <h2 className="text-lg font-medium text-foreground">Importera transaktioner</h2>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-auto px-6 pb-6">
                {step === "upload" && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-xl p-12 text-center transition-all
                      ${isDragging ? "border-primary bg-primary/5" : "border-border"}
                    `}
                  >
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Upload size={28} className="text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-2">
                      Dra och släpp din fil här
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      CSV eller Excel (.xlsx)
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>Välj fil</span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">
                      Stödjer de flesta svenska bankformat
                    </p>
                  </div>
                )}

                {step === "categorizing" && (
                  <div className="text-center py-12">
                    <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      Kategoriserar transaktioner...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      AI analyserar dina transaktioner för att föreslå kategorier
                    </p>
                  </div>
                )}

                {step === "review" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {selectedCount} av {transactions.length} transaktioner valda
                      </p>
                      <p className="font-medium text-foreground">
                        Totalt: {totalAmount.toLocaleString("sv-SE")} kr
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                      {transactions.map((t) => (
                        <TransactionRow
                          key={t.id}
                          transaction={t}
                          onToggle={() => toggleTransaction(t.id)}
                          onCategoryChange={(cat) => updateCategory(t.id, cat)}
                          onToggleShared={() => toggleShared(t.id)}
                        />
                      ))}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Button variant="outline" className="flex-1" onClick={handleClose}>
                        Avbryt
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={handleImport}
                        disabled={selectedCount === 0}
                      >
                        Importera {selectedCount} utgifter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TransactionRow({
  transaction,
  onToggle,
  onCategoryChange,
  onToggleShared,
}: {
  transaction: ParsedTransaction;
  onToggle: () => void;
  onCategoryChange: (category: string) => void;
  onToggleShared: () => void;
}) {
  const category = DEFAULT_CATEGORIES.find(c => c.id === transaction.category);
  const isActive = transaction.selected && transaction.isShared;

  // Safe date parsing with fallback
  let formattedDate = "Ogiltigt datum";
  try {
    const date = new Date(transaction.date);
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleDateString("sv-SE");
    }
  } catch (error) {
    console.warn("Invalid date in transaction:", transaction.id, transaction.date);
  }

  // Safe amount validation
  const safeAmount = Number.isFinite(transaction.amount) && transaction.amount >= 0
    ? transaction.amount
    : 0;

  return (
    <div className={`
      flex items-center gap-3 rounded-lg border p-3 transition-all
      ${isActive ? "border-primary/30 bg-card" : "border-border bg-muted/30 opacity-60"}
    `}>
      <Checkbox 
        checked={transaction.selected} 
        onCheckedChange={onToggle}
      />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">
          {transaction.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formattedDate}</span>
          <span>•</span>
          <button
            onClick={onToggleShared}
            className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
              transaction.isShared
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {transaction.isShared ? "Delad" : "Privat"}
          </button>
        </div>
      </div>

      <select
        value={transaction.category || "ovrigt"}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="text-xs border border-border rounded-md px-2 py-1 bg-background"
      >
        {DEFAULT_CATEGORIES.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>

      <p className="font-semibold text-foreground text-sm w-20 text-right">
        {safeAmount.toLocaleString("sv-SE")} kr
      </p>
    </div>
  );
}
