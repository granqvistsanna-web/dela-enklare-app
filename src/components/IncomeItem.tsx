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
          w-full text-left appearance-none border-0
          flex items-center justify-between py-4 px-0 min-h-[72px]
          bg-background transition-all duration-200
          ${canModify && onEdit
            ? "cursor-pointer hover:bg-secondary/40 active:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-md"
            : ""}
        `}
        whileHover={canModify ? { x: 3 } : undefined}
        whileTap={canModify ? { scale: 0.985 } : undefined}
      >
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1 pointer-events-none">
          <div className="relative shrink-0">
            <div className="p-2 rounded-lg bg-income-bg ring-1 ring-income/10">
              <ArrowDownLeft size={18} className="text-income" strokeWidth={2.5} />
            </div>
            {/* User avatar initials */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background shadow-sm">
              {recipient?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[15px] font-semibold text-foreground truncate leading-tight">
                {getIncomeTypeLabel(income.type)}
              </p>
              {!income.included_in_split && (
                <span className="text-[11px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
                  Ej delad
                </span>
              )}
              {income.repeat && income.repeat !== "none" && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-primary/10 rounded-full text-primary font-medium">
                  <Repeat size={11} strokeWidth={2.5} />
                  {income.repeat === "monthly" ? "Månadsvis" : "Årlig"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground/70">{recipient?.name || "Okänd"}</span>
              <span className="opacity-50">•</span>
              <span>{formattedDate}</span>
              {income.note && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="truncate font-medium">{income.note}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pointer-events-none">
          <div className="text-right">
            <span className="text-lg sm:text-xl font-bold text-income tabular-nums block leading-tight">
              +{amountKr.toLocaleString("sv-SE", { minimumFractionDigits: 0 })}
            </span>
            <span className="text-[11px] text-muted-foreground/70 font-medium">kr</span>
          </div>
          {canModify && (
            <span className="text-muted-foreground/30 group-hover:text-muted-foreground/70 text-2xl transition-all duration-200 leading-none">
              ›
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
});
