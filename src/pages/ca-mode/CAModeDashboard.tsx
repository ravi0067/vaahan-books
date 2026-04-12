import React from 'react';
import { Briefcase, FileSpreadsheet, Calendar, UploadCloud, Users, ArrowUpRight } from 'lucide-react';

export default function CAModeDashboard() {
  const clients = [
    { id: 'C1', name: 'Rahul Electronics', type: 'Private Ltd', gstReady: true, gstr1Status: 'PENDING', tax: 24500 },
    { id: 'C2', name: 'Sharma Traders', type: 'Proprietorship', gstReady: false, gstr1Status: 'ERRORS', tax: 0 },
    { id: 'C3', name: 'TechVision IT', type: 'LLP', gstReady: true, gstr1Status: 'FILED', tax: 185000 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-surface-900 to-indigo-900/40 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
             <Briefcase className="text-indigo-400" />
           </div>
           <div>
             <h1 className="text-3xl font-bold font-display text-white">CA/Accountant Hub</h1>
             <p className="text-indigo-200 mt-1 text-sm">Multi-Client Compliance & Bulk Operations</p>
           </div>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-lg text-indigo-300 font-bold text-sm">
           Professional Edition Activated
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
         <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-blue-500/10 rounded-lg"><Users className="text-blue-400"/></div>
            <div>
              <div className="text-2xl font-bold text-white">45</div>
              <div className="text-xs text-surface-400">Total Linked Clients</div>
            </div>
         </div>
         <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-red-500/10 rounded-lg text-red-400 font-bold">G1</div>
            <div>
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-xs text-surface-400">GSTR-1 Pending</div>
            </div>
         </div>
         <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-green-500/10 rounded-lg"><CheckCircleMock className="text-green-400"/></div>
            <div>
              <div className="text-2xl font-bold text-white">28</div>
              <div className="text-xs text-surface-400">GSTR-3B Filed</div>
            </div>
         </div>
         <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-purple-500/10 rounded-lg"><Calendar className="text-purple-400"/></div>
            <div>
              <div className="text-2xl font-bold text-white">2</div>
              <div className="text-xs text-surface-400">Upcoming Deadlines</div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Multi-Client Panel */}
        <div className="col-span-2 bg-surface-900 border border-surface-800 rounded-2xl shadow-lg ring-1 ring-white/5 overflow-hidden">
           <div className="p-4 border-b border-surface-800 bg-surface-950/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Client Portfolio & GST Status</h2>
              <button className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                <UploadCloud size={14}/> Bulk Push GSTR-1
              </button>
           </div>
           
           <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-950/80 text-surface-400 text-[10px] uppercase tracking-widest font-bold border-b border-surface-800">
                <th className="p-3 pl-4">Client Name</th>
                <th className="p-3">Data Ready</th>
                <th className="p-3 text-right">Tax Liability (₹)</th>
                <th className="p-3">GSTR-1 Status</th>
                <th className="p-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800 text-sm">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="p-3 pl-4">
                     <div className="font-bold text-white">{client.name}</div>
                     <div className="text-[10px] text-surface-500">{client.type}</div>
                  </td>
                  <td className="p-3">
                     {client.gstReady ? <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded border border-green-500/20">Checked</span> 
                                      : <span className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/20">Has Errors</span>}
                  </td>
                  <td className="p-3 text-right font-mono text-white">{client.tax.toLocaleString()}</td>
                  <td className="p-3">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                       client.gstr1Status === 'FILED' ? 'bg-green-500/20 text-green-400' :
                       client.gstr1Status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                     }`}>
                       {client.gstr1Status}
                     </span>
                  </td>
                  <td className="p-3 pr-4 text-right">
                     <button className="text-indigo-400 hover:text-white p-1 hover:bg-indigo-500/20 rounded transition-colors" title="Switch to this Client's space">
                        <ArrowUpRight size={16}/>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tally Import & Tools */}
        <div className="col-span-1 space-y-6">
           
           <div className="bg-surface-900 border border-surface-800 p-5 rounded-2xl shadow-lg ring-1 ring-white/5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                 <FileSpreadsheet className="text-green-400" size={16}/> Migration Tools
              </h2>
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-4">
                 <div className="w-10 h-10 rounded bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30">
                    <span className="font-bold text-green-400">Tally</span>
                 </div>
                 <div>
                    <h3 className="font-bold text-white text-sm">Tally.ERP 9 / Prime Import</h3>
                    <p className="text-xs text-surface-400 mt-1 mb-3">Upload XML dump to natively migrate Masters and Vouchers into VaahanBooks SQLite format.</p>
                    <button className="bg-surface-950 hover:bg-surface-800 text-green-400 border border-surface-700 text-xs px-3 py-1.5 rounded transition-colors w-full">Start Migration</button>
                 </div>
              </div>
           </div>

           <div className="bg-surface-900 border border-surface-800 p-5 rounded-2xl shadow-lg ring-1 ring-white/5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Compliance Alerts</h2>
              <ul className="space-y-3">
                 <li className="flex gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <div>
                       <span className="text-white font-medium block">GSTR-1 Deadline in 2 days</span>
                       <span className="text-xs text-surface-400">12 clients are pending</span>
                    </div>
                 </li>
                 <li className="flex gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 shrink-0"></span>
                    <div>
                       <span className="text-white font-medium block">TDS Payment due</span>
                       <span className="text-xs text-surface-400">7th of next month</span>
                    </div>
                 </li>
              </ul>
           </div>

        </div>

      </div>
    </div>
  );
}

function CheckCircleMock({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
       <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
