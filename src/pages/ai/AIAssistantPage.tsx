import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, TrendingUp, AlertCircle, FileSearch } from 'lucide-react';
import { AICore } from '../../lib/claude';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: 'Namaste! Main VaahanBooks ka Smart AI Assistant hoon. Aap apni company ki sales, profit, gst ya pending payments ke baare mein kuch bhi natural language mein pooch sakte hain. Kaise help karun?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    // Call Claude AI logic
    const aiResponse = await AICore.executeNaturalLanguageQuery(userMsg);
    
    setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[85vh] animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-t-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 shadow-[0_0_15px_rgba(var(--brand-500),0.3)]">
             <Bot className="text-brand-400" />
           </div>
           <div>
             <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2">
               VaahanBooks AI <Sparkles size={16} className="text-yellow-400" />
             </h1>
             <p className="text-surface-400 mt-1 text-sm bg-surface-950 px-2 py-0.5 rounded border border-surface-800 inline-block font-mono">Powered by Claude 3 Haiku</p>
           </div>
        </div>
        
        {/* Suggestion Chips */}
        <div className="hidden md:flex gap-2">
          <button onClick={() => setInput("Pichle mahine ka profit")} className="flex items-center gap-1.5 text-xs bg-surface-800 hover:bg-surface-700 text-surface-300 px-3 py-1.5 rounded-full border border-surface-700 transition-colors">
            <TrendingUp size={12}/> Profit
          </button>
          <button onClick={() => setInput("Pending payments batao")} className="flex items-center gap-1.5 text-xs bg-surface-800 hover:bg-surface-700 text-surface-300 px-3 py-1.5 rounded-full border border-surface-700 transition-colors">
            <AlertCircle size={12}/> Debtors
          </button>
          <button onClick={() => setInput("Invoice 1024 search karo")} className="flex items-center gap-1.5 text-xs bg-surface-800 hover:bg-surface-700 text-surface-300 px-3 py-1.5 rounded-full border border-surface-700 transition-colors">
            <FileSearch size={12}/> Find Invoice
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-surface-950 border-x border-surface-800 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-surface-800 border border-surface-700 text-surface-300' : 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-surface-800 border border-surface-700 text-white rounded-tr-none' 
                : 'bg-surface-900 border border-surface-800 text-surface-200 shadow-lg ring-1 ring-white/5 rounded-tl-none'
            }`}>
              {msg.text}
            </div>

          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4 max-w-[80%]">
             <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                <Bot size={16} />
             </div>
             <div className="bg-surface-900 border border-surface-800 text-surface-200 shadow-lg ring-1 ring-white/5 rounded-2xl rounded-tl-none p-4 py-5 flex gap-1.5 items-center">
               <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '0ms'}}></div>
               <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '150ms'}}></div>
               <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="bg-surface-900 border border-surface-800 p-4 rounded-b-2xl">
        <div className="relative flex items-center">
           <textarea 
             rows={1}
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Poochiye apna sawaal... (e.g. Aaj total kitni sales hui?)"
             className="w-full bg-surface-950 border border-surface-800 rounded-xl pl-4 pr-14 py-4 text-sm text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none transition-all hidden-scrollbar"
             style={{ minHeight: '56px', maxHeight: '120px' }}
           />
           <button 
             onClick={handleSend}
             disabled={!input.trim() || loading}
             className="absolute right-2 p-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
           >
             <Send size={18} />
           </button>
        </div>
        <div className="text-center mt-3 text-[10px] text-surface-500">
           AI answers are generated based on local DB snapshot. Always verify finalized figures from standard reports.
        </div>
      </div>

    </div>
  );
}
