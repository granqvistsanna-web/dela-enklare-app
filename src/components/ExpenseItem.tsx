import { motion } from "framer-motion";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
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
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="group flex items-center gap-4 rounded-xl bg-card border border-border p-4 hover:shadow-md transition-all duration-200"
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shrink-0"
        style={{ backgroundColor: `${category?.color}20` }}
      >
        {category?.icon || "📦"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{expense.description || "Utgift"}</p>
        <p className="text-sm text-muted-foreground">
          {payer?.name || "Okänd"} betalade • {formattedDate}
        </p>
      </div>

      <div className="text-right mr-2">
        <p className="font-semibold text-foreground">
          {expense.amount.toLocaleString("sv-SE")} kr
        </p>
        <p className="text-xs text-muted-foreground">{category?.name}</p>
      </div>

      {canModify && (onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Pencil size={14} className="mr-2" />
                Redigera
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(expense.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Ta bort
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.div>
  );
}
