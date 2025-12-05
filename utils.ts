import { Expense, ExpenseCategory } from "./types";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    [ExpenseCategory.FOOD]: '#ef4444', // Red
    [ExpenseCategory.TRANSPORT]: '#f97316', // Orange
    [ExpenseCategory.HOUSING]: '#3b82f6', // Blue
    [ExpenseCategory.ENTERTAINMENT]: '#8b5cf6', // Violet
    [ExpenseCategory.SHOPPING]: '#ec4899', // Pink
    [ExpenseCategory.UTILITIES]: '#eab308', // Yellow
    [ExpenseCategory.HEALTH]: '#10b981', // Emerald
    [ExpenseCategory.OTHER]: '#64748b', // Slate
  };
  return colors[category] || '#64748b';
};

// Mock delay to simulate network request
export const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));