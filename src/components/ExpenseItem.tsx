import { memo, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Repeat } from "lucide-react";
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
          flex items-center justify-between gap-4 py-3
          bg-transparent transition-colors duration-150
          ${canModify && onEdit ? "cursor-pointer active:bg-muted/30 focus:outline-none" : ""}
        `}
        whileTap={canModify ? { scale: 0.98 } : undefined}
      >
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-medium text-foreground truncate">
              {expense.description || "Utgift"}
            </p>
            {expense.repeat && expense.repeat !== "none" && (
              <Repeat size={12} className="text-primary shrink-0" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-0.5">
            <span>{payer?.name || "Okänd"}</span>
            <span className="opacity-40">•</span>
            <span>{formattedDate}</span>
            {hasCustomSplit && (
              <>
                <span className="opacity-40">•</span>
                <span className="text-primary/70">Delad</span>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <span className="text-[15px] font-semibold text-expense tabular-nums shrink-0">
          -{safeAmount.toLocaleString("sv-SE")} kr
        </span>
      </motion.button>
    </div>
  );
});
