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

  // Calculate total and per-person share
  const totalShared = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const perPerson = totalShared / members.length;

  // Add what each person paid
  expenses.forEach((expense) => {
    if (balances[expense.paid_by] !== undefined) {
      balances[expense.paid_by] += expense.amount;
    }
  });

  // Calculate net balance (paid - fair share)
  return members.map((member) => ({
    userId: member.user_id,
    balance: balances[member.user_id] - perPerson,
  }));
}
