import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { dbGetAll } from '../../lib/db'

export default function GSTComputationPage() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodFrom, periodTo } = useNavigationStore()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ cgstIn: 0, sgstIn: 0, igstIn: 0, cgstOut: 0, sgstOut: 0, igstOut: 0 })

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)

    // Output Tax (from Sales)
    const out = await dbGetAll(`
      SELECT SUM(vi.cgst) as cgst, SUM(vi.sgst) as sgst, SUM(vi.igst) as igst
      FROM Voucher v
      JOIN VoucherItem vi ON vi.voucherId = v.id AND vi.isDebit = 0
      WHERE v.companyId = ? AND v.voucherType = 'SALES' AND v.status = 'CONFIRMED'
        AND v.voucherDate >= ? AND v.voucherDate <= ?
    `, [activeCompany.id, periodFrom, periodTo])

    // Input Tax (from Purchases)
    const inp = await dbGetAll(`
      SELECT SUM(vi.cgst) as cgst, SUM(vi.sgst) as sgst, SUM(vi.igst) as igst
      FROM Voucher v
      JOIN VoucherItem vi ON vi.voucherId = v.id AND vi.isDebit = 1
      WHERE v.companyId = ? AND v.voucherType = 'PURCHASE' AND v.status = 'CONFIRMED'
        AND v.voucherDate >= ? AND v.voucherDate <= ?
    `, [activeCompany.id, periodFrom, periodTo])

    setData({
      cgstOut: out[0]?.cgst || 0, sgstOut: out[0]?.sgst || 0, igstOut: out[0]?.igst || 0,
      cgstIn: inp[0]?.cgst || 0, sgstIn: inp[0]?.sgst || 0, igstIn: inp[0]?.igst || 0,
    })

    setLoading(false)
  }, [activeCompany?.id, periodFrom, periodTo])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([{ key: 'F2', handler: () => setShowPeriodSelector(true) }])

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d } }

  const payCGST = Math.max(0, data.cgstOut - data.cgstIn)
  const paySGST = Math.max(0, data.sgstOut - data.sgstIn)
  const payIGST = Math.max(0, data.igstOut - data.igstIn)

  const ctcCGST = Math.max(0, data.cgstIn - data.cgstOut)
  const ctcSGST = Math.max(0, data.sgstIn - data.sgstOut)
  const ctcIGST = Math.max(0, data.igstIn - data.igstOut)

  if (loading) return <div className="h-full flex items-center justify-center text-surface-400">Computing GST...</div>

  return (
    <div className="report-page bg-surface-950">
      <div className="report-header bg-brand-900/10 border-b-2 border-brand-500/30 px-6 py-4">
        <div>
          <h1 className="tally-form-title text-xl text-brand-300">GST Computation</h1>
          <p className="text-surface-400 text-xs mt-1">
            <span className="text-white font-semibold">{activeCompany?.name}</span> &nbsp;·&nbsp;
            Period: {formatDate(periodFrom)} to {formatDate(periodTo)}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 ml-3 text-[10px] hover:text-brand-300">[F2: Change]</button>
          </p>
        </div>
      </div>

      <div className="report-table-container p-6 w-full max-w-4xl mx-auto space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Output Tax */}
          <div className="bg-surface-900 rounded-lg border border-surface-700/50 p-5">
            <h2 className="text-amber-400 font-bold mb-4 uppercase text-xs tracking-wider border-b border-surface-700 pb-2">Output Tax Liability (Sales)</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-surface-400">CGST</span> <span className="font-mono text-white">{fmt(data.cgstOut)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-400">SGST</span> <span className="font-mono text-white">{fmt(data.sgstOut)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-400">IGST</span> <span className="font-mono text-white">{fmt(data.igstOut)}</span></div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-700 flex justify-between font-bold">
              <span>Total Liability</span>
              <span className="font-mono text-amber-400">{fmt(data.cgstOut + data.sgstOut + data.igstOut)}</span>
            </div>
          </div>

          {/* Input Tax */}
          <div className="bg-surface-900 rounded-lg border border-surface-700/50 p-5">
            <h2 className="text-emerald-400 font-bold mb-4 uppercase text-xs tracking-wider border-b border-surface-700 pb-2">Input Tax Credit (Purchases)</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-surface-400">CGST</span> <span className="font-mono text-white">{fmt(data.cgstIn)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-400">SGST</span> <span className="font-mono text-white">{fmt(data.sgstIn)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-400">IGST</span> <span className="font-mono text-white">{fmt(data.igstIn)}</span></div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-700 flex justify-between font-bold">
              <span>Total ITC</span>
              <span className="font-mono text-emerald-400">{fmt(data.cgstIn + data.sgstIn + data.igstIn)}</span>
            </div>
          </div>
        </div>

        {/* Net Tax */}
        <div className="bg-surface-800 rounded-lg border border-brand-500/30 p-6">
          <h2 className="text-white font-bold text-lg mb-4 text-center">Net GST Payable / (Credit Carried Forward)</h2>
          <div className="flex justify-around text-center divider-x divider-surface-700">
            <div className="px-4">
              <div className="text-xs text-surface-400 uppercase tracking-widest mb-2">CGST</div>
              <div className={`font-mono text-2xl font-bold ${payCGST > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {payCGST > 0 ? fmt(payCGST) : `(${fmt(ctcCGST)})`}
              </div>
            </div>
            <div className="w-px bg-surface-700"></div>
            <div className="px-4">
              <div className="text-xs text-surface-400 uppercase tracking-widest mb-2">SGST</div>
              <div className={`font-mono text-2xl font-bold ${paySGST > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {paySGST > 0 ? fmt(paySGST) : `(${fmt(ctcSGST)})`}
              </div>
            </div>
            <div className="w-px bg-surface-700"></div>
            <div className="px-4">
              <div className="text-xs text-surface-400 uppercase tracking-widest mb-2">IGST</div>
              <div className={`font-mono text-2xl font-bold ${payIGST > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {payIGST > 0 ? fmt(payIGST) : `(${fmt(ctcIGST)})`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
