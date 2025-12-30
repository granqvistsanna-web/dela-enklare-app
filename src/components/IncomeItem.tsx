import { memo, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Repeat } from "lucide-react";
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
              {getIncomeTypeLabel(income.type)}
            </p>
            {!income.included_in_split && (
              <span className="text-[11px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground shrink-0">
                Ej delad
              </span>
            )}
            {income.repeat && income.repeat !== "none" && (
              <Repeat size={12} className="text-primary shrink-0" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-0.5">
            <span>{recipient?.name || "Okänd"}</span>
            <span className="opacity-40">•</span>
            <span>{formattedDate}</span>
          </div>
          {income.note && (
            <p className="text-[13px] text-muted-foreground/60 mt-0.5 truncate">
              {income.note}
            </p>
          )}
        </div>

        {/* Amount */}
        <span className="text-[15px] font-semibold text-income tabular-nums shrink-0">
          +{amountKr.toLocaleString("sv-SE", { minimumFractionDigits: 0 })} kr
        </span>
      </motion.button>
    </div>
  );
});
