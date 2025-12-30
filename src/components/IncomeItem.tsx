import { memo, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ArrowDownLeft, Repeat } from "lucide-react";
import { Income } from "@/hooks/useIncomes";
import { GroupMember } from "@/hooks/useGroups";
import { getIncomeTypeLabel } from "@/lib/incomeUtils";

interface IncomeItemProps {
  income: Income;
  members: GroupMember[];
  onEdit?: (income: Income) => void;
  onDelete?: (incomeId: string) => void;
  currentUserId?: string;
}

export const IncomeItem = memo(function IncomeItem({
  income,
  members,
  onEdit,
  onDelete,
  currentUserId,
}: IncomeItemProps) {
  const recipient = members.find((u) => u.user_id === income.recipient);
  // Allow all group members to modify incomes (since user is already in the group)
  const canModify = !!currentUserId;
  const [dragX, setDragX] = useState(0);

  // Safe date parsing with fallback
  let formattedDate = "Ogiltigt datum";
  try {
    const date = new Date(income.date);
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "short",
      });
    }
  } catch (error) {
    console.warn("Invalid date for income:", income.id, income.date);
  }

  // Validate income amount (stored in cents)
  const safeAmount =
    Number.isFinite(income.amount) && income.amount >= 0 ? income.amount : 0;
  const amountKr = safeAmount / 100;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe left to delete threshold
    if (info.offset.x < -100 && canModify && onDelete) {
      onDelete(income.id);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg touch-pan-y">
      {/* Delete background - shown when swiping */}
      {canModify && onDelete && (
        <div
          className="absolute inset-0 bg-destructive flex items-center justify-end px-6 pointer-events-none rounded-lg"
          style={{
            opacity: Math.min(Math.abs(dragX) / 100, 1),
          }}
        >
          <span className="text-destructive-foreground font-medium">Ta bort</span>
        </div>
      )}

      {/* Main content - draggable on mobile */}
      <motion.button
        type="button"
        drag={canModify && onDelete ? "x" : false}
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        onClick={() => canModify && onEdit?.(income)}
        className={`
          w-full text-left appearance-none border-0 rounded-lg
          flex items-center justify-between py-5 px-4 sm:px-6 min-h-[72px]
          bg-background transition-all duration-150
          ${canModify && onEdit
            ? "cursor-pointer hover:bg-secondary/40 active:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            : ""}
        `}
        whileHover={canModify ? { scale: 1.005 } : undefined}
        whileTap={canModify ? { scale: 0.995 } : undefined}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pointer-events-none">
          <div className="relative shrink-0">
            <div className="p-1.5 rounded-md bg-income-bg">
              <ArrowDownLeft size={16} className="text-income" />
            </div>
            {/* User avatar initials */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-medium flex items-center justify-center ring-2 ring-background">
              {recipient?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">
                {getIncomeTypeLabel(income.type)}
              </p>
              {!income.included_in_split && (
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                  Ej delad
                </span>
              )}
              {income.repeat && income.repeat !== "none" && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-primary/10 rounded text-primary">
                  <Repeat size={10} />
                  {income.repeat === "monthly" ? "Månadsvis" : "Årlig"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground/80">{recipient?.name || "Okänd"}</span>
              <span className="mx-1">·</span>
              {formattedDate}
            </p>
            {income.note && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {income.note}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 pointer-events-none">
          <span className="text-number text-income">
            +{amountKr.toLocaleString("sv-SE", { minimumFractionDigits: 0 })} kr
          </span>
          {canModify && (
            <span className="text-muted-foreground/40 group-hover:text-muted-foreground text-lg transition-all duration-150 group-hover:translate-x-0.5">
              ›
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
});
