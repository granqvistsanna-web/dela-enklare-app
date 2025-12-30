import { memo, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
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
  const canModify = currentUserId === expense.paid_by;
  const [dragX, setDragX] = useState(0);

  // Safe date parsing with fallback
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

  // Validate expense amount
  const safeAmount = Number.isFinite(expense.amount) && expense.amount >= 0
    ? expense.amount
    : 0;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe left to delete threshold
    if (info.offset.x < -100 && canModify && onDelete) {
      onDelete(expense.id);
    }
  };

  return (
    <div className="group relative overflow-hidden">
      {/* Delete background - shown when swiping */}
      {canModify && onDelete && (
        <div
          className="absolute inset-0 bg-destructive flex items-center justify-end px-6"
          style={{
            opacity: Math.min(Math.abs(dragX) / 100, 1),
          }}
        >
          <span className="text-destructive-foreground font-medium">Ta bort</span>
        </div>
      )}

      {/* Main content - draggable on mobile, tap to edit */}
      <motion.button
        type="button"
        drag={canModify && onDelete ? "x" : false}
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        onTap={() => canModify && onEdit?.(expense)}
        className={`w-full text-left appearance-none border-0 flex items-center justify-between py-4 px-4 sm:px-6 hover:bg-secondary/30 transition-colors bg-background ${canModify && onEdit ? "cursor-pointer active:bg-secondary/50" : ""}`}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="p-1.5 rounded-md bg-red-500/10 shrink-0">
            <ArrowUpRight size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{expense.description || "Utgift"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {payer?.name || "Okänd"} · {formattedDate}
              {hasCustomSplit && <span className="ml-1 text-primary">· Anpassad delning</span>}
            </p>
            {hasCustomSplit && (
              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(expense.splits!).map(([userId, amount]) => {
                  const member = members.find((m) => m.user_id === userId);
                  const safeSplitAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
                  return (
                    <span key={userId} className="whitespace-nowrap">
                      {member?.name || "Okänd"}: {safeSplitAmount.toLocaleString("sv-SE")} kr
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {safeAmount.toLocaleString("sv-SE")} kr
          </span>
          {canModify && <span className="text-muted-foreground text-lg">›</span>}
        </div>
      </motion.button>
    </div>
  );
});
