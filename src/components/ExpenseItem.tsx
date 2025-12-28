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
    <div className="group flex items-center justify-between py-3 hover:bg-secondary -mx-3 px-3 rounded-md transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-base shrink-0">{category?.icon || "📦"}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground truncate">{expense.description || "Utgift"}</p>
          <p className="text-xs text-muted-foreground">
            {payer?.name || "Okänd"} · {formattedDate}
            {hasCustomSplit && <span className="ml-1 text-primary">· Anpassad delning</span>}
          </p>
          {hasCustomSplit && (
            <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-2">
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

      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground tabular-nums">
          {expense.amount.toLocaleString("sv-SE")} kr
        </span>

        {canModify && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
              >
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
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
