import { memo, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Income } from "@/hooks/useIncomes";
import { GroupMember } from "@/hooks/useGroups";
import { getIncomeTypeIcon, getIncomeTypeLabel } from "@/lib/incomeUtils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const canModify = currentUserId === income.recipient;
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

      {/* Main content - draggable on mobile */}
      <motion.div
        drag={canModify && onDelete ? "x" : false}
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        className="group flex items-center justify-between py-4 px-4 sm:px-6 hover:bg-secondary/30 transition-colors bg-background"
      >
      <div
        className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 cursor-pointer"
        onClick={() => canModify && onEdit?.(income)}
      >
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
            {income.repeat === "monthly" && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/10 rounded text-primary">
                Månadsvis
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {recipient?.name || "Okänd"} · {formattedDate}
          </p>
          {income.note && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {income.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="text-sm font-semibold text-green-600 tabular-nums">
          +{amountKr.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
        </span>

        {canModify && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 sm:h-9 sm:w-9 text-foreground hover:bg-secondary text-xl sm:text-base"
              >
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {onEdit && (
                <DropdownMenuItem
                  onClick={() => onEdit(income)}
                  className="text-sm py-3 sm:py-2"
                >
                  Redigera
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(income.id)}
                  className="text-sm py-3 sm:py-2 text-destructive focus:text-destructive"
                >
                  Ta bort
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      </motion.div>
    </div>
  );
});
