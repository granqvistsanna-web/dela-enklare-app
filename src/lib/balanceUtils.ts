import { GroupMember } from "@/hooks/useGroups";
import { Expense } from "@/hooks/useExpenses";

export interface Balance {
  userId: string;
  balance: number;
}

export function calculateBalance(
  expenses: Expense[],
  members: GroupMember[]
): Balance[] {
  const balances: Record<string, number> = {};

  // Initialize balances for all members
  members.forEach((member) => {
    balances[member.user_id] = 0;
  });

  if (members.length === 0) return [];

  // Process each expense
  expenses.forEach((expense) => {
    // Credit the person who paid
    if (balances[expense.paid_by] !== undefined) {
      balances[expense.paid_by] += expense.amount;
    }

    // Debit based on splits
    if (expense.splits) {
      // Custom splits specified
      Object.entries(expense.splits).forEach(([userId, amount]) => {
        if (balances[userId] !== undefined) {
          balances[userId] -= amount;
        }
      });
    } else {
      // Default to equal split among all members
      const perPerson = expense.amount / members.length;
      members.forEach((member) => {
        balances[member.user_id] -= perPerson;
      });
    }
  });

  // Return balances
  return members.map((member) => ({
    userId: member.user_id,
    balance: balances[member.user_id],
  }));
}
