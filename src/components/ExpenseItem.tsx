import { Expense } from "@/hooks/useExpenses";
import { GroupMember } from "@/hooks/useGroups";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExpenseItemProps {
  expense: Expense;
  members: GroupMember[];
  index: number;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  currentUserId?: string;
}

export function ExpenseItem({ expense, members, onEdit, onDelete, currentUserId }: ExpenseItemProps) {
  const payer = members.find((u) => u.user_id === expense.paid_by);
  const category = DEFAULT_CATEGORIES.find((c) => c.id === expense.category);
  const canModify = currentUserId === expense.paid_by;

  const formattedDate = new Date(expense.date).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });

  const hasCustomSplit = expense.splits && Object.keys(expense.splits).length > 0;

  return (
    <div className="group flex items-center justify-between py-4 px-6 hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 shrink-0">
          <span className="text-lg">{category?.icon || "📦"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{expense.description || "Utgift"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {payer?.name || "Okänd"} · {formattedDate}
            {hasCustomSplit && <span className="ml-1 text-primary">· Anpassad delning</span>}
          </p>
          {hasCustomSplit && (
            <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-3">
              {Object.entries(expense.splits!).map(([userId, amount]) => {
                const member = members.find((m) => m.user_id === userId);
                return (
                  <span key={userId} className="whitespace-nowrap">
                    {member?.name || "Okänd"}: {amount.toLocaleString("sv-SE")} kr
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {expense.amount.toLocaleString("sv-SE")} kr
        </span>

        {canModify && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              >
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(expense)} className="text-sm">
                  Redigera
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(expense.id)}
                  className="text-sm text-destructive focus:text-destructive"
                >
                  Ta bort
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
