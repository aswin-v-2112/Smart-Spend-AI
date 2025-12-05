import React from 'react';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from './UI';
import { ExpensesPieChart, WeeklyTrendChart } from './Charts';
import { formatCurrency, formatDate } from '../utils';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Calendar, Plus, CreditCard, PieChart as PieIcon } from 'lucide-react';

export const Dashboard: React.FC<{ onAddExpense: () => void }> = ({ onAddExpense }) => {
  const { user } = useAuth();
  const { expenses } = useExpenses();

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const currentMonth = new Date().getMonth();
  const monthlySpent = expenses
    .filter(e => new Date(e.date).getMonth() === currentMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Hello, {user?.name.split(' ')[0]} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-500 mt-1">Here's your financial pulse for today.</p>
        </div>
        <Button onClick={onAddExpense} className="shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5">
          <Plus size={18} /> Add New Expense
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 ring-1 ring-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                <Wallet size={20} className="text-white" />
              </div>
              <span className="font-medium text-indigo-100">Total Spending</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-2">{formatCurrency(totalSpent)}</h2>
            <div className="flex items-center gap-2 text-sm text-indigo-200 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
              <ArrowUpRight size={14} />
              <span>Lifetime Record</span>
            </div>
          </div>
        </div>

        {/* Monthly Card */}
        <Card className="border-none shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <Calendar size={22} className="text-emerald-600" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">This Month</span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Monthly Budget</p>
              <h2 className="text-3xl font-bold text-slate-800">{formatCurrency(monthlySpent)}</h2>
            </div>
          </div>
        </Card>

        {/* Transactions Card */}
        <Card className="border-none shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <CreditCard size={22} className="text-orange-600" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-1 rounded-md">Activity</span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Total Transactions</p>
              <h2 className="text-3xl font-bold text-slate-800">{expenses.length}</h2>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-100 shadow-lg shadow-gray-50/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-indigo-50 rounded-md">
              <PieIcon size={18} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Spending by Category</h3>
          </div>
          <ExpensesPieChart expenses={expenses} />
        </Card>
        <Card className="border-gray-100 shadow-lg shadow-gray-50/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-indigo-50 rounded-md">
              <TrendingUp size={18} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Weekly Trend</h3>
          </div>
          <WeeklyTrendChart expenses={expenses} />
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-gray-100 shadow-lg shadow-gray-50/50 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">View All</Button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-slate-400 text-xs uppercase tracking-wider bg-gray-50/50">
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentExpenses.map((expense) => (
                <tr key={expense.id} className="group hover:bg-indigo-50/30 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">{expense.description}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(expense.date)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatCurrency(expense.amount)}</td>
                </tr>
              ))}
              {recentExpenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-sm italic">
                    No expenses recorded yet. Start by adding one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};