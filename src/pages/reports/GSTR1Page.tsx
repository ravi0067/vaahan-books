import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { dbGetAll } from '../../lib/db'

interface GstrSummary {
  section: string
  description: string
  voucherCount: number
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  totalInvoiceAmount: number
}

export default function GSTR1Page() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodFrom, periodTo } = useNavigationStore()
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<GstrSummary[]>([])

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)

    // Fetch all sales vouchers with item details & party details in the period
    const rows = await dbGetAll(`
      SELECT v.id, v.voucherNumber, v.totalAmount, v.isInterState,
             l.gstin,
             SUM(vi.taxableAmount) as taxable,
             SUM(vi.cgst) as cgst,
             SUM(vi.sgst) as sgst,
             SUM(vi.igst) as igst
      FROM Voucher v
      LEFT JOIN Ledger l ON v.partyLedgerId = l.id
      LEFT JOIN VoucherItem vi ON vi.voucherId = v.id AND vi.isDebit = 0 
      WHERE v.companyId = ? AND v.voucherType = 'SALES' AND v.status = 'CONFIRMED'
        AND v.voucherDate >= ? AND v.voucherDate <= ?
        AND vi.ledgerId NOT IN (SELECT id FROM Ledger WHERE name IN ('CGST', 'SGST', 'IGST'))
      GROUP BY v.id
    `, [activeCompany.id, periodFrom, periodTo])

    let b2b: GstrSummary = { section: '4A, 4B, 4C, 6B, 6C', description: 'B2B Invoices', voucherCount: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, totalInvoiceAmount: 0 }
    let b2cl: GstrSummary = { section: '5A, 5B', description: 'B2C (Large) Invoices', voucherCount: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, totalInvoiceAmount: 0 }
    let b2cs: GstrSummary = { section: '7', description: 'B2C (Small) Invoices', voucherCount: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, totalInvoiceAmount: 0 }

    rows.forEach(r => {
      const hasPartyGstin = r.gstin && r.gstin.trim().length > 0
      const taxable = r.taxable || 0
      const cgst = r.cgst || 0
      const sgst = r.sgst || 0
      const igst = r.igst || 0
      const totalTax = cgst + sgst + igst
      const totalAmt = r.totalAmount || 0

      if (hasPartyGstin) {
        b2b.voucherCount++
        b2b.taxableAmount += taxable
        b2b.cgst += cgst; b2b.sgst += sgst; b2b.igst += igst
        b2b.totalTax += totalTax
        b2b.totalInvoiceAmount += totalAmt
      } else {
        if (r.isInterState && totalAmt > 250000) {
          b2cl.voucherCount++
          b2cl.taxableAmount += taxable
          b2cl.cgst += cgst; b2cl.sgst += sgst; b2cl.igst += igst
          b2cl.totalTax += totalTax
          b2cl.totalInvoiceAmount += totalAmt
        } else {
          b2cs.voucherCount++
          b2cs.taxableAmount += taxable
          b2cs.cgst += cgst; b2cs.sgst += sgst; b2cs.igst += igst
          b2cs.totalTax += totalTax
          b2cs.totalInvoiceAmount += totalAmt
        }
      }
    })

    setSummaries([b2b, b2cl, b2cs].filter(s => s.voucherCount > 0))
    setLoading(false)
  }, [activeCompany?.id, periodFrom, periodTo])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([
    { key: 'F2', handler: () => setShowPeriodSelector(true) }
  ])

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d } }

  const totalVouchers = summaries.reduce((s, x) => s + x.voucherCount, 0)
  const totalTaxable = summaries.reduce((s, x) => s + x.taxableAmount, 0)
  const totalTax = summaries.reduce((s, x) => s + x.totalTax, 0)
  const totalAmt = summaries.reduce((s, x) => s + x.totalInvoiceAmount, 0)

  if (loading) return <div className="h-full flex items-center justify-center text-surface-400">Loading GSTR-1...</div>

  return (
    <div className="report-page">
      <div className="report-header bg-brand-900/10 border-b-2 border-brand-500/30">
        <div>
          <h1 className="tally-form-title text-xl text-brand-300">GSTR-1 Report</h1>
          <p className="text-surface-400 text-xs mt-1">
            <span className="text-white font-semibold">{activeCompany?.name}</span> &nbsp;·&nbsp;
            GSTIN/UIN: <span className="font-mono text-brand-200">{activeCompany?.id.split('_')[0] || 'Unregistered'}</span> &nbsp;·&nbsp;
            Period: {formatDate(periodFrom)} to {formatDate(periodTo)}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 ml-3 text-[10px] hover:text-brand-300">[F2: Change Period]</button>
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-surface-400 mb-1">Total Vouchers</div>
          <div className="text-2xl font-mono text-white leading-none">{totalVouchers}</div>
        </div>
      </div>

      <div className="report-table-container p-4">
        {summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-500 bg-surface-900/30 rounded-lg border border-dashed border-surface-700">
            <span className="text-5xl mb-4">📑</span>
            <span className="text-base text-surface-300">No Outward Supplies found for this period</span>
            <span className="text-xs mt-2">Enter Sales vouchers (F8) to populate GSTR-1</span>
          </div>
        ) : (
          <table className="w-full border-collapse border border-surface-700 shadow-md">
            <thead>
              <tr className="bg-surface-800 text-surface-300 text-[11px] uppercase tracking-wider">
                <th className="border border-surface-700 p-2 text-left">Particulars</th>
                <th className="border border-surface-700 p-2 text-center w-24">Voucher Count</th>
                <th className="border border-surface-700 p-2 text-right">Taxable Amount</th>
                <th className="border border-surface-700 p-2 text-right">CGST</th>
                <th className="border border-surface-700 p-2 text-right">SGST</th>
                <th className="border border-surface-700 p-2 text-right">IGST</th>
                <th className="border border-surface-700 p-2 text-right">Tax Amount</th>
                <th className="border border-surface-700 p-2 text-right">Invoice Amount</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(s => (
                <tr key={s.section} className="text-sm border-b border-surface-700/50 hover:bg-surface-800/50 transition-colors">
                  <td className="p-3 border-r border-surface-700/50">
                    <div className="font-semibold text-white">{s.section}</div>
                    <div className="text-xs text-surface-400">{s.description}</div>
                  </td>
                  <td className="p-3 text-center border-r border-surface-700/50 text-brand-300 font-bold">{s.voucherCount}</td>
                  <td className="p-3 text-right border-r border-surface-700/50 font-mono text-white">{fmt(s.taxableAmount)}</td>
                  <td className="p-3 text-right border-r border-surface-700/50 font-mono text-surface-300">{fmt(s.cgst)}</td>
                  <td className="p-3 text-right border-r border-surface-700/50 font-mono text-surface-300">{fmt(s.sgst)}</td>
                  <td className="p-3 text-right border-r border-surface-700/50 font-mono text-surface-300">{fmt(s.igst)}</td>
                  <td className="p-3 text-right border-r border-surface-700/50 font-mono font-bold text-amber-400">{fmt(s.totalTax)}</td>
                  <td className="p-3 text-right font-mono font-bold text-green-400">{fmt(s.totalInvoiceAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-800 font-bold text-sm">
                <td className="p-3 text-right border-r border-surface-700 uppercase tracking-widest text-xs text-surface-300">Total</td>
                <td className="p-3 text-center border-r border-surface-700 text-brand-300">{totalVouchers}</td>
                <td className="p-3 text-right border-r border-surface-700 font-mono text-white">{fmt(totalTaxable)}</td>
                <td className="p-3 text-right border-r border-surface-700 font-mono text-surface-300">{fmt(summaries.reduce((s, x) => s + x.cgst, 0))}</td>
                <td className="p-3 text-right border-r border-surface-700 font-mono text-surface-300">{fmt(summaries.reduce((s, x) => s + x.sgst, 0))}</td>
                <td className="p-3 text-right border-r border-surface-700 font-mono text-surface-300">{fmt(summaries.reduce((s, x) => s + x.igst, 0))}</td>
                <td className="p-3 text-right border-r border-surface-700 font-mono text-amber-400">{fmt(totalTax)}</td>
                <td className="p-3 text-right font-mono text-green-400">{fmt(totalAmt)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
