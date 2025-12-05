import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Expense } from '../types';
import { getCategoryColor } from '../utils';

interface ChartsProps {
  expenses: Expense[];
}

export const ExpensesPieChart: React.FC<ChartsProps> = ({ expenses }) => {
  const data = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Render a placeholder of the exact same dimensions to prevent layout shifts
  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full min-w-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <div className="p-3 bg-slate-100 rounded-full mb-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
        </div>
        <span className="text-sm font-medium">No expenses to analyze yet</span>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `₹${value.toFixed(2)}`}
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 
              padding: '12px 16px',
              fontFamily: 'Inter, sans-serif'
            }}
            itemStyle={{ color: '#1e293b', fontWeight: 600 }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} 
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WeeklyTrendChart: React.FC<ChartsProps> = ({ expenses }) => {
  const data = React.useMemo(() => {
    // Group by last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayTotal = expenses
        .filter(e => e.date.startsWith(dateStr))
        .reduce((sum, e) => sum + e.amount, 0);
        
      days.push({ name: dayName, amount: dayTotal });
    }
    return days;
  }, [expenses]);

  const hasData = data.some(d => d.amount > 0);

  if (!hasData) {
     return (
      <div className="h-[300px] w-full min-w-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <div className="p-3 bg-slate-100 rounded-full mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
        </div>
        <span className="text-sm font-medium">No activity this week</span>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#64748b', fontSize: 11}} 
            tickFormatter={(val) => `₹${val}`} 
          />
          <Tooltip 
            cursor={{fill: '#f8fafc', radius: 8}}
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
              padding: '12px 16px' 
            }}
            formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Spent']}
            labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
            itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
          />
          <Bar 
            dataKey="amount" 
            fill="url(#colorGradient)" 
            radius={[6, 6, 0, 0]} 
            barSize={32} 
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};