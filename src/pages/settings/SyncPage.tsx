import React, { useState } from 'react';
import { Cloud, RefreshCw, ServerCrash, Check, AlertTriangle, ArrowRight } from 'lucide-react';

export default function SyncPage() {
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'CONFLICTS' | 'SUCCESS'>('CONFLICTS');
  
  // Mock conflicts as described in architecture
  const [conflicts, setConflicts] = useState([
    {
      id: 'conf-1',
      recordId: 'INV-1002',
      tableName: 'Voucher',
      localData: { amount: 5000, date: '2026-04-12', updatedBy: 'Admin (Local)' },
      cloudData: { amount: 6000, date: '2026-04-12', updatedBy: 'Web ERP User' },
      type: 'EDIT'
    }
  ]);

  const handleSyncNow = () => {
    setSyncStatus('SYNCING');
    setTimeout(() => {
      setSyncStatus(conflicts.length > 0 ? 'CONFLICTS' : 'SUCCESS');
    }, 1500);
  };

  const resolveConflict = (id: string, resolution: 'KEEP_LOCAL' | 'KEEP_CLOUD') => {
    // In actual implementation, this writes to the local DB then pushes to Cloud
    setConflicts(conflicts.filter(c => c.id !== id));
    if (conflicts.length === 1) {
      setSyncStatus('SUCCESS');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in p-6">
      
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20">
             <Cloud className="text-brand-400" />
           </div>
           <div>
             <h1 className="text-3xl font-bold font-display text-white">Cloud Sync Center</h1>
             <p className="text-surface-400 mt-1 text-sm">VaahanBooks ↔ VaahanERP Bi-directional Sync</p>
           </div>
        </div>
        <button 
          onClick={handleSyncNow}
          disabled={syncStatus === 'SYNCING'}
          className="flex items-center gap-2 bg-surface-800 hover:bg-surface-700 text-white px-6 py-3 rounded-xl shadow-lg border border-surface-700 transition-all font-medium disabled:opacity-50"
        >
          <RefreshCw size={18} className={syncStatus === 'SYNCING' ? 'animate-spin' : ''} />
          {syncStatus === 'SYNCING' ? 'Syncing with Supabase...' : 'Sync Now'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Status Panel */}
        <div className="col-span-1 space-y-6">
           <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5">
              <h2 className="text-sm font-bold text-surface-400 uppercase tracking-widest mb-4">Sync Health</h2>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-surface-950 p-3 rounded-lg border border-surface-800">
                    <span className="text-surface-300 text-sm">Connection</span>
                    <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">ONLINE</span>
                 </div>
                 <div className="flex justify-between items-center bg-surface-950 p-3 rounded-lg border border-surface-800">
                    <span className="text-surface-300 text-sm">Last Synced</span>
                    <span className="text-white text-xs font-mono">12 Apr, 14:05</span>
                 </div>
                 <div className="flex justify-between items-center bg-surface-950 p-3 rounded-lg border border-surface-800">
                    <span className="text-surface-300 text-sm">Pending Uploads</span>
                    <span className="text-white text-xs font-mono">0 Records</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Conflict Resolution UI */}
        <div className="col-span-2">
           <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5 h-full">
              <h2 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${conflicts.length > 0 ? 'text-yellow-500' : 'text-green-400'}`}>
                {conflicts.length > 0 ? <AlertTriangle size={18}/> : <Check size={18}/>}
                {conflicts.length > 0 ? `${conflicts.length} Sync Conflicts Found` : 'All Data Synchronized'}
              </h2>

              {conflicts.length === 0 ? (
                 <div className="h-48 flex items-center justify-center border-2 border-dashed border-surface-800 rounded-xl bg-surface-950/50">
                   <div className="text-center text-surface-500">
                      <Cloud size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conflicts detected. Cloud and Local data are completely identical.</p>
                   </div>
                 </div>
              ) : (
                 <div className="space-y-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs p-3 rounded-lg mb-4">
                      <b>ACCOUNTING INTEGRITY:</b> Do not overwrite blindly. Review differing records below. Remember, completed vouchers are immutable.
                    </div>

                    {conflicts.map(conflict => (
                       <div key={conflict.id} className="bg-surface-950 border border-surface-800 rounded-xl overflow-hidden">
                          <div className="p-3 bg-surface-800/50 border-b border-surface-800 flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <ServerCrash size={14} className="text-red-400" />
                                <span className="font-bold text-white text-sm">Record: {conflict.recordId}</span>
                                <span className="text-xs text-surface-400">({conflict.tableName} • {conflict.type})</span>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 divide-x divide-surface-800">
                             {/* Local Data */}
                             <div className="p-4">
                                <div className="text-xs text-brand-400 font-bold mb-2">LOCAL DESKTOP (Your PC)</div>
                                <pre className="text-xs text-surface-300 font-mono bg-surface-900 p-2 rounded border border-surface-800">
                                  {JSON.stringify(conflict.localData, null, 2)}
                                </pre>
                                <button 
                                  onClick={() => resolveConflict(conflict.id, 'KEEP_LOCAL')}
                                  className="w-full mt-3 bg-surface-800 hover:bg-brand-500 hover:text-white border border-surface-700 text-surface-300 text-xs py-2 rounded transition-colors"
                                >
                                  Overwrite Cloud (Keep Local)
                                </button>
                             </div>

                             {/* Cloud Data */}
                             <div className="p-4">
                                <div className="text-xs text-blue-400 font-bold mb-2">CLOUD SERVER (VaahanERP)</div>
                                <pre className="text-xs text-surface-300 font-mono bg-surface-900 p-2 rounded border border-surface-800">
                                  {JSON.stringify(conflict.cloudData, null, 2)}
                                </pre>
                                <button 
                                  onClick={() => resolveConflict(conflict.id, 'KEEP_CLOUD')}
                                  className="w-full mt-3 bg-surface-800 hover:bg-blue-600 hover:text-white border border-surface-700 text-surface-300 text-xs py-2 rounded transition-colors"
                                >
                                  Import Cloud (Overwrite Local)
                                </button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
