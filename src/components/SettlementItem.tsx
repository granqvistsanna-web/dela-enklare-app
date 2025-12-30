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
      whileHover={canEdit ? { x: 3, backgroundColor: "hsl(var(--secondary) / 0.4)" } : undefined}
      whileTap={canEdit ? { scale: 0.985 } : undefined}
      className={`py-4 px-0 min-h-[72px] bg-background transition-all duration-200 touch-pan-y rounded-md ${
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
      <div className="flex items-center gap-3.5">
        <motion.div
          className="p-2 rounded-lg bg-primary/10 shrink-0 ring-1 ring-primary/10"
          whileHover={canEdit ? { scale: 1.05 } : undefined}
        >
          <Smartphone size={18} className="text-primary pointer-events-none" strokeWidth={2.5} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-[15px] truncate leading-tight">
              Swish
            </p>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
              Betalning
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <span className="font-semibold text-foreground/70 truncate">
              {fromMember?.name || "Okänd"} → {toMember?.name || "Okänd"}
            </span>
            <span className="opacity-50">•</span>
            <span className="shrink-0">
              {new Date(settlement.date).toLocaleDateString("sv-SE", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
        <div className="text-right flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-lg sm:text-xl font-bold text-primary tabular-nums block leading-tight">
              {Math.round(settlement.amount).toLocaleString("sv-SE")}
            </span>
            <span className="text-[11px] text-muted-foreground/70 font-medium">kr</span>
          </div>
          {canEdit && (
            <span className="text-muted-foreground/30 group-hover:text-muted-foreground/70 text-2xl transition-all duration-200 leading-none">
              ›
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
