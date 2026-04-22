import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { dbGetAll } from '../../lib/db'

interface Gstr3BSummary {
  section: string
  description: string
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
}

export default function GSTR3BPage() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodFrom, periodTo } = useNavigationStore()
  const [loading, setLoading] = useState(true)
  const [outward, setOutward] = useState<Gstr3BSummary[]>([])
  const [itc, setItc] = useState<Gstr3BSummary[]>([])

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)

    // Fetch Outward Supplies (Sales)
    const sales = await dbGetAll(`
      SELECT SUM(vi.taxableAmount) as taxable,
             SUM(vi.cgst) as cgst,
             SUM(vi.sgst) as sgst,
             SUM(vi.igst) as igst
      FROM Voucher v
      LEFT JOIN VoucherItem vi ON vi.voucherId = v.id AND vi.isDebit = 0 
      WHERE v.companyId = ? AND v.voucherType = 'SALES' AND v.status = 'CONFIRMED'
        AND v.voucherDate >= ? AND v.voucherDate <= ?
        AND vi.ledgerId NOT IN (SELECT id FROM Ledger WHERE name IN ('CGST', 'SGST', 'IGST'))
    `, [activeCompany.id, periodFrom, periodTo])

    // Fetch Inward Supplies (Purchases)
    const purchases = await dbGetAll(`
      SELECT SUM(vi.taxableAmount) as taxable,
             SUM(vi.cgst) as cgst,
             SUM(vi.sgst) as sgst,
             SUM(vi.igst) as igst
      FROM Voucher v
      LEFT JOIN VoucherItem vi ON vi.voucherId = v.id AND vi.isDebit = 1 
      WHERE v.companyId = ? AND v.voucherType = 'PURCHASE' AND v.status = 'CONFIRMED'
        AND v.voucherDate >= ? AND v.voucherDate <= ?
        AND vi.ledgerId NOT IN (SELECT id FROM Ledger WHERE name IN ('CGST', 'SGST', 'IGST'))
    `, [activeCompany.id, periodFrom, periodTo])

    const s = sales[0] || {}
    const p = purchases[0] || {}

    setOutward([{
      section: '3.1 (a)',
      description: 'Outward taxable supplies (other than zero rated, nil rated and exempted)',
      taxableValue: s.taxable || 0,
      cgst: s.cgst || 0, sgst: s.sgst || 0, igst: s.igst || 0
    }])

    setItc([{
      section: '4 (A) (5)',
      description: 'All other ITC',
      taxableValue: p.taxable || 0,
      cgst: p.cgst || 0, sgst: p.sgst || 0, igst: p.igst || 0
    }])

    setLoading(false)
  }, [activeCompany?.id, periodFrom, periodTo])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([
    { key: 'F2', handler: () => setShowPeriodSelector(true) }
  ])

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d } }

  if (loading) return <div className="h-full flex items-center justify-center text-surface-400">Loading GSTR-3B...</div>

  return (
    <div className="report-page bg-surface-950">
      <div className="report-header bg-brand-900/10 border-b-2 border-brand-500/30 px-6 py-4">
        <div>
          <h1 className="tally-form-title text-xl text-brand-300">GSTR-3B</h1>
          <p className="text-surface-400 text-xs mt-1">
            <span className="text-white font-semibold">{activeCompany?.name}</span> &nbsp;·&nbsp;
            Period: {formatDate(periodFrom)} to {formatDate(periodTo)}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 ml-3 text-[10px] hover:text-brand-300">[F2: Change]</button>
          </p>
        </div>
      </div>

      <div className="report-table-container p-6 space-y-8 overflow-y-auto">
        
        {/* Section 3.1 Outward Supplies */}
        <div className="border border-surface-700/60 rounded overflow-hidden shadow-lg">
          <div className="bg-surface-800 text-white font-semibold px-4 py-2 border-b border-surface-700">
            3.1 Details of Outward Supplies and inward supplies liable to reverse charge
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-900/40 text-surface-300 text-xs text-left uppercase">
              <tr>
                <th className="p-3 border-b border-r border-surface-700/50 w-2/5">Nature of Supplies</th>
                <th className="p-3 border-b border-r border-surface-700/50 text-right">Total Taxable Value</th>
                <th className="p-3 border-b border-r border-surface-700/50 text-right">Integrated Tax</th>
                <th className="p-3 border-b border-r border-surface-700/50 text-right">Central Tax</th>
                <th className="p-3 border-b border-surface-700/50 text-right">State/UT Tax</th>
              </tr>
            </thead>
            <tbody>
              {outward.map(row => (
                <tr key={row.section} className="border-b border-surface-700/50 hover:bg-surface-800/30">
                  <td className="p-3 border-r border-surface-700/50">
                    <span className="font-semibold text-brand-300">{row.section}</span> - {row.description}
                  </td>
                  <td className="p-3 text-right font-mono text-white border-r border-surface-700/50">{fmt(row.taxableValue)}</td>
                  <td className="p-3 text-right font-mono text-surface-300 border-r border-surface-700/50">{fmt(row.igst)}</td>
                  <td className="p-3 text-right font-mono text-surface-300 border-r border-surface-700/50">{fmt(row.cgst)}</td>
                  <td className="p-3 text-right font-mono text-surface-300">{fmt(row.sgst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4 Eligible ITC */}
        <div className="border border-surface-700/60 rounded overflow-hidden shadow-lg">
          <div className="bg-surface-800 text-white font-semibold px-4 py-2 border-b border-surface-700">
            4. Eligible ITC
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-900/40 text-surface-300 text-xs text-left uppercase">
              <tr>
                <th className="p-3 border-b border-r border-surface-700/50 w-2/5">Details</th>
                <th className="p-3 border-b border-r border-surface-700/50 text-right">Integrated Tax</th>
                <th className="p-3 border-b border-r border-surface-700/50 text-right">Central Tax</th>
                <th className="p-3 border-b border-surface-700/50 text-right">State/UT Tax</th>
              </tr>
            </thead>
            <tbody>
              {itc.map(row => (
                <tr key={row.section} className="border-b border-surface-700/50 hover:bg-surface-800/30">
                  <td className="p-3 border-r border-surface-700/50">
                    <span className="font-semibold text-emerald-400">{row.section}</span> - {row.description}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-300 border-r border-surface-700/50">{fmt(row.igst)}</td>
                  <td className="p-3 text-right font-mono text-emerald-300 border-r border-surface-700/50">{fmt(row.cgst)}</td>
                  <td className="p-3 text-right font-mono text-emerald-300">{fmt(row.sgst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
