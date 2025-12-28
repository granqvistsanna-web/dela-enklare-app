import { Group, Expense, Settlement, User } from './types';

export const mockUsers: User[] = [
  { id: 'erik', name: 'Erik', email: 'erik@example.com' },
  { id: 'anna', name: 'Anna', email: 'anna@example.com' },
];

export const mockGroups: Group[] = [
  {
    id: 'hushalll',
    name: 'Hushåll',
    isTemporary: false,
    createdAt: '2024-01-01',
    members: ['erik', 'anna'],
  },
  {
    id: 'kreta',
    name: 'Semester Kreta',
    isTemporary: true,
    createdAt: '2024-11-15',
    members: ['erik', 'anna'],
  },
];

export const mockExpenses: Expense[] = [
  {
    id: '1',
    groupId: 'hushalll',
    amount: 1250,
    paidBy: 'anna',
    category: 'mat',
    description: 'ICA Maxi veckoinköp',
    date: '2024-12-20',
    createdAt: '2024-12-20T10:30:00',
  },
  {
    id: '2',
    groupId: 'hushalll',
    amount: 890,
    paidBy: 'erik',
    category: 'mat',
    description: 'Hemköp',
    date: '2024-12-18',
    createdAt: '2024-12-18T15:45:00',
  },
  {
    id: '3',
    groupId: 'hushalll',
    amount: 4500,
    paidBy: 'anna',
    category: 'boende',
    description: 'El och värme december',
    date: '2024-12-15',
    createdAt: '2024-12-15T09:00:00',
  },
  {
    id: '4',
    groupId: 'hushalll',
    amount: 350,
    paidBy: 'erik',
    category: 'noje',
    description: 'Netflix + Spotify',
    date: '2024-12-10',
    createdAt: '2024-12-10T12:00:00',
  },
  {
    id: '5',
    groupId: 'kreta',
    amount: 12500,
    paidBy: 'anna',
    category: 'boende',
    description: 'Hotell 5 nätter',
    date: '2024-11-20',
    createdAt: '2024-11-20T14:00:00',
  },
  {
    id: '6',
    groupId: 'kreta',
    amount: 3200,
    paidBy: 'erik',
    category: 'transport',
    description: 'Hyrbil',
    date: '2024-11-21',
    createdAt: '2024-11-21T10:00:00',
  },
];

export const mockSettlements: Settlement[] = [
  {
    id: 's1',
    groupId: 'hushalll',
    fromUser: 'erik',
    toUser: 'anna',
    amount: 1850,
    date: '2024-11-30',
    month: 'November 2024',
  },
  {
    id: 's2',
    groupId: 'hushalll',
    fromUser: 'anna',
    toUser: 'erik',
    amount: 420,
    date: '2024-10-31',
    month: 'Oktober 2024',
  },
];

export function calculateBalance(expenses: Expense[], users: User[]): { userId: string; balance: number }[] {
  const balances: Record<string, number> = {};
  
  users.forEach(user => {
    balances[user.id] = 0;
  });

  const totalShared = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const perPerson = totalShared / users.length;

  expenses.forEach(expense => {
    balances[expense.paidBy] += expense.amount;
  });

  return users.map(user => ({
    userId: user.id,
    balance: balances[user.id] - perPerson,
  }));
}
