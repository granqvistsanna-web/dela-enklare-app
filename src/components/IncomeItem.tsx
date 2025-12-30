import { memo, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ArrowDownLeft, Repeat, ChevronRight } from "lucide-react";
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
  const canModify = !!currentUserId;
  const [dragX, setDragX] = useState(0);

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

  const safeAmount = Number.isFinite(income.amount) && income.amount >= 0 ? income.amount : 0;
  const amountKr = safeAmount / 100;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100 && canModify && onDelete) {
      onDelete(income.id);
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
        onClick={() => canModify && onEdit?.(income)}
        className={`
          w-full text-left appearance-none border-0
          flex items-center gap-3 py-3.5 sm:py-4 px-1 sm:px-2
          bg-transparent transition-colors duration-150
          ${canModify && onEdit ? "cursor-pointer active:bg-muted/50 focus:outline-none focus-visible:bg-muted/50" : ""}
        `}
        whileTap={canModify ? { scale: 0.995 } : undefined}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-income/10 flex items-center justify-center shrink-0">
          <ArrowDownLeft size={18} className="text-income" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-medium text-foreground truncate">
              {getIncomeTypeLabel(income.type)}
            </p>
            {!income.included_in_split && (
              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground font-medium shrink-0">
                Ej delad
              </span>
            )}
            {income.repeat && income.repeat !== "none" && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-full text-primary font-medium shrink-0">
                <Repeat size={10} strokeWidth={2.5} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span className="font-medium">{recipient?.name || "Okänd"}</span>
            <span className="opacity-40">•</span>
            <span>{formattedDate}</span>
          </div>
          {income.note && (
            <p className="text-xs text-muted-foreground/70 mt-1 truncate">
              {income.note}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-base font-semibold text-income tabular-nums">
              +{amountKr.toLocaleString("sv-SE", { minimumFractionDigits: 0 })}
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
