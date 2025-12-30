import { memo, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ArrowUpRight, Repeat } from "lucide-react";
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
  // Allow all group members to modify expenses (since user is already in the group)
  const canModify = !!currentUserId;
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
    <div className="group relative overflow-hidden touch-pan-y">
      {/* Delete background - shown when swiping */}
      {canModify && onDelete && (
        <div
          className="absolute inset-0 bg-destructive flex items-center justify-end px-6 pointer-events-none"
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
        onClick={() => canModify && onEdit?.(expense)}
        className={`
          w-full text-left appearance-none border-0
          flex items-center justify-between py-3.5 px-0 min-h-[68px]
          bg-background transition-all duration-150
          ${canModify && onEdit
            ? "cursor-pointer hover:bg-secondary/30 active:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            : ""}
        `}
        whileHover={canModify ? { x: 2 } : undefined}
        whileTap={canModify ? { scale: 0.99 } : undefined}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pointer-events-none">
          <div className="p-1.5 rounded-md bg-expense-bg shrink-0">
            <ArrowUpRight size={16} className="text-expense" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{expense.description || "Utgift"}</p>
              {expense.repeat && expense.repeat !== "none" && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-primary/10 rounded text-primary">
                  <Repeat size={10} />
                  {expense.repeat === "monthly" ? "Månadsvis" : "Årlig"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground/80">{payer?.name || "Okänd"}</span>
              <span>·</span>
              <span>{formattedDate}</span>
              {hasCustomSplit && (
                <>
                  <span>·</span>
                  <span className="text-primary font-medium">Delad</span>
                </>
              )}
            </div>
            {hasCustomSplit && (
              <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs">
                {Object.entries(expense.splits!).map(([userId, amount]) => {
                  const member = members.find((m) => m.user_id === userId);
                  const safeSplitAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
                  return (
                    <span key={userId} className="text-muted-foreground/80 whitespace-nowrap">
                      {member?.name || "?"}: <span className="font-medium text-foreground/70 tabular-nums">{safeSplitAmount.toLocaleString("sv-SE")}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pointer-events-none">
          <div className="text-right">
            <span className="text-base sm:text-lg font-semibold text-foreground tabular-nums block">
              {safeAmount.toLocaleString("sv-SE")}
            </span>
            <span className="text-xs text-muted-foreground">kr</span>
          </div>
          {canModify && (
            <span className="text-muted-foreground/40 group-hover:text-muted-foreground text-xl transition-all duration-150">
              ›
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
});
