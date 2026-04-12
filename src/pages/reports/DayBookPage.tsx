import React, { useState } from 'react';
import { Calendar, Search, Filter, Download } from 'lucide-react';

export default function DayBookPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data representing exact double entry Immutable Ledger Postings
  const dayBookEntries = [
    { id: 'VCH-001', type: 'RECEIPT', particular: 'Rahul Electronics', debit: 25000, credit: 0, time: '10:15 AM' },
    { id: 'VCH-001', type: 'RECEIPT', particular: 'HDFC Bank', debit: 0, credit: 25000, time: '10:15 AM' },
    
    { id: 'VCH-002', type: 'PAYMENT', particular: 'Office Rent A/C', debit: 15000, credit: 0, time: '11:30 AM' },
    { id: 'VCH-002', type: 'PAYMENT', particular: 'Petty Cash', debit: 0, credit: 15000, time: '11:30 AM' },
    
    { id: 'INV-1024', type: 'SALES', particular: 'Sharma Computers', debit: 59000, credit: 0, time: '02:45 PM' },
    { id: 'INV-1024', type: 'SALES', particular: 'Sales A/C', debit: 0, credit: 50000, time: '02:45 PM' },
    { id: 'INV-1024', type: 'SALES', particular: 'CGST Payable', debit: 0, credit: 4500, time: '02:45 PM' },
    { id: 'INV-1024', type: 'SALES', particular: 'SGST Payable', debit: 0, credit: 4500, time: '02:45 PM' },
  ];

  const totalDebit = dayBookEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = dayBookEntries.reduce((sum, e) => sum + e.credit, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Day Book</h1>
          <p className="text-surface-400 mt-1 text-sm">Daily Ledger Activity & Vouchers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-950 border border-surface-800 rounded-lg p-2 px-4 shadow-inner">
            <Calendar size={16} className="text-brand-400" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-white outline-none"
            />
          </div>
          <button className="flex items-center gap-2 bg-surface-800 hover:bg-surface-700 text-white px-4 py-2 rounded-lg transition-all border border-surface-700">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-surface-900 rounded-2xl shadow-lg border border-surface-800 overflow-hidden ring-1 ring-white/5">
        
        {/* Toolbar */}
        <div className="flex justify-between p-4 border-b border-surface-800 bg-surface-950/30">
          <div className="relative w-64">
             <Search size={16} className="absolute left-3 top-2.5 text-surface-500" />
             <input 
               type="text" 
               placeholder="Search entries..." 
               className="w-full bg-surface-950 border border-surface-800 rounded-lg pl-9 py-2 text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none"
             />
          </div>
          <button className="flex items-center gap-2 text-surface-400 hover:text-white text-sm transition-colors">
            <Filter size={16} /> Filter 
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-950/80 text-surface-400 text-xs uppercase tracking-wider font-semibold border-b border-surface-800">
              <th className="p-4 w-24">Time</th>
              <th className="p-4 w-32">Voucher No</th>
              <th className="p-4 w-32">Voucher Type</th>
              <th className="p-4">Particulars (Ledger)</th>
              <th className="p-4 w-32 text-right">Debit (₹)</th>
              <th className="p-4 w-32 text-right">Credit (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800 text-sm">
            {dayBookEntries.map((entry, idx) => (
              <tr key={idx} className="hover:bg-surface-800/30 transition-colors">
                <td className="p-4 text-surface-500">{entry.time}</td>
                <td className="p-4 font-mono text-brand-300">{entry.id}</td>
                <td className="p-4 text-surface-300">{entry.type}</td>
                <td className="p-4 text-white font-medium">{entry.particular}</td>
                <td className="p-4 text-right text-surface-300">{entry.debit > 0 ? entry.debit.toFixed(2) : ''}</td>
                <td className="p-4 text-right text-surface-300">{entry.credit > 0 ? entry.credit.toFixed(2) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Totals */}
        <div className="bg-surface-950 border-t border-surface-800 p-4 px-6 flex justify-end gap-16">
          <div className="text-right">
            <div className="text-xs text-surface-500 uppercase tracking-widest font-semibold mb-1">Total Debit</div>
            <div className="text-xl font-bold font-mono text-white">₹ {totalDebit.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-surface-500 uppercase tracking-widest font-semibold mb-1">Total Credit</div>
            <div className="text-xl font-bold font-mono text-white">₹ {totalCredit.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
