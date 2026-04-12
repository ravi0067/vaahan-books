import React from 'react';
import { Users, IndianRupee, FileText, CheckCircle2 } from 'lucide-react';

export default function PayrollDashboard() {
  const employees = [
    { id: 'E001', name: 'Raj Kumar', role: 'Senior Accountant', basic: 45000, status: 'PROCESSED' },
    { id: 'E002', name: 'Amit Sharma', role: 'Sales Executive', basic: 25000, status: 'PENDING' },
    { id: 'E003', name: 'Ravi Singh', role: 'Mechanic', basic: 22000, status: 'PENDING' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
             <IndianRupee className="text-teal-400" />
           </div>
           <div>
             <h1 className="text-3xl font-bold font-display text-white">Payroll Management</h1>
             <p className="text-surface-400 mt-1 text-sm">Salary Processing & Employee Ledger</p>
           </div>
        </div>
        <button className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-6 py-3 rounded-xl shadow-lg border border-teal-500/50 transition-all font-bold">
           Run Payroll (April 2026)
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Payroll Summary Panel */}
        <div className="col-span-1 space-y-6">
           <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Users size={16} className="text-brand-400"/> Employee Summary
              </h2>
              <div className="space-y-4">
                 <div className="bg-surface-950 p-4 rounded-xl border border-surface-800 text-center">
                    <div className="text-3xl font-bold text-white mb-1">12</div>
                    <div className="text-xs text-surface-400 uppercase tracking-widest font-bold">Active Staff</div>
                 </div>
                 <div className="bg-surface-950 p-4 rounded-xl border border-surface-800 text-center">
                    <div className="text-3xl font-bold text-teal-400 font-mono mb-1">₹ 2.4L</div>
                    <div className="text-xs text-surface-400 uppercase tracking-widest font-bold">Estimated Payout</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Table */}
        <div className="col-span-2">
           <div className="bg-surface-900 border border-surface-800 rounded-2xl shadow-lg ring-1 ring-white/5 overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-surface-800 bg-surface-950/50">
                 <h2 className="text-sm font-bold text-white uppercase tracking-wider">Salary Disbursal Queue</h2>
              </div>
              <div className="p-2 flex-1">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[10px] text-surface-500 uppercase tracking-widest border-b border-surface-800">
                          <th className="p-3">Employee</th>
                          <th className="p-3 text-right">Basic (₹)</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 pr-4 text-right">Pay Slip</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-800 text-sm">
                       {employees.map(emp => (
                          <tr key={emp.id} className="hover:bg-surface-800/30 transition-colors">
                             <td className="p-3">
                                <div className="font-bold text-white">{emp.name}</div>
                                <div className="text-xs text-surface-400">{emp.role}</div>
                             </td>
                             <td className="p-3 text-right font-mono text-surface-300">{emp.basic.toLocaleString()}</td>
                             <td className="p-3">
                                {emp.status === 'PROCESSED' ? (
                                   <span className="flex items-center gap-1 text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded w-max">
                                      <CheckCircle2 size={12}/> Paid
                                   </span>
                                ) : (
                                   <span className="text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                                      Pending
                                   </span>
                                )}
                             </td>
                             <td className="p-3 pr-4 text-right">
                                <button className="text-surface-400 hover:text-white p-2 rounded hover:bg-surface-800 transition-colors" disabled={emp.status !== 'PROCESSED'}>
                                   <FileText size={16} className={emp.status !== 'PROCESSED' ? 'opacity-30' : ''}/>
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
