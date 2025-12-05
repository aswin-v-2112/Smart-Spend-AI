import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExpenseProvider, useExpenses } from './contexts/ExpenseContext';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { SmartAssistant } from './components/SmartAssistant';
import { Button, Input, Modal, Select } from './components/UI';
import { ViewState, Expense, ExpenseCategory } from './types';
import { parseExpenseNaturalLanguage, parseExpenseImage } from './services/geminiService';
import { LayoutDashboard, Receipt, Bot, LogOut, Wallet, Sparkles, PlusCircle, Camera, Upload, ScanLine, Edit3, ArrowRight } from 'lucide-react';

// --- Auth Screen ---
const AuthScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await login(email, isLogin ? 'User' : name);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Side - Visual */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-indigo-600 p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
             </svg>
          </div>
          <div className="z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet size={28} />
              </div>
              <span className="text-2xl font-bold tracking-tight">SpendSmart</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Master your money with AI power.
            </h1>
            <p className="text-indigo-200 text-lg">
              Track expenses, scan receipts, and get intelligent insights in seconds.
            </p>
          </div>
          <div className="text-xs text-indigo-300 z-10">
            © {new Date().getFullYear()} SpendSmart AI
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-2 mb-8 text-indigo-600">
            <Wallet size={32} />
            <h1 className="text-2xl font-bold tracking-tight">SpendSmart</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p className="text-slate-500 mb-8">
            {isLogin ? 'Enter your email to sign in to your dashboard.' : 'Get started with your free account today.'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <Input 
                label="Full Name" 
                placeholder="John Doe" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="bg-slate-50 border-slate-200"
              />
            )}
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="bg-slate-50 border-slate-200"
            />
            <Button type="submit" className="w-full py-3" size="lg" isLoading={isLoading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">{isLogin ? "New here? " : "Already joined? "}</span>
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Layout ---
const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { addExpense, updateExpense } = useExpenses();
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [addMode, setAddMode] = useState<'smart' | 'manual'>('smart');
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(ExpenseCategory.FOOD);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReceiptProcessing, setIsReceiptProcessing] = useState(false);

  const openAddModal = () => {
    setEditingExpense(null);
    setAmount('');
    setCategory(ExpenseCategory.FOOD);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setAiPrompt('');
    setAddMode('smart'); // Default to smart mode
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(expense.date);
    setDescription(expense.description);
    setAddMode('manual'); // Force manual for edit
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const expenseData = {
      amount: parseFloat(amount),
      category,
      date,
      description
    };

    if (editingExpense) {
      await updateExpense(editingExpense.id, expenseData);
    } else {
      await addExpense(expenseData);
    }
    setIsModalOpen(false);
  };

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiProcessing(true);
    const result = await parseExpenseNaturalLanguage(aiPrompt);
    setIsAiProcessing(false);

    if (result) {
      if (result.amount) setAmount(result.amount.toString());
      if (result.category) setCategory(result.category);
      if (result.date) setDate(result.date);
      if (result.description) setDescription(result.description);
      setAddMode('manual'); // Switch to manual to review
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReceiptProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        const result = await parseExpenseImage(base64String, mimeType);
        
        if (result) {
          if (result.amount) setAmount(result.amount.toString());
          if (result.category) setCategory(result.category);
          if (result.date) setDate(result.date);
          if (result.description) setDescription(result.description);
          setAddMode('manual'); // Switch to review
        }
        setIsReceiptProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing receipt:", error);
      setIsReceiptProcessing(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 hidden md:flex flex-col fixed h-full z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="p-8 flex items-center gap-3 text-indigo-600">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
             <Wallet size={26} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-800">SpendSmart</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavItem 
            icon={<Receipt size={20} />} 
            label="Expenses" 
            active={view === 'expenses'} 
            onClick={() => setView('expenses')} 
          />
          <NavItem 
            icon={<Bot size={20} />} 
            label="AI Assistant" 
            active={view === 'assistant'} 
            onClick={() => setView('assistant')} 
          />
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 rounded-lg transition-colors group"
          >
            <LogOut size={18} className="group-hover:text-red-600 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2 text-indigo-600">
            <Wallet size={24} />
            <span className="font-bold text-lg text-slate-900">SpendSmart</span>
         </div>
         <button onClick={logout} className="p-2 text-slate-500 hover:text-red-600 transition-colors"><LogOut size={20}/></button>
      </div>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-30 flex justify-around p-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <MobileNavItem icon={<LayoutDashboard size={24} />} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <MobileNavItem icon={<Receipt size={24} />} active={view === 'expenses'} onClick={() => setView('expenses')} />
          <MobileNavItem icon={<Bot size={24} />} active={view === 'assistant'} onClick={() => setView('assistant')} />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-10 pt-20 md:pt-10 pb-24 md:pb-10 max-w-7xl mx-auto w-full transition-all">
        {view === 'dashboard' && <Dashboard onAddExpense={openAddModal} />}
        {view === 'expenses' && <ExpenseList onEdit={openEditModal} />}
        {view === 'assistant' && <SmartAssistant />}
      </main>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingExpense ? 'Edit Expense Details' : 'Add New Expense'}
        maxWidth="max-w-xl"
      >
        <div className="flex flex-col h-full">
          {/* Tabs for Smart/Manual */}
          {!editingExpense && (
            <div className="flex p-1 mx-6 mt-4 bg-slate-100 rounded-xl">
              <button 
                onClick={() => setAddMode('smart')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${addMode === 'smart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Sparkles size={16} /> Smart Add
              </button>
              <button 
                onClick={() => setAddMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${addMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Edit3 size={16} /> Manual Entry
              </button>
            </div>
          )}

          <div className="p-6">
            {addMode === 'smart' && !editingExpense ? (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                {/* Camera Section */}
                <div 
                  className="relative group cursor-pointer border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                   <input 
                     type="file" 
                     accept="image/*" 
                     capture="environment"
                     className="hidden" 
                     ref={fileInputRef}
                     onChange={handleFileChange}
                   />
                   
                   {isReceiptProcessing ? (
                     <div className="flex flex-col items-center gap-3">
                       <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-indigo-600 font-medium">Analyzing receipt...</p>
                     </div>
                   ) : (
                     <>
                       <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 text-indigo-500">
                         <Camera size={32} />
                       </div>
                       <h3 className="text-lg font-semibold text-indigo-900">Scan Receipt</h3>
                       <p className="text-sm text-indigo-500 mt-1 max-w-[200px]">Take a photo or upload a receipt to autofill details</p>
                     </>
                   )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-xs text-slate-400 font-medium uppercase">Or type it out</span>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                {/* Text AI Section */}
                <div className="space-y-3">
                  <div className="relative">
                    <Sparkles size={18} className="absolute left-4 top-3.5 text-indigo-400" />
                    <input 
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                      placeholder="E.g., Dinner at Italian Place for ₹2500"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAiParse()}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleAiParse} 
                    isLoading={isAiProcessing} 
                    disabled={!aiPrompt}
                    variant="secondary"
                  >
                    Generate Details <ArrowRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Manual Form */
              <form onSubmit={handleSave} className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                {/* Amount and Category Row */}
                <div className="grid grid-cols-2 gap-5">
                  <Input 
                    label="Amount (₹)" 
                    type="number" 
                    step="0.01" 
                    required 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="bg-white text-lg font-semibold"
                    placeholder="0.00"
                    autoFocus={!editingExpense}
                  />
                  <Select 
                    label="Category" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    options={Object.values(ExpenseCategory).map(c => ({ value: c, label: c }))}
                    className="bg-white"
                  />
                </div>
                
                <Input 
                  label="Description" 
                  required 
                  placeholder="What was this for?"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="bg-white"
                />

                <Input 
                  label="Date" 
                  type="date" 
                  required 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="bg-white"
                />

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-50 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="px-8 shadow-lg shadow-indigo-200">
                    {editingExpense ? 'Save Changes' : 'Add Expense'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Nav Helper Components ---
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-medium' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
    }`}
  >
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span>{label}</span>
  </button>
);

const MobileNavItem: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-2xl transition-all duration-200 ${
      active 
        ? 'text-indigo-600 bg-indigo-50 scale-105' 
        : 'text-slate-400 active:scale-95'
    }`}
  >
    {icon}
  </button>
);

// --- Root App ---
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
};

const AuthConsumer: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Wallet size={20} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-slate-400 font-medium tracking-wide text-sm uppercase">Loading SpendSmart...</p>
        </div>
      </div>
    );
  }

  return user ? (
    <ExpenseProvider>
      <AppLayout />
    </ExpenseProvider>
  ) : (
    <AuthScreen />
  );
};

export default App;