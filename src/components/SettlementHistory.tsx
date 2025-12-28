import { Settlement } from "@/hooks/useSettlements";
import { GroupMember } from "@/hooks/useGroups";

interface SettlementHistoryProps {
  settlements: Settlement[];
  members: GroupMember[];
}

export function SettlementHistory({ settlements, members }: SettlementHistoryProps) {
  if (settlements.length === 0) {
    return (
      <p className="text-muted-foreground py-8">
        Ingen historik ännu.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {settlements.map((settlement) => {
        const fromUser = members.find((u) => u.user_id === settlement.from_user);
        const toUser = members.find((u) => u.user_id === settlement.to_user);

        return (
          <div
            key={settlement.id}
            className="flex items-center justify-between py-3 px-2 -mx-2 rounded-md hover:bg-secondary transition-colors"
          >
            <div>
              <p className="text-sm text-foreground">
                {fromUser?.name || "Okänd"} → {toUser?.name || "Okänd"}
              </p>
              <p className="text-xs text-muted-foreground">{settlement.month}</p>
            </div>
            <span className="text-sm text-foreground">
              {settlement.amount.toLocaleString("sv-SE")} kr
            </span>
          </div>
        );
      })}
    </div>
  );
}
