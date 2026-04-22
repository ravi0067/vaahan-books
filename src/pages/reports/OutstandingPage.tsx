import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { dbGetAll } from '../../lib/db'

interface OutstandingEntry {
  partyId: string
  partyName: string
  voucherId: string
  voucherNumber: string
  voucherDate: string
  voucherType: string
  totalAmount: number
  pendingAmount: number
  daysOverdue: number
  dueDate: string
}

type Tab = 'receivable' | 'payable'
type AgeBucket = 'all' | '0-30' | '31-60' | '61-90' | '90+'

export default function OutstandingPage() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodTo } = useNavigationStore()

  const [tab, setTab] = useState<Tab>('receivable')
  const [entries, setEntries] = useState<OutstandingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [ageBucket, setAgeBucket] = useState<AgeBucket>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)

    // Get all sales (receivable) or purchase (payable) vouchers
    const voucherType = tab === 'receivable' ? 'SALES' : 'PURCHASE'
    const rows = await dbGetAll(`
      SELECT v.id as voucherId, v.voucherNumber, v.voucherDate, v.voucherType,
             v.totalAmount, v.narration,
             l.id as partyId, l.name as partyName,
             l.creditPeriod
      FROM Voucher v
      JOIN Ledger l ON v.partyLedgerId = l.id
      WHERE v.companyId = ? AND v.voucherType = ?
        AND v.status = 'CONFIRMED'
      ORDER BY v.voucherDate DESC
    `, [activeCompany.id, voucherType])

    const today = new Date()
    const enriched: OutstandingEntry[] = rows.map((r: any) => {
      const vDate = new Date(r.voucherDate)
      const dueDate = new Date(vDate)
      dueDate.setDate(dueDate.getDate() + (r.creditPeriod || 30))
      const msOverdue = today.getTime() - dueDate.getTime()
      const daysOverdue = Math.max(0, Math.floor(msOverdue / (1000 * 60 * 60 * 24)))
      return {
        partyId: r.partyId,
        partyName: r.partyName,
        voucherId: r.voucherId,
        voucherNumber: r.voucherNumber,
        voucherDate: r.voucherDate,
        voucherType: r.voucherType,
        totalAmount: r.totalAmount,
        pendingAmount: r.totalAmount, // Simplified: full amount outstanding (Phase 5 will handle partial)
        daysOverdue,
        dueDate: dueDate.toISOString().split('T')[0],
      }
    })

    setEntries(enriched)
    setLoading(false)
  }, [activeCompany?.id, tab])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([{ key: 'F2', handler: () => setShowPeriodSelector(true) }])

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d } }

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.partyName.toLowerCase().includes(search.toLowerCase()) || e.voucherNumber.toLowerCase().includes(search.toLowerCase())
    const matchAge = ageBucket === 'all' ? true
      : ageBucket === '0-30' ? e.daysOverdue <= 30
      : ageBucket === '31-60' ? e.daysOverdue > 30 && e.daysOverdue <= 60
      : ageBucket === '61-90' ? e.daysOverdue > 60 && e.daysOverdue <= 90
      : e.daysOverdue > 90
    return matchSearch && matchAge
  })

  const totalPending = filtered.reduce((s, e) => s + e.pendingAmount, 0)

  // Aging summary
  const agingSummary = [
    { label: '0–30 days', count: entries.filter(e => e.daysOverdue <= 30).length, amt: entries.filter(e => e.daysOverdue <= 30).reduce((s, e) => s + e.pendingAmount, 0), color: 'text-green-400' },
    { label: '31–60 days', count: entries.filter(e => e.daysOverdue > 30 && e.daysOverdue <= 60).length, amt: entries.filter(e => e.daysOverdue > 30 && e.daysOverdue <= 60).reduce((s, e) => s + e.pendingAmount, 0), color: 'text-yellow-400' },
    { label: '61–90 days', count: entries.filter(e => e.daysOverdue > 60 && e.daysOverdue <= 90).length, amt: entries.filter(e => e.daysOverdue > 60 && e.daysOverdue <= 90).reduce((s, e) => s + e.pendingAmount, 0), color: 'text-orange-400' },
    { label: '90+ days', count: entries.filter(e => e.daysOverdue > 90).length, amt: entries.filter(e => e.daysOverdue > 90).reduce((s, e) => s + e.pendingAmount, 0), color: 'text-red-400' },
  ]

  const ageColor = (days: number) =>
    days <= 30 ? 'text-green-400' : days <= 60 ? 'text-yellow-400' : days <= 90 ? 'text-orange-400' : 'text-red-400'

  if (loading) return <div className="h-full flex items-center justify-center text-surface-400">Loading...</div>

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h1 className="tally-form-title">
            Bills {tab === 'receivable' ? 'Receivable' : 'Payable'}
          </h1>
          <p className="text-surface-500 text-xs">{activeCompany?.name} &nbsp;·&nbsp; Outstanding as on {formatDate(periodTo)}</p>
        </div>
        <div className="flex gap-2 items-center">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search party / voucher..." className="tally-field-input text-xs w-44" />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-surface-800">
        {(['receivable', 'payable'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-brand-500 text-white' : 'border-transparent text-surface-400 hover:text-white'}`}>
            {t === 'receivable' ? '↓ Receivable (Debtors)' : '↑ Payable (Creditors)'}
          </button>
        ))}
      </div>

      {/* Aging summary */}
      <div className="flex gap-3 px-4 py-3 border-b border-surface-800/50 flex-shrink-0">
        {agingSummary.map(a => (
          <button key={a.label}
            onClick={() => setAgeBucket(ageBucket === a.label.replace('–', '-').split(' ')[0] as AgeBucket ? 'all' : a.label.includes('0–30') ? '0-30' : a.label.includes('31–60') ? '31-60' : a.label.includes('61–90') ? '61-90' : '90+')}
            className="flex-1 rounded-lg border border-surface-800 bg-surface-900/30 p-3 text-left transition-all hover:border-surface-700">
            <div className="text-[10px] text-surface-500 mb-1">{a.label}</div>
            <div className={`font-mono text-sm font-bold ${a.color}`}>{fmt(a.amt)}</div>
            <div className="text-[10px] text-surface-600">{a.count} bills</div>
          </button>
        ))}
        <div className="flex-1 rounded-lg border border-brand-500/20 bg-brand-500/5 p-3 text-left">
          <div className="text-[10px] text-surface-500 mb-1">Total Outstanding</div>
          <div className={`font-mono text-sm font-bold ${tab === 'receivable' ? 'text-green-400' : 'text-red-400'}`}>{fmt(entries.reduce((s, e) => s + e.pendingAmount, 0))}</div>
          <div className="text-[10px] text-surface-600">{entries.length} bills</div>
        </div>
      </div>

      {/* Table */}
      <div className="report-table-container">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-surface-500">
            <span className="text-4xl block mb-3">{tab === 'receivable' ? '📥' : '📤'}</span>
            No outstanding {tab === 'receivable' ? 'receivables' : 'payables'} found
            <br /><span className="text-xs text-surface-600 mt-1 block">Create {tab === 'receivable' ? 'Sales (F8)' : 'Purchase (F9)'} vouchers to see outstanding</span>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr className="report-table-head">
                <th className="text-left">Party Name</th>
                <th className="text-left">Voucher No.</th>
                <th className="text-left">Date</th>
                <th className="text-left">Due Date</th>
                <th className="text-right">Amount (₹)</th>
                <th className="text-right">Pending (₹)</th>
                <th className="text-center">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.voucherId} className="report-table-row">
                  <td className="font-medium text-sm">{e.partyName}</td>
                  <td className="font-mono text-xs text-brand-400">{e.voucherNumber}</td>
                  <td className="text-xs">{formatDate(e.voucherDate)}</td>
                  <td className="text-xs">{formatDate(e.dueDate)}</td>
                  <td className="text-right font-mono">{fmt(e.totalAmount)}</td>
                  <td className={`text-right font-mono font-semibold ${tab === 'receivable' ? 'text-green-400' : 'text-red-400'}`}>
                    {fmt(e.pendingAmount)}
                  </td>
                  <td className="text-center">
                    <span className={`text-xs font-bold ${e.daysOverdue === 0 ? 'text-surface-400' : ageColor(e.daysOverdue)}`}>
                      {e.daysOverdue === 0 ? '—' : `${e.daysOverdue}d`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="report-table-foot">
                <td colSpan={4} className="text-right text-xs text-surface-400">{filtered.length} bills</td>
                <td className="text-right font-mono font-bold text-white">
                  {fmt(filtered.reduce((s, e) => s + e.totalAmount, 0))}
                </td>
                <td className={`text-right font-mono font-bold ${tab === 'receivable' ? 'text-green-400' : 'text-red-400'}`}>
                  {fmt(totalPending)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
