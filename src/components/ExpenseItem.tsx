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

  // Safe date parsing with fallback
  let formattedDate = "Ogiltigt datum";
  try {
    const date = new Date(expense.date);
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "short",
      });
    }
  } catch (error) {
    console.warn("Invalid date for expense:", expense.id, expense.date);
  }

  const hasCustomSplit = expense.splits && Object.keys(expense.splits).length > 0;

  // Validate expense amount
  const safeAmount = Number.isFinite(expense.amount) && expense.amount >= 0
    ? expense.amount
    : 0;

  return (
    <div className="group flex items-center justify-between py-4 px-4 sm:px-6 hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div className="flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 rounded-lg bg-muted/50 shrink-0">
          <span className="text-lg">{category?.icon || "📦"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{expense.description || "Utgift"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {payer?.name || "Okänd"} · {formattedDate}
            {hasCustomSplit && <span className="ml-1 text-primary">· Anpassad delning</span>}
          </p>
          {hasCustomSplit && (
            <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              {Object.entries(expense.splits!).map(([userId, amount]) => {
                const member = members.find((m) => m.user_id === userId);
                const safeSplitAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
                return (
                  <span key={userId} className="whitespace-nowrap">
                    {member?.name || "Okänd"}: {safeSplitAmount.toLocaleString("sv-SE")} kr
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {safeAmount.toLocaleString("sv-SE")} kr
        </span>

        {canModify && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              >
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(expense)} className="text-sm py-3 sm:py-2">
                  Redigera
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(expense.id)}
                  className="text-sm py-3 sm:py-2 text-destructive focus:text-destructive"
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
