import React, { createContext, useContext, useState, useEffect } from 'react';
import { Expense } from '../types';
import { useAuth } from './AuthContext';
import { simulateDelay, generateId } from '../utils';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load expenses when user changes
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      return;
    }

    const loadExpenses = () => {
      setIsLoading(true);
      const allExpensesStr = localStorage.getItem('sa_expenses');
      const allExpenses: Expense[] = allExpensesStr ? JSON.parse(allExpensesStr) : [];
      
      // Filter for current user
      const userExpenses = allExpenses.filter(e => e.userId === user.id);
      
      // Sort by date descending
      setExpenses(userExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setIsLoading(false);
    };

    loadExpenses();
  }, [user]);

  const saveToStorage = (newExpenses: Expense[]) => {
    // Get OTHER users' expenses to preserve them
    const allExpensesStr = localStorage.getItem('sa_expenses');
    const allExpenses: Expense[] = allExpensesStr ? JSON.parse(allExpensesStr) : [];
    const otherExpenses = allExpenses.filter(e => e.userId !== user?.id);
    
    // Combine and save
    const combined = [...otherExpenses, ...newExpenses];
    localStorage.setItem('sa_expenses', JSON.stringify(combined));
    setExpenses(newExpenses);
  };

  const addExpense = async (data: Omit<Expense, 'id' | 'userId'>) => {
    if (!user) return;
    setIsLoading(true);
    await simulateDelay(300);

    const newExpense: Expense = {
      ...data,
      id: generateId(),
      userId: user.id
    };

    const updated = [newExpense, ...expenses];
    saveToStorage(updated);
    setIsLoading(false);
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!user) return;
    setIsLoading(true);
    await simulateDelay(300);

    const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    saveToStorage(updated);
    setIsLoading(false);
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    await simulateDelay(300);

    const updated = expenses.filter(e => e.id !== id);
    saveToStorage(updated);
    setIsLoading(false);
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, updateExpense, deleteExpense, isLoading }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used within ExpenseProvider');
  return context;
};