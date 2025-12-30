import { motion } from "framer-motion";
import { ArrowRightLeft, ChevronRight } from "lucide-react";
import { Settlement } from "@/hooks/useSettlements";
import { GroupMember } from "@/hooks/useGroups";

interface SettlementItemProps {
  settlement: Settlement;
  members: GroupMember[];
  index?: number;
  onEdit: (settlement: Settlement) => void;
  currentUserId?: string;
}

export function SettlementItem({
  settlement,
  members,
  onEdit,
  currentUserId,
}: SettlementItemProps) {
  const fromMember = members.find((m) => m.user_id === settlement.from_user);
  const toMember = members.find((m) => m.user_id === settlement.to_user);
  const canEdit = !!currentUserId;

  const formattedDate = new Date(settlement.date).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });

  return (
    <motion.button
      type="button"
      whileTap={canEdit ? { scale: 0.995 } : undefined}
      className={`
        group w-full text-left appearance-none border-0
        flex items-center gap-3 py-3.5 sm:py-4 px-1 sm:px-2
        bg-transparent transition-colors duration-150 touch-pan-y
        ${canEdit ? "cursor-pointer active:bg-muted/50 focus:outline-none focus-visible:bg-muted/50" : "cursor-default"}
      `}
      onClick={() => canEdit && onEdit(settlement)}
      tabIndex={canEdit ? 0 : -1}
      onKeyDown={(e) => {
        if (canEdit && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onEdit(settlement);
        }
      }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <ArrowRightLeft size={18} className="text-primary" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-medium text-foreground truncate">
            Swish
          </p>
          <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-full text-primary font-medium shrink-0">
            Betalning
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          <span className="font-medium">{fromMember?.name || "Okänd"}</span>
          <span className="opacity-60">→</span>
          <span className="font-medium">{toMember?.name || "Okänd"}</span>
          <span className="opacity-40">•</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <span className="text-base font-semibold text-primary tabular-nums">
            {Math.round(settlement.amount).toLocaleString("sv-SE")}
          </span>
          <span className="text-xs text-muted-foreground ml-1">kr</span>
        </div>
        {canEdit && (
          <ChevronRight 
            size={16} 
            className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" 
          />
        )}
      </div>
    </motion.button>
  );
}
