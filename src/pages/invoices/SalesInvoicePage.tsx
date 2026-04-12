import React, { useState } from 'react';
import { GSTCalculator, InvoiceItem, CalculatedItem, GSTState } from '../../lib/gst-calculator';
import { AccountingEngine } from '../../lib/accounting-engine';
import { Plus, Save, Banknote, Map, Hash, Tags, Calculator } from 'lucide-react';

export default function SalesInvoicePage() {
  const [partyName, setPartyName] = useState('');
  const [supplyState, setSupplyState] = useState<GSTState>('INTRA_STATE');
  const [items, setItems] = useState<InvoiceItem[]>([
    { name: '', hsnCode: '', quantity: 1, rate: 0, discount: 0, gstRate: 18, cessRate: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { name: '', hsnCode: '', quantity: 1, rate: 0, discount: 0, gstRate: 18, cessRate: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const calculatedItems: CalculatedItem[] = items.map(item => GSTCalculator.calculateItemAmounts(item, supplyState));
  const totals = GSTCalculator.calculateInvoiceTotal(calculatedItems);

  const handleSaveInvoice = () => {
    if (!partyName) {
      alert("Please enter a party name.");
      return;
    }

    const posting = AccountingEngine.generatePostings('SALES', {
      partyLedgerId: 'ledger-party-123',
      defaultSalesLedgerId: 'ledger-sales-456',
      defaultCgstLedgerId: 'ledger-cgst-789',
      defaultSgstLedgerId: 'ledger-sgst-789',
      defaultIgstLedgerId: 'ledger-igst-789',
      taxableAmount: totals.totalTaxable,
      cgstAmount: totals.totalCGST,
      sgstAmount: totals.totalSGST,
      igstAmount: totals.totalIGST,
      totalAmount: totals.grandTotal,
    });

    if (posting.error) {
      alert("Accounting Error: " + posting.error);
    } else {
      console.log('Accounting Entries Generated:', posting.entries);
      alert("🎉 Invoice saved successfully! Auto-ledger double entry was posted in background.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold font-display text-white bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-blue-400">
            Create Sales Invoice
          </h1>
          <p className="text-surface-400 mt-1 text-sm">B2B / B2C GST Compliant Invoice</p>
        </div>
        <button onClick={handleSaveInvoice} className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-brand-500/20 font-medium transition-all active:scale-95">
          <Save size={18} />
          Save & Auto-Post Ledger
        </button>
      </div>

      {/* Invoice Meta Settings */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5">
          <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-3">
            <span className="p-1.5 bg-surface-800 rounded-lg"><Banknote size={16} className="text-brand-400" /></span>
            Customer / Party Ledger
          </label>
          <input 
            type="text" 
            className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-white placeholder-surface-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
            value={partyName} 
            onChange={e => setPartyName(e.target.value)} 
            placeholder="Search or enter party name..."
          />
        </div>
        <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5">
          <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-3">
            <span className="p-1.5 bg-surface-800 rounded-lg"><Map size={16} className="text-brand-400" /></span>
            Supply Type (GST Application)
          </label>
          <select 
            className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none appearance-none"
            value={supplyState} 
            onChange={(e: any) => setSupplyState(e.target.value)}
          >
            <option value="INTRA_STATE">Intra-State (Local - CGST + SGST)</option>
            <option value="INTER_STATE">Inter-State (Outside - IGST)</option>
            <option value="EXPORT">Export (Zero Rated)</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-surface-900 rounded-2xl shadow-lg border border-surface-800 overflow-hidden ring-1 ring-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-950/50 text-surface-400 text-xs uppercase tracking-wider font-semibold border-b border-surface-800">
                <th className="p-4 w-1/3">Item Description</th>
                <th className="p-4 w-32">HSN Code</th>
                <th className="p-4 w-24 text-right">Qty</th>
                <th className="p-4 w-32 text-right">Rate (₹)</th>
                <th className="p-4 w-28 text-right">GST %</th>
                <th className="p-4 pr-8 text-right">Total Amount</th>
                <th className="p-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {items.map((item, index) => {
                const calcItem = calculatedItems[index];
                const hasHsnError = calcItem.errors.find(e => e.code === 'MISSING_HSN');
                return (
                  <tr key={index} className="group hover:bg-surface-800/20 transition-colors">
                    <td className="p-3 pl-4">
                      <input type="text" placeholder="Enter item name..." className="w-full bg-transparent border border-transparent hover:border-surface-700 focus:border-brand-500 focus:bg-surface-950 rounded-lg p-2 text-white outline-none transition-all" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                    </td>
                    <td className="p-3">
                      <input type="text" placeholder="1234..." className={`w-full bg-transparent border ${hasHsnError ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : 'border-transparent hover:border-surface-700 focus:border-brand-500 focus:bg-surface-950'} rounded-lg p-2 text-white outline-none transition-all`} value={item.hsnCode} onChange={e => handleItemChange(index, 'hsnCode', e.target.value)} />
                      {hasHsnError && <span className="text-red-400 text-[10px] mt-1 block px-2 animate-fade-in">Auto-Fix Suggests: Required</span>}
                    </td>
                    <td className="p-3 text-right">
                      <input type="number" className="w-full bg-transparent border border-transparent hover:border-surface-700 focus:border-brand-500 focus:bg-surface-950 rounded-lg p-2 text-white text-right outline-none transition-all" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="p-3 text-right">
                      <input type="number" className="w-full bg-transparent border border-transparent hover:border-surface-700 focus:border-brand-500 focus:bg-surface-950 rounded-lg p-2 text-white text-right outline-none transition-all" value={item.rate} onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="p-3">
                      <select className="w-full bg-transparent border border-transparent hover:border-surface-700 focus:border-brand-500 focus:bg-surface-950 rounded-lg p-2 text-white outline-none appearance-none cursor-pointer transition-all text-right" value={item.gstRate} onChange={e => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}>
                        <option value="0" className="bg-surface-900">0%</option>
                        <option value="5" className="bg-surface-900">5%</option>
                        <option value="12" className="bg-surface-900">12%</option>
                        <option value="18" className="bg-surface-900">18%</option>
                        <option value="28" className="bg-surface-900">28%</option>
                      </select>
                    </td>
                    <td className="p-3 pr-8 text-right font-medium text-white">
                      ₹{calcItem.totalAmount.toFixed(2)}
                      <div className="text-[10px] text-surface-500 font-normal">Tx: ₹{calcItem.taxableAmount.toFixed(2)}</div>
                    </td>
                    <td className="p-3 pr-4 text-center">
                      <button onClick={() => removeItem(index)} className="oapacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 p-2 rounded-lg transition-all hover:bg-red-400/10">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Actions for Table */}
        <div className="p-4 border-t border-surface-800 bg-surface-950/20">
          <button onClick={handleAddItem} className="flex items-center gap-2 text-sm font-medium text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Add Row
          </button>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="flex justify-end pt-4 pb-12">
        <div className="bg-gradient-to-b from-surface-900 to-surface-950 border border-surface-800 p-6 rounded-2xl shadow-2xl w-[400px] ring-1 ring-white/5 relative overflow-hidden">
          {/* Glassmorphic decorative effect */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <h3 className="flex items-center gap-2 text-lg font-display text-white border-b border-surface-800 pb-4 mb-4">
            <Calculator size={18} className="text-brand-400" /> Let's Crunch The Numbers
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-surface-300">
              <span className="flex items-center gap-1"><Hash size={14} className="text-surface-600"/> Taxable Amount</span> 
              <span className="font-medium text-white">₹{totals.totalTaxable.toFixed(2)}</span>
            </div>
            
            {supplyState === 'INTRA_STATE' ? (
              <>
                <div className="flex justify-between text-surface-300">
                  <span className="flex items-center gap-1"><Tags size={14} className="text-blue-500/70"/> CGST (Local)</span> 
                  <span className="font-medium text-white">₹{totals.totalCGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-surface-300">
                  <span className="flex items-center gap-1"><Tags size={14} className="text-blue-500/70"/> SGST (State)</span> 
                  <span className="font-medium text-white">₹{totals.totalSGST.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-surface-300">
                  <span className="flex items-center gap-1"><Tags size={14} className="text-purple-500/70"/> IGST (Inter-State)</span> 
                  <span className="font-medium text-white">₹{totals.totalIGST.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center bg-brand-500/10 p-5 rounded-xl border border-brand-500/20 mt-6 pt-4">
              <span className="text-brand-300 text-sm font-semibold uppercase tracking-wider">Grand Total</span> 
              <span className="font-bold text-3xl font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-100">
                ₹{totals.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
