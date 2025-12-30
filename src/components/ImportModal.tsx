import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { parseFile, ParsedTransaction } from "@/lib/fileParser";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

interface Categorization {
  index: number;
  category: string;
  isShared: boolean;
}

interface CategorizationResponse {
  categorizations: Categorization[];
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportExpenses: (expenses: {
    group_id: string;
    amount: number;
    paid_by: string;
    category: string;
    description: string;
    date: string;
  }[]) => void;
  onImportIncomes?: (incomes: {
    group_id: string;
    amount: number;
    recipient: string;
    type: string;
    note: string;
    date: string;
    repeat: string;
    included_in_split: boolean;
  }[]) => void;
  groupId: string;
  currentUserId: string;
}

type ImportStep = "upload" | "categorizing" | "review";
type TransactionType = "expense" | "income";

interface ExtendedTransaction extends ParsedTransaction {
  transactionType: TransactionType;
}

export function ImportModal({ 
  isOpen, 
  onClose, 
  onImportExpenses,
  onImportIncomes,
  groupId, 
  currentUserId 
}: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
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

      // Convert to extended transactions with type detection
      const extended: ExtendedTransaction[] = parsed.map(t => ({
        ...t,
        // Default to expense, user can change
        transactionType: "expense" as TransactionType,
      }));

      setTransactions(extended);
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
        setTransactions(extended.map(t => ({ ...t, category: "ovrigt", isShared: true })));
      } else if (data?.categorizations) {
        const response = data as CategorizationResponse;
        const categorized = extended.map((t, i) => {
          const cat = response.categorizations.find((c) => c.index === i);
          return {
            ...t,
            category: cat?.category || "ovrigt",
            isShared: cat?.isShared ?? true,
          };
        });
        setTransactions(categorized);
      }

      setStep("review");

    } catch (err) {
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

  const toggleTransactionType = (id: string) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { 
        ...t, 
        transactionType: t.transactionType === "expense" ? "income" : "expense" 
      } : t)
    );
  };

  const handleImport = () => {
    const selected = transactions.filter(t => t.selected);

    if (selected.length === 0) {
      toast.error("Välj minst en transaktion att importera");
      return;
    }

    // Split into expenses and incomes
    const selectedExpenses = selected.filter(t => t.transactionType === "expense" && t.isShared);
    const selectedIncomes = selected.filter(t => t.transactionType === "income");

    // Validate and prepare expenses
    const expenses = selectedExpenses
      .filter(t => {
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

    // Validate and prepare incomes
    const incomes = selectedIncomes
      .filter(t => {
        if (!Number.isFinite(t.amount) || t.amount <= 0) return false;
        if (!t.date) return false;
        return true;
      })
      .map(t => ({
        group_id: groupId,
        amount: Math.round(t.amount * 100), // Convert to cents
        recipient: currentUserId,
        type: "other",
        note: t.description?.trim() || "",
        date: t.date,
        repeat: "none",
        included_in_split: t.isShared ?? true,
      }));

    let importedCount = 0;

    if (expenses.length > 0) {
      onImportExpenses(expenses);
      importedCount += expenses.length;
    }

    if (incomes.length > 0 && onImportIncomes) {
      onImportIncomes(incomes);
      importedCount += incomes.length;
    }

    if (importedCount === 0) {
      toast.error("Inga giltiga transaktioner att importera");
      return;
    }

    const skipped = selected.length - (expenses.length + incomes.length);
    if (skipped > 0) {
      toast.warning(`${skipped} ogiltiga transaktioner hoppades över`);
    }

    toast.success(`${expenses.length} utgifter och ${incomes.length} inkomster importerade`);

    setStep("upload");
    setTransactions([]);
    onClose();
  };

  const handleClose = () => {
    setStep("upload");
    setTransactions([]);
    onClose();
  };

  const selectedExpenses = transactions.filter(t => t.selected && t.transactionType === "expense" && t.isShared);
  const selectedIncomes = transactions.filter(t => t.selected && t.transactionType === "income");
  const totalSelected = selectedExpenses.length + selectedIncomes.length;
  
  const totalExpenseAmount = selectedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncomeAmount = selectedIncomes.reduce((sum, t) => sum + t.amount, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
          >
            <div className="bg-background border border-border rounded-t-xl sm:rounded-xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 shrink-0 border-b border-border/50">
                <h2 className="text-base sm:text-lg font-medium text-foreground">Importera transaktioner</h2>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-2 -m-2">
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 sm:pb-6">
                {step === "upload" && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all
                      ${isDragging ? "border-primary bg-primary/5" : "border-border"}
                    `}
                  >
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Upload size={24} className="text-muted-foreground sm:hidden" />
                      <Upload size={28} className="text-muted-foreground hidden sm:block" />
                    </div>
                    <p className="text-base sm:text-lg font-medium text-foreground mb-1 sm:mb-2">
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
                    <p className="text-xs text-muted-foreground mt-3 sm:mt-4">
                      Stödjer de flesta svenska bankformat
                    </p>
                  </div>
                )}

                {step === "categorizing" && (
                  <div className="text-center py-8 sm:py-12">
                    <Loader2 size={40} className="text-primary animate-spin mx-auto mb-3 sm:mb-4" />
                    <p className="text-base sm:text-lg font-medium text-foreground mb-1 sm:mb-2">
                      Kategoriserar transaktioner...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      AI analyserar dina transaktioner
                    </p>
                  </div>
                )}

                {step === "review" && (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                      <p className="text-sm text-muted-foreground">
                        {totalSelected} av {transactions.length} valda
                      </p>
                      <div className="flex gap-3 text-sm">
                        {selectedExpenses.length > 0 && (
                          <span className="text-expense font-medium tabular-nums">
                            -{totalExpenseAmount.toLocaleString("sv-SE")} kr
                          </span>
                        )}
                        {selectedIncomes.length > 0 && (
                          <span className="text-income font-medium tabular-nums">
                            +{totalIncomeAmount.toLocaleString("sv-SE")} kr
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Transactions list - mobile optimized */}
                    <div className="space-y-2 max-h-[45vh] sm:max-h-[40vh] overflow-y-auto -mx-1 px-1">
                      {transactions.map((t) => (
                        <TransactionRow
                          key={t.id}
                          transaction={t}
                          onToggle={() => toggleTransaction(t.id)}
                          onCategoryChange={(cat) => updateCategory(t.id, cat)}
                          onToggleShared={() => toggleShared(t.id)}
                          onToggleType={() => toggleTransactionType(t.id)}
                        />
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
                      <Button variant="outline" className="flex-1" onClick={handleClose}>
                        Avbryt
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={handleImport}
                        disabled={totalSelected === 0}
                      >
                        Importera ({totalSelected})
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
  onToggleType,
}: {
  transaction: ExtendedTransaction;
  onToggle: () => void;
  onCategoryChange: (category: string) => void;
  onToggleShared: () => void;
  onToggleType: () => void;
}) {
  const category = DEFAULT_CATEGORIES.find(c => c.id === transaction.category);
  const isExpense = transaction.transactionType === "expense";
  const isActive = transaction.selected && (isExpense ? transaction.isShared : true);

  // Safe date parsing with fallback
  let formattedDate = "Ogiltigt datum";
  try {
    const date = new Date(transaction.date);
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
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
      rounded-lg border p-3 transition-all
      ${isActive ? "border-primary/30 bg-card" : "border-border bg-muted/30 opacity-60"}
    `}>
      {/* Top row: Checkbox, Type toggle, Description */}
      <div className="flex items-start gap-2 sm:gap-3">
        <Checkbox 
          checked={transaction.selected} 
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        
        {/* Type toggle button */}
        <button
          onClick={onToggleType}
          className={`p-1.5 rounded-md shrink-0 transition-colors ${
            isExpense ? "bg-expense-bg" : "bg-income-bg"
          }`}
          title={isExpense ? "Utgift - klicka för att ändra till inkomst" : "Inkomst - klicka för att ändra till utgift"}
        >
          {isExpense ? (
            <ArrowUpRight size={14} className="text-expense" />
          ) : (
            <ArrowDownLeft size={14} className="text-income" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate">
            {transaction.description}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formattedDate}
          </p>
        </div>

        <p className={`font-semibold text-sm tabular-nums shrink-0 ${
          isExpense ? "text-expense" : "text-income"
        }`}>
          {isExpense ? "-" : "+"}{safeAmount.toLocaleString("sv-SE")} kr
        </p>
      </div>

      {/* Bottom row: Category & Shared toggle */}
      <div className="flex items-center gap-2 mt-2 pl-7 sm:pl-9">
        {isExpense && (
          <>
            <select
              value={transaction.category || "ovrigt"}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1 bg-background flex-1 max-w-[140px]"
            >
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            <button
              onClick={onToggleShared}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                transaction.isShared
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {transaction.isShared ? "Delad" : "Privat"}
            </button>
          </>
        )}
        
        {!isExpense && (
          <button
            onClick={onToggleShared}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              transaction.isShared
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {transaction.isShared ? "Dela 50/50" : "Ej delad"}
          </button>
        )}
      </div>
    </div>
  );
}
