import { GroupMember } from "@/hooks/useGroups";
import { Expense } from "@/hooks/useExpenses";
import { Settlement } from "@/hooks/useSettlements";
import { Income } from "@/hooks/useIncomes";

export interface Balance {
  userId: string;
  balance: number;
}

/**
 * Calculate the total balance including:
 * 1. Expenses - split equally among members
 * 2. Incomes - split equally among members (only included_in_split)
 * 3. Settlements - payments between members
 * 
 * Balance logic:
 * - Positive balance = this person has paid/earned more than their share (is owed money)
 * - Negative balance = this person has paid/earned less than their share (owes money)
 */
export function calculateBalance(
  expenses: Expense[],
  members: GroupMember[],
  settlements: Settlement[] = [],
  incomes: Income[] = []
): Balance[] {
  const balances: Record<string, number> = {};

  // Initialize balances for all members
  members.forEach((member) => {
    balances[member.user_id] = 0;
  });

  if (members.length === 0) return [];

  // ===== PROCESS EXPENSES =====
  expenses.forEach((expense) => {
    if (!expense.amount || expense.amount <= 0 || !Number.isFinite(expense.amount)) {
      console.warn(`Invalid expense amount: ${expense.amount}, skipping expense ${expense.id}`);
      return;
    }

    // Credit the person who paid
    if (balances[expense.paid_by] !== undefined) {
      balances[expense.paid_by] += expense.amount;
    } else {
      console.warn(`Expense ${expense.id} paid by user ${expense.paid_by} who is not in group`);
    }

    // Debit based on splits
    if (expense.splits) {
      Object.entries(expense.splits).forEach(([userId, amount]) => {
        if (balances[userId] !== undefined && Number.isFinite(amount)) {
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

  // ===== PROCESS INCOMES (50/50 split) =====
  // Only incomes marked as included_in_split
  const includedIncomes = incomes.filter((i) => i.included_in_split);
  
  includedIncomes.forEach((income) => {
    // Income amount is stored in öre (cents), convert to kr
    const amountKr = income.amount / 100;
    
    if (!amountKr || amountKr <= 0 || !Number.isFinite(amountKr)) {
      return;
    }

    // The person who received income "owes" their share to others
    // Credit the recipient (they have this money)
    if (balances[income.recipient] !== undefined) {
      balances[income.recipient] += amountKr;
    }

    // Debit everyone equally (everyone's share of this income)
    const perPerson = amountKr / members.length;
    members.forEach((member) => {
      balances[member.user_id] -= perPerson;
    });
  });

  // ===== PROCESS SETTLEMENTS (Swish payments) =====
  settlements.forEach((settlement) => {
    if (!settlement.amount || settlement.amount <= 0 || !Number.isFinite(settlement.amount)) {
      console.warn(`Invalid settlement amount: ${settlement.amount}, skipping settlement ${settlement.id}`);
      return;
    }

    // The person who sent money (from_user) gets credited (they paid their debt)
    if (balances[settlement.from_user] !== undefined) {
      balances[settlement.from_user] += settlement.amount;
    }

    // The person who received money (to_user) gets debited (they received payment)
    if (balances[settlement.to_user] !== undefined) {
      balances[settlement.to_user] -= settlement.amount;
    }
  });

  return members.map((member) => ({
    userId: member.user_id,
    balance: balances[member.user_id],
  }));
}
