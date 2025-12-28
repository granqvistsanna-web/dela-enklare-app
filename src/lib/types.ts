export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type Expense = {
  id: string;
  groupId: string;
  amount: number;
  paidBy: string;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  splits?: { [userId: string]: number } | null;
};

export type Settlement = {
  id: string;
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  date: string;
  month: string;
};

export type Group = {
  id: string;
  name: string;
  isTemporary: boolean;
  createdAt: string;
  closedAt?: string;
  members: string[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'mat', name: 'Mat', icon: '🛒', color: 'hsl(155, 55%, 42%)' },
  { id: 'boende', name: 'Boende', icon: '🏠', color: 'hsl(220, 60%, 55%)' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: 'hsl(38, 92%, 50%)' },
  { id: 'noje', name: 'Nöje', icon: '🎬', color: 'hsl(280, 60%, 55%)' },
  { id: 'ovrigt', name: 'Övrigt', icon: '📦', color: 'hsl(0, 0%, 50%)' },
];
