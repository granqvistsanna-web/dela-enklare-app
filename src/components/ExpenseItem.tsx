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

export function ExpenseItem({ expense, members, index, onEdit, onDelete, currentUserId }: ExpenseItemProps) {
  const payer = members.find((u) => u.user_id === expense.paid_by);
  const category = DEFAULT_CATEGORIES.find((c) => c.id === expense.category);
  const canModify = currentUserId === expense.paid_by;

  const formattedDate = new Date(expense.date).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="group flex items-center justify-between py-3 px-2 -mx-2 rounded-md hover:bg-secondary transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-lg shrink-0">{category?.icon || "📦"}</span>
        <div className="min-w-0">
          <p className="text-sm text-foreground truncate">{expense.description || "Utgift"}</p>
          <p className="text-xs text-muted-foreground">
            {payer?.name || "Okänd"} · {formattedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground">
          {expense.amount.toLocaleString("sv-SE")} kr
        </span>

        {canModify && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(expense)}>
                  Redigera
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(expense.id)}
                  className="text-destructive focus:text-destructive"
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
