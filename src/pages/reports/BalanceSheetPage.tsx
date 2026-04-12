import React from 'react';
import { Download, PieChart, TrendingUp, TrendingDown } from 'lucide-react';

export default function BalanceSheetPage() {
  const assets = [
    { name: 'Fixed Assets', amount: 450000 },
    { name: 'Current Assets', amount: 0 },
    { name: '  - Cash in Hand', amount: 35000 },
    { name: '  - Bank Accounts', amount: 125000 },
    { name: '  - Sundry Debtors', amount: 310000 },
    { name: '  - Closing Stock', amount: 280000 },
  ];

  const liabilities = [
    { name: 'Capital Account', amount: 800000 },
    { name: 'Loans (Liability)', amount: 150000 },
    { name: 'Current Liabilities', amount: 0 },
    { name: '  - Sundry Creditors', amount: 180000 },
    { name: '  - Duties & Taxes (GST)', amount: 25000 },
    { name: 'Profit & Loss A/C', amount: 45000 },
  ];

  const totalAssets = 450000 + 35000 + 125000 + 310000 + 280000;
  const totalLiabilities = 800000 + 150000 + 180000 + 25000 + 45000;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20">
            <PieChart className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-white">Balance Sheet</h1>
            <p className="text-surface-400 mt-1 text-sm">As on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-surface-800 hover:bg-surface-700 text-white px-6 py-3 rounded-xl shadow-lg font-medium transition-all border border-surface-700">
          <Download size={18} /> Export PDF
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* Liabilities Side (Left) */}
        <div className="bg-surface-900 rounded-2xl shadow-lg border border-surface-800 overflow-hidden ring-1 ring-white/5 flex flex-col">
          <div className="p-4 border-b border-surface-800 bg-surface-950/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="text-red-400" size={18} /> Liabilities
            </h2>
          </div>
          <div className="flex-1 p-2">
            <table className="w-full text-left">
              <tbody>
                {liabilities.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-800/20 transition-colors">
                    <td className={`p-3 text-sm ${item.name.startsWith('  -') ? 'pl-8 text-surface-400' : 'text-surface-200 font-medium'}`}>
                      {item.name}
                    </td>
                    <td className="p-3 text-right text-sm text-white font-mono">
                      {item.amount > 0 ? `₹ ${item.amount.toLocaleString('en-IN')}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-surface-800 bg-surface-950 flex justify-between items-center text-red-50">
             <span className="font-bold text-lg">Total</span>
             <span className="font-bold text-xl font-mono border-double border-b-4 border-surface-600 pb-1">
               ₹ {totalLiabilities.toLocaleString('en-IN')}
             </span>
          </div>
        </div>

        {/* Assets Side (Right) */}
        <div className="bg-surface-900 rounded-2xl shadow-lg border border-surface-800 overflow-hidden ring-1 ring-white/5 flex flex-col">
          <div className="p-4 border-b border-surface-800 bg-surface-950/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="text-green-400" size={18} /> Assets
            </h2>
          </div>
          <div className="flex-1 p-2">
            <table className="w-full text-left">
              <tbody>
                {assets.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-800/20 transition-colors">
                    <td className={`p-3 text-sm ${item.name.startsWith('  -') ? 'pl-8 text-surface-400' : 'text-surface-200 font-medium'}`}>
                      {item.name}
                    </td>
                    <td className="p-3 text-right text-sm text-white font-mono">
                      {item.amount > 0 ? `₹ ${item.amount.toLocaleString('en-IN')}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-surface-800 bg-surface-950 flex justify-between items-center text-green-50">
             <span className="font-bold text-lg">Total</span>
             <span className="font-bold text-xl font-mono border-double border-b-4 border-surface-600 pb-1">
               ₹ {totalAssets.toLocaleString('en-IN')}
             </span>
          </div>
        </div>

      </div>
    </div>
  );
}
