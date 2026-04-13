import React, { useState } from 'react';
import { Blocks, Search, Star, Download, ShieldCheck, Code2 } from 'lucide-react';

export default function PluginMarketplace() {
  const [plugins, setPlugins] = useState([
    { id: 'p1', name: 'WhatsApp Bulk Sender', author: 'VaahanBooks Core', desc: 'Send invoices natively via WhatsApp Web integration.', icon: '💬', rating: 4.8, type: 'INSTALLED' },
    { id: 'p2', name: 'Retail POS UI', author: 'Nexus Devs', desc: 'A quick billing POS UI built for retail shops with barcode scanner support.', icon: '🏪', rating: 4.5, type: 'MARKETPLACE' },
    { id: 'p3', name: 'Custom Report Builder', author: 'VaahanBooks Core', desc: 'Drag-and-drop tool to create custom report layouts. Uses VB-SDK standard hooks.', icon: '📊', rating: 4.9, type: 'INSTALLED' },
    { id: 'p4', name: 'Automobile Service UI', author: 'AutoTech', desc: 'Specialized invoicing format for service stations, linking spare parts and labor.', icon: '🔧', rating: 4.2, type: 'MARKETPLACE' }
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20">
             <Blocks className="text-pink-400" />
           </div>
           <div>
             <h1 className="text-3xl font-bold font-display text-white">Plugin Marketplace</h1>
             <p className="text-surface-400 mt-1 text-sm">Extend VaahanBooks via `@vaahan-books/plugin-sdk`</p>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-2.5 text-surface-500" size={16}/>
              <input type="text" placeholder="Search plugins..." className="bg-surface-950 border border-surface-800 text-white text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-brand-500" />
           </div>
           <button className="flex items-center gap-2 bg-surface-800 hover:bg-surface-700 text-white text-sm px-4 py-2 rounded-lg border border-surface-700 transition-colors">
              <Code2 size={16}/> Developer Portal
           </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        
        {/* Installed plugins sidebar */}
        <div className="col-span-1 space-y-4">
           <h2 className="text-sm font-bold text-white uppercase tracking-wider pl-2">Installed Plugins</h2>
           <div className="space-y-3">
              {plugins.filter(p => p.type === 'INSTALLED').map(p => (
                 <div key={p.id} className="bg-surface-900 border border-surface-800 p-4 rounded-xl shadow-lg ring-1 ring-white/5 relative overflow-hidden group cursor-pointer hover:bg-surface-800/50 transition-colors">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="text-3xl mb-2">{p.icon}</div>
                    <h3 className="text-white font-bold text-sm leading-tight">{p.name}</h3>
                    <p className="text-[10px] text-surface-400 mt-1">by {p.author}</p>
                    <div className="mt-3 flex items-center justify-between">
                       <span className="text-green-400 text-[10px] font-bold border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded">ACTIVE</span>
                       <ShieldCheck className="text-green-400" size={14} />
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Marketplace Grid */}
        <div className="col-span-3">
           <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pl-2">Discover New Capabilities</h2>
           <div className="grid grid-cols-2 gap-4">
              {plugins.filter(p => p.type === 'MARKETPLACE').map(p => (
                 <div key={p.id} className="bg-surface-900 border border-surface-800 p-5 rounded-2xl shadow-lg ring-1 ring-white/5 flex flex-col">
                    <div className="flex gap-4 items-start mb-3">
                       <div className="w-14 h-14 bg-surface-950 rounded-xl flex items-center justify-center text-3xl border border-surface-800 shrink-0 shadow-inner">
                         {p.icon}
                       </div>
                       <div>
                          <h3 className="text-white font-bold text-lg">{p.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-surface-400 mt-0.5">
                             <span>by {p.author}</span>
                             <span>•</span>
                             <span className="flex items-center gap-0.5 text-yellow-500 font-medium"><Star size={12} className="fill-yellow-500"/> {p.rating}</span>
                          </div>
                       </div>
                    </div>
                    <p className="text-sm text-surface-400 mb-4 flex-1">
                       {p.desc}
                    </p>
                    <div className="pt-4 border-t border-surface-800 mt-auto flex justify-between items-center bg-surface-950/30 -mx-5 -mb-5 p-4 rounded-b-2xl">
                       <div className="text-xs text-brand-400 font-mono font-medium">Free</div>
                       <button className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-lg shadow-brand-500/20 transition-all">
                         <Download size={14} /> Install Plugin
                       </button>
                    </div>
                 </div>
              ))}
           </div>
           
           {/* SDK Promo banner */}
           <div className="mt-6 bg-gradient-to-r from-surface-900 to-brand-900/30 border border-brand-500/20 p-6 rounded-2xl flex justify-between items-center shadow-lg relative overflow-hidden ring-1 ring-white/5">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
             <div>
                <h3 className="text-white font-bold text-lg mb-1">Build Your Own Plugins</h3>
                <p className="text-surface-300 text-sm">Use our IPC-based SDK to build UI extensions and hook into core events. Sandbox isolated.</p>
             </div>
             <button className="bg-surface-900 border border-brand-500/50 hover:bg-brand-500/20 text-white text-sm px-6 py-3 rounded-xl font-bold transition-all relative z-10">
               Read Developer Docs
             </button>
           </div>

        </div>

      </div>
    </div>
  );
}
