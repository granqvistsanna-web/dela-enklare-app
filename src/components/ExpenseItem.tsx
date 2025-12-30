import { memo, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ArrowUpRight, Repeat, ChevronRight } from "lucide-react";
import { Expense } from "@/hooks/useExpenses";
import { GroupMember } from "@/hooks/useGroups";

interface ExpenseItemProps {
  expense: Expense;
  members: GroupMember[];
  index: number;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  currentUserId?: string;
}

export const ExpenseItem = memo(function ExpenseItem({ expense, members, onEdit, onDelete, currentUserId }: ExpenseItemProps) {
  const payer = members.find((u) => u.user_id === expense.paid_by);
  const canModify = !!currentUserId;
  const [dragX, setDragX] = useState(0);

  let formattedDate = "Ogiltigt datum";
  try {
    const date = new Date(expense.date);
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "short",
      });
    }
  } catch (error) {
    console.warn("Invalid date for expense:", expense.id, expense.date);
  }

  const hasCustomSplit = expense.splits && Object.keys(expense.splits).length > 0;
  const safeAmount = Number.isFinite(expense.amount) && expense.amount >= 0 ? expense.amount : 0;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100 && canModify && onDelete) {
      onDelete(expense.id);
    }
  };

  return (
    <div className="group relative overflow-hidden touch-pan-y">
      {/* Delete background */}
      {canModify && onDelete && (
        <div
          className="absolute inset-0 bg-destructive flex items-center justify-end px-6 pointer-events-none"
          style={{ opacity: Math.min(Math.abs(dragX) / 100, 1) }}
        >
          <span className="text-destructive-foreground font-medium text-sm">Ta bort</span>
        </div>
      )}

      <motion.button
        type="button"
        drag={canModify && onDelete ? "x" : false}
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        onClick={() => canModify && onEdit?.(expense)}
        className={`
          w-full text-left appearance-none border-0
          flex items-center gap-3 py-3 sm:py-3.5 px-0
          bg-transparent transition-colors duration-150
          ${canModify && onEdit ? "cursor-pointer active:bg-muted/30 focus:outline-none focus-visible:bg-muted/30 -mx-2 px-2 rounded-lg" : ""}
        `}
        whileTap={canModify ? { scale: 0.995 } : undefined}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-expense/10 flex items-center justify-center shrink-0">
          <ArrowUpRight size={18} className="text-expense" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-medium text-foreground truncate">
              {expense.description || "Utgift"}
            </p>
            {expense.repeat && expense.repeat !== "none" && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-full text-primary font-medium shrink-0">
                <Repeat size={10} strokeWidth={2.5} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span className="font-medium">{payer?.name || "Okänd"}</span>
            <span className="opacity-40">•</span>
            <span>{formattedDate}</span>
            {hasCustomSplit && (
              <>
                <span className="opacity-40">•</span>
                <span className="text-primary/80 font-medium">Delad</span>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-base font-semibold text-expense tabular-nums">
              -{safeAmount.toLocaleString("sv-SE")}
            </span>
            <span className="text-xs text-muted-foreground ml-1">kr</span>
          </div>
          {canModify && (
            <ChevronRight 
              size={16} 
              className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" 
            />
          )}
        </div>
      </motion.button>
    </div>
  );
});
