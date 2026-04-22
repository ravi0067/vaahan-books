import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { getVouchers, deleteVoucher } from '../../lib/db'

type VType = 'ALL' | 'SALES' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'CONTRA' | 'JOURNAL'

const TYPE_COLOR: Record<string, string> = {
  SALES: 'text-green-400 bg-green-400/10',
  PURCHASE: 'text-blue-400 bg-blue-400/10',
  RECEIPT: 'text-emerald-400 bg-emerald-400/10',
  PAYMENT: 'text-red-400 bg-red-400/10',
  CONTRA: 'text-amber-400 bg-amber-400/10',
  JOURNAL: 'text-purple-400 bg-purple-400/10',
  CREDIT_NOTE: 'text-orange-400 bg-orange-400/10',
  DEBIT_NOTE: 'text-pink-400 bg-pink-400/10',
}

export default function DayBookPage() {
  const { activeCompany } = useCompanyStore()
  const { navigateTo, periodFrom, periodTo, setShowPeriodSelector } = useNavigationStore()

  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<VType>('ALL')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)
    const data = await getVouchers(activeCompany.id, {
      from: periodFrom, to: periodTo,
      type: filterType === 'ALL' ? undefined : filterType
    })
    setVouchers(data)
    setLoading(false)
  }, [activeCompany?.id, periodFrom, periodTo, filterType])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([
    { key: 'F2', handler: () => setShowPeriodSelector(true) },
    { key: 'F5', handler: () => load() },
    { key: 'F8', handler: () => navigateTo('voucher-sales') },
    { key: 'F9', handler: () => navigateTo('voucher-purchase') },
  ])

  const filtered = vouchers.filter(v =>
    !search ||
    v.voucherNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.partyName?.toLowerCase().includes(search.toLowerCase()) ||
    v.narration?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAmt = filtered.reduce((s: number, v: any) => s + (v.totalAmount || 0), 0)

  const TYPE_LABELS: Record<string, string> = {
    ALL: 'All', SALES: 'Sales', PURCHASE: 'Purchase',
    RECEIPT: 'Receipt', PAYMENT: 'Payment', CONTRA: 'Contra', JOURNAL: 'Journal'
  }

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) }
    catch { return d }
  }

  return (
    <div className="report-page">
      {/* Header */}
      <div className="report-header">
        <div>
          <h1 className="tally-form-title">Day Book</h1>
          <p className="text-surface-500 text-xs">
            {activeCompany?.name} &nbsp;·&nbsp;
            {formatDate(periodFrom)} to {formatDate(periodTo)}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 hover:text-brand-300 ml-2 text-[10px]">
              [F2: Change Period]
            </button>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigateTo('voucher-sales')} className="tally-btn-accept text-xs">
            New Sales <span className="text-[10px] opacity-60">F8</span>
          </button>
          <button onClick={() => navigateTo('voucher-purchase')} className="tally-btn-cancel text-xs">
            New Purchase <span className="text-[10px] opacity-60">F9</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="report-filter-bar">
        {(Object.keys(TYPE_LABELS) as VType[]).map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`report-filter-btn ${filterType === t ? 'report-filter-btn-active' : ''}`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
        <div className="flex-1" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vouchers..."
          className="tally-field-input text-xs w-44"
        />
      </div>

      {/* Table */}
      <div className="report-table-container">
        {loading ? (
          <div className="text-center py-16 text-surface-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-surface-500">
            <span className="text-4xl block mb-3">📋</span>
            No vouchers for this period
            <br />
            <span className="text-xs text-surface-600 mt-1 block">
              Press F8 for Sales or F9 for Purchase
            </span>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr className="report-table-head">
                <th className="text-left">Date</th>
                <th className="text-left">Voucher No.</th>
                <th className="text-left">Type</th>
                <th className="text-left">Party</th>
                <th className="text-left">Narration</th>
                <th className="text-right">Amount (₹)</th>
                <th className="text-center">Status</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v: any) => (
                <tr key={v.id} className="report-table-row group">
                  <td className="text-xs font-mono">{formatDate(v.voucherDate)}</td>
                  <td className="text-xs font-mono text-brand-400">{v.voucherNumber}</td>
                  <td>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${TYPE_COLOR[v.voucherType] ?? ''}`}>
                      {v.voucherType}
                    </span>
                  </td>
                  <td className="text-sm">{v.partyName || <span className="text-surface-600 text-xs">—</span>}</td>
                  <td className="text-xs text-surface-400 max-w-48 truncate">{v.narration || '—'}</td>
                  <td className="text-right font-mono font-semibold">
                    {v.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      v.status === 'CONFIRMED' ? 'text-green-400 bg-green-400/10' :
                      v.status === 'DRAFT' ? 'text-amber-400 bg-amber-400/10' :
                      'text-red-400 bg-red-400/10'
                    }`}>{v.status}</span>
                  </td>
                  <td>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete ${v.voucherNumber}?`)) {
                          await deleteVoucher(v.id)
                          load()
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 text-xs transition-all"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="report-table-foot">
                <td colSpan={5} className="text-right text-xs text-surface-400">
                  {filtered.length} vouchers
                </td>
                <td className="text-right font-mono font-bold text-white text-sm">
                  ₹{totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
