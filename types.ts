export interface User {
  id: string;
  name: string;
  email: string;
}

export enum ExpenseCategory {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  HOUSING = 'Housing',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  UTILITIES = 'Utilities',
  HEALTH = 'Health',
  OTHER = 'Other'
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory | string;
  date: string; // ISO Date string
  description: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export type ViewState = 'dashboard' | 'expenses' | 'analytics' | 'assistant';