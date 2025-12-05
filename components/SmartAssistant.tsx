import React, { useState, useRef, useEffect } from 'react';
import { useExpenses } from '../contexts/ExpenseContext';
import { generateAssistantResponse, ChatMessage } from '../services/geminiService';
import { Button, Input, Card } from './UI';
import { Send, Sparkles, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Expense } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isTool?: boolean;
}

export const SmartAssistant: React.FC = () => {
  const { expenses, addExpense } = useExpenses();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: "Hey there! 👋 I'm **SpendSmart**, your friendly financial buddy. \n\nI can help you track your cash flow, spot trends, or even **add expenses** for you! Try saying:\n* \"Add ₹500 for lunch\"\n* \"How much did I spend on food this month?\"\n\nWhat's on your mind? 🧞‍♂️✨" 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userText = query;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    try {
      // Prepare history for API (excluding the current new message which is passed separately)
      const apiHistory: ChatMessage[] = messages
        .filter(m => !m.isTool)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content
        }));

      const response = await generateAssistantResponse(apiHistory, expenses, userText);
      
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        // Handle Function Call
        const call = functionCalls[0];
        if (call.name === 'addExpense') {
          const args = call.args as any;
          
          await addExpense({
            amount: args.amount,
            category: args.category,
            description: args.description,
            date: args.date
          });

          // System confirmation message
          const toolMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `✅ I've added **₹${args.amount}** for **${args.description}** (${args.category}) to your expenses!`,
            isTool: true
          };
          setMessages(prev => [...prev, toolMsg]);
        }
      } else {
        // Handle Text Response
        const text = response.text || "I'm listening, but I didn't catch that. 🤔";
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: text };
        setMessages(prev => [...prev, aiMsg]);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Oops! My brain circuits got a little tangled. 🤯 Could you ask me that again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col p-0 overflow-hidden border-indigo-100 shadow-xl shadow-indigo-50/50">
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-50 flex items-center gap-3">
        <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600 ring-1 ring-indigo-50">
          <Sparkles size={20} className="animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-indigo-950">SpendSmart Companion</h3>
          <p className="text-xs text-indigo-500 font-medium">Always here to help! 🌟</p>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : msg.isTool 
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-tl-sm'
                  : 'bg-white border border-gray-100 text-slate-700 rounded-tl-sm'
            }`}>
              {msg.isTool && <div className="flex items-center gap-2 mb-1 text-emerald-600 font-bold text-xs uppercase tracking-wide"><CheckCircle size={12}/> Action Completed</div>}
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-indigo prose-p:my-1 prose-headings:my-2">
                   <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-50">
        <div className="flex gap-2 items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100 focus-within:border-indigo-200 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
          <input
            type="text"
            className="flex-1 px-4 py-2 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 font-medium"
            placeholder="Ask me anything or add an expense..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <Button 
            onClick={handleSend} 
            disabled={isTyping || !query.trim()} 
            className={`rounded-xl px-4 py-2 transition-all ${query.trim() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 hover:bg-gray-200 shadow-none'}`}
          >
            <Send size={18} className={query.trim() ? "translate-x-0.5" : ""} />
          </Button>
        </div>
      </div>
    </Card>
  );
};