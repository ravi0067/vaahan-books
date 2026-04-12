import React, { useState } from 'react';
import { ShieldCheck, UploadCloud, AlertTriangle, FileJson, CheckCircle } from 'lucide-react';
import { GSTApi } from '../../lib/gst-api';

export default function GSTR1Page() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'VALIDATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [response, setResponse] = useState<any>(null);

  // Mock data representing the month's summary
  const summary = {
    month: 'March 2026',
    b2bCount: 45,
    b2cCount: 120,
    hsnCount: 15,
    totalTaxable: 1540000,
    totalTax: 277200,
    errorsReadyToFix: 2
  };

  const handlePushToGSTN = async () => {
    if (summary.errorsReadyToFix > 0) {
      if (!confirm("There are 2 GST errors. We recommend auto-fixing them before filing. Proceed anyway?")) {
        return;
      }
    }

    setLoading(true);
    setStatus('VALIDATING');
    
    // Call the GST Api Mock
    const res = await GSTApi.pushGSTR1('03', '2026', [], [], []);
    
    setLoading(false);
    if (res.success) {
      setStatus('SUCCESS');
      setResponse(res.data);
    } else {
      setStatus('ERROR');
      setResponse(res.error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20">
            <ShieldCheck className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-white">GSTR-1 Filing</h1>
            <p className="text-surface-400 mt-1 text-sm">Outward Supplies Return</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Summary Panel */}
        <div className="col-span-2 space-y-6">
          <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Filing Period: {summary.month}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-surface-950 border border-surface-800 p-4 rounded-xl">
                <div className="text-surface-400 text-sm mb-1">Total B2B Invoices</div>
                <div className="text-2xl font-bold text-white">{summary.b2bCount}</div>
              </div>
              <div className="bg-surface-950 border border-surface-800 p-4 rounded-xl">
                <div className="text-surface-400 text-sm mb-1">Total B2C Invoices</div>
                <div className="text-2xl font-bold text-white">{summary.b2cCount}</div>
              </div>
              <div className="bg-surface-950 border border-surface-800 p-4 rounded-xl">
                <div className="text-surface-400 text-sm mb-1">Total Taxable Value</div>
                <div className="text-2xl font-bold text-white">₹ {summary.totalTaxable.toLocaleString()}</div>
              </div>
              <div className="bg-surface-950 border border-surface-800 p-4 rounded-xl">
                <div className="text-surface-400 text-sm mb-1">Total Tax (CGST/SGST/IGST)</div>
                <div className="text-2xl font-bold text-white">₹ {summary.totalTax.toLocaleString()}</div>
              </div>
            </div>

            {summary.errorsReadyToFix > 0 && (
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6">
                <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                <div>
                  <h3 className="text-yellow-500 font-bold text-sm">Action Required: Pre-Filing Errors Detected</h3>
                  <p className="text-surface-300 text-xs mt-1">2 invoices have missing HSN codes. The GST Auto-Fix AI can suggest codes to resolve this before submitting JSON to GSTN.</p>
                  <button className="mt-3 text-xs font-bold text-yellow-950 bg-yellow-500 px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors">
                    Run GST Auto-Fix Now
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={handlePushToGSTN}
              disabled={loading || status === 'SUCCESS'}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-6 py-4 rounded-xl shadow-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Validating & Pushing via GSP...
                </>
              ) : status === 'SUCCESS' ? (
                <>
                  <CheckCircle size={20} /> GSTR-1 Pushed Successfully
                </>
              ) : (
                <>
                  <UploadCloud size={20} /> Push JSON to GSTN (via ClearTax)
                </>
              )}
            </button>
          </div>
        </div>

        {/* GSTN Status Panel */}
        <div className="col-span-1">
          <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5 h-full">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white border-b border-surface-800 pb-4 mb-4">
              <FileJson className="text-brand-400" /> Network Status
            </h3>

            {status === 'IDLE' && (
              <div className="text-surface-400 text-sm text-center py-8">
                Ready to generate JSON schema and validate against GSTN rules.
              </div>
            )}

            {status === 'SUCCESS' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                </div>
                <div className="text-center text-green-400 font-bold mb-4">Validation Passed</div>
                
                <div className="space-y-2 text-xs">
                  <div className="bg-surface-950 p-3 rounded-lg border border-surface-800">
                    <div className="text-surface-500 mb-1">Reference ID</div>
                    <div className="text-white font-mono">{response?.referenceId}</div>
                  </div>
                  <div className="bg-surface-950 p-3 rounded-lg border border-surface-800">
                    <div className="text-surface-500 mb-1">Status Message</div>
                    <div className="text-white">{response?.message}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
