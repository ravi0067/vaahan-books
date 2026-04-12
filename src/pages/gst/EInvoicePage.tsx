import React, { useState } from 'react';
import { QrCode, FileCheck, Zap, Server } from 'lucide-react';
import { GSTApi, GSPResponse } from '../../lib/gst-api';

export default function EInvoicePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GSPResponse | null>(null);

  const mockInvoiceData = {
    invoiceNumber: 'INV-1025',
    date: new Date().toISOString().split('T')[0],
    amount: 145000,
    customer: 'TechVision Enterprises',
    gstin: '29ABCDE1234F1Z5'
  };

  const handleGenerateIRN = async () => {
    setLoading(true);
    const res = await GSTApi.generateEInvoice({
      ...mockInvoiceData,
      companyGstin: '27AABCT3518Q1Z1' // Origin
    });
    setLoading(false);
    setResult(res);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <QrCode className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-white">E-Invoice Generator</h1>
            <p className="text-surface-400 mt-1 text-sm">NIC API / GSP Integration</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Invoice Target */}
        <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5">
           <h2 className="text-sm font-bold text-surface-400 uppercase tracking-widest mb-4">Pending Generation</h2>
           
           <div className="space-y-4">
              <div className="bg-surface-950 p-4 rounded-xl border border-surface-800">
                 <div className="text-xs text-surface-500">Invoice Ref</div>
                 <div className="font-mono text-brand-300 font-bold mb-2">{mockInvoiceData.invoiceNumber}</div>
                 
                 <div className="text-xs text-surface-500 mt-3">Customer</div>
                 <div className="text-white font-medium">{mockInvoiceData.customer}</div>
                 <div className="text-xs text-surface-400 mt-1">GSTIN: {mockInvoiceData.gstin}</div>
                 
                 <div className="text-xs text-surface-500 mt-3">Amount</div>
                 <div className="text-xl text-white font-bold">₹ {mockInvoiceData.amount.toLocaleString()}</div>
              </div>

              <button 
                onClick={handleGenerateIRN}
                disabled={loading || !!result?.irn}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-4 rounded-xl shadow-lg font-bold transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                ) : (
                  <Zap size={18} />
                )}
                {result?.irn ? 'IRN Generated' : 'Generate IRN & QR Code'}
              </button>
           </div>
        </div>

        {/* Output Panel */}
        <div className="bg-surface-900 border border-surface-800 p-6 rounded-2xl shadow-lg ring-1 ring-white/5 relative overflow-hidden">
           {result?.success && <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-bl-lg font-bold border-l border-b border-green-500/30 flex items-center gap-1"><Server size={10}/> NIC VERIFIED</div>}
           
           <h2 className="text-sm font-bold text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <FileCheck size={16} /> NIC Response
           </h2>

           {!result ? (
             <div className="h-48 flex items-center justify-center border-2 border-dashed border-surface-800 rounded-xl">
               <div className="text-center text-surface-500">
                  <QrCode size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">IRN will appear here</p>
               </div>
             </div>
           ) : (
             <div className="space-y-4 animate-fade-in">
               
               <div>
                 <div className="text-xs text-surface-400 mb-1">Invoice Reference Number (IRN)</div>
                 <div className="bg-surface-950 p-3 rounded-lg border border-surface-800 text-xs font-mono text-green-400 break-all select-all">
                   {result.irn}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <div className="text-xs text-surface-400 mb-1">Ack No</div>
                     <div className="bg-surface-950 p-2 rounded-lg border border-surface-800 text-sm font-mono text-white">
                       {result.ackNo}
                     </div>
                  </div>
                  <div>
                     <div className="text-xs text-surface-400 mb-1">Ack Date</div>
                     <div className="bg-surface-950 p-2 rounded-lg border border-surface-800 text-sm font-mono text-white">
                       {new Date(result.ackDate!).toLocaleString()}
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4 bg-brand-500/10 p-4 rounded-xl border border-brand-500/20">
                  <div className="w-16 h-16 bg-white p-1 rounded">
                     <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MOCK_SIGNED_QR" className="w-full h-full opacity-90 mix-blend-multiply" alt="QR" />
                  </div>
                  <div>
                     <h3 className="text-brand-300 font-bold text-sm">Signed QR Code Ready</h3>
                     <p className="text-surface-400 text-xs mt-1">This QR acts as a B2B digital signature. It is ready for thermal printing on the invoice PDF.</p>
                  </div>
               </div>

             </div>
           )}
        </div>
      </div>
    </div>
  );
}
