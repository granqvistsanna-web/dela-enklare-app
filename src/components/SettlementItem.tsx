import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
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
  index = 0,
  onEdit,
  currentUserId,
}: SettlementItemProps) {
  const fromMember = members.find((m) => m.user_id === settlement.from_user);
  const toMember = members.find((m) => m.user_id === settlement.to_user);
  const canEdit = !!currentUserId;

  return (
    <motion.div
      whileHover={canEdit ? { x: 2, backgroundColor: "hsl(var(--secondary) / 0.3)" } : undefined}
      whileTap={canEdit ? { scale: 0.99 } : undefined}
      className={`py-3.5 px-0 min-h-[68px] bg-background transition-all duration-150 touch-pan-y ${
        canEdit
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          : "cursor-default"
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={() => canEdit && onEdit(settlement)}
      tabIndex={canEdit ? 0 : -1}
      onKeyDown={(e) => {
        if (canEdit && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onEdit(settlement);
        }
      }}
      role={canEdit ? "button" : undefined}
      aria-label={
        canEdit
          ? `Redigera Swish från ${fromMember?.name || "Okänd"} till ${toMember?.name || "Okänd"}`
          : undefined
      }
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="p-1.5 rounded-md bg-primary/10 shrink-0"
          whileHover={canEdit ? { scale: 1.05 } : undefined}
        >
          <Smartphone size={16} className="text-primary pointer-events-none" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground text-sm truncate">
              Swish
            </p>
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">
              Betalning
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80 truncate">
              {fromMember?.name || "Okänd"} → {toMember?.name || "Okänd"}
            </span>
            <span>·</span>
            <span className="shrink-0">
              {new Date(settlement.date).toLocaleDateString("sv-SE", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
        <div className="text-right flex items-center gap-2.5 shrink-0">
          <div className="text-right">
            <span className="text-base sm:text-lg font-semibold text-primary tabular-nums block">
              {Math.round(settlement.amount).toLocaleString("sv-SE")}
            </span>
            <span className="text-xs text-muted-foreground">kr</span>
          </div>
          {canEdit && (
            <span className="text-muted-foreground/40 group-hover:text-muted-foreground text-xl transition-all duration-150">
              ›
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
