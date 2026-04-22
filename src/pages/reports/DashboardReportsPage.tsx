import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { getLedgers, getVouchers } from '../../lib/db'

interface DashStat { label: string; value: string; sub?: string; color: string; icon: string }

export default function DashboardReportsPage() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodFrom, periodTo } = useNavigationStore()
  const [stats, setStats] = useState<DashStat[]>([])
  const [salesData, setSalesData] = useState<{ date: string; amount: number }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)

    const [ledgers, sales, purchases, receipts, payments] = await Promise.all([
      getLedgers(activeCompany.id),
      getVouchers(activeCompany.id, { type: 'SALES', from: periodFrom, to: periodTo }),
      getVouchers(activeCompany.id, { type: 'PURCHASE', from: periodFrom, to: periodTo }),
      getVouchers(activeCompany.id, { type: 'RECEIPT', from: periodFrom, to: periodTo }),
      getVouchers(activeCompany.id, { type: 'PAYMENT', from: periodFrom, to: periodTo }),
    ])

    const cashLed = ledgers.find(l => l.name.toLowerCase() === 'cash' || l.groupName === 'Cash-in-Hand')
    const bankLeds = ledgers.filter(l => l.groupName === 'Bank Accounts')
    const debtorLeds = ledgers.filter(l => l.groupName === 'Sundry Debtors')
    const creditorLeds = ledgers.filter(l => l.groupName === 'Sundry Creditors')
    const salesAmt = sales.reduce((s: number, v: any) => s + (v.totalAmount ?? 0), 0)
    const purchaseAmt = purchases.reduce((s: number, v: any) => s + (v.totalAmount ?? 0), 0)
    const grossProfit = salesAmt - purchaseAmt
    const cashBalance = cashLed?.currentBalance ?? 0
    const bankBalance = bankLeds.reduce((s, l) => s + Math.abs(l.currentBalance), 0)
    const receivable = debtorLeds.reduce((s, l) => s + Math.abs(l.currentBalance), 0)
    const payable = creditorLeds.reduce((s, l) => s + Math.abs(l.currentBalance), 0)
    const receiptAmt = receipts.reduce((s: number, v: any) => s + (v.totalAmount ?? 0), 0)
    const paymentAmt = payments.reduce((s: number, v: any) => s + (v.totalAmount ?? 0), 0)

    setStats([
      { label: 'Total Sales', value: fmtK(salesAmt), sub: `${sales.length} vouchers`, color: 'from-green-600/20 to-green-500/5 border-green-500/20', icon: '📈' },
      { label: 'Total Purchase', value: fmtK(purchaseAmt), sub: `${purchases.length} vouchers`, color: 'from-blue-600/20 to-blue-500/5 border-blue-500/20', icon: '📦' },
      { label: 'Gross Profit', value: fmtK(grossProfit), sub: grossProfit >= 0 ? 'Profit ▲' : 'Loss ▼', color: grossProfit >= 0 ? 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/20' : 'from-red-600/20 to-red-500/5 border-red-500/20', icon: grossProfit >= 0 ? '💹' : '📉' },
      { label: 'Cash Balance', value: fmtK(cashBalance), sub: 'Cash-in-Hand', color: 'from-amber-600/20 to-amber-500/5 border-amber-500/20', icon: '💰' },
      { label: 'Bank Balance', value: fmtK(bankBalance), sub: `${bankLeds.length} accounts`, color: 'from-cyan-600/20 to-cyan-500/5 border-cyan-500/20', icon: '🏦' },
      { label: 'Receivable', value: fmtK(receivable), sub: `${debtorLeds.length} parties`, color: 'from-violet-600/20 to-violet-500/5 border-violet-500/20', icon: '📥' },
      { label: 'Payable', value: fmtK(payable), sub: `${creditorLeds.length} parties`, color: 'from-rose-600/20 to-rose-500/5 border-rose-500/20', icon: '📤' },
      { label: 'Net Cash Flow', value: fmtK(receiptAmt - paymentAmt), sub: `In: ${fmtK(receiptAmt)} Out: ${fmtK(paymentAmt)}`, color: 'from-indigo-600/20 to-indigo-500/5 border-indigo-500/20', icon: '🌊' },
    ])

    // Daily sales chart data
    const byDate: Record<string, number> = {}
    sales.forEach((v: any) => {
      const d = (v.voucherDate ?? '').substring(0, 10)
      if (d) byDate[d] = (byDate[d] ?? 0) + (v.totalAmount ?? 0)
    })
    const chartData = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, amount]) => ({ date, amount }))
    setSalesData(chartData)
    setLoading(false)
  }, [activeCompany?.id, periodFrom, periodTo])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([
    { key: 'F2', handler: () => setShowPeriodSelector(true) },
    { key: 'F5', handler: () => load() },
  ])

  function fmtK(n: number) {
    const abs = Math.abs(n)
    if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`
    if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`
    if (abs >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`
    return `₹${n.toFixed(0)}`
  }

  const maxSales = salesData.length ? Math.max(...salesData.map(d => d.amount)) : 1

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    } catch { return d }
  }

  if (loading) return <div className="h-full flex items-center justify-center text-surface-400">Loading Dashboard...</div>

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h1 className="tally-form-title">Business Dashboard</h1>
          <p className="text-surface-500 text-xs">
            {activeCompany?.name} &nbsp;·&nbsp;
            {new Date(periodFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} –&nbsp;
            {new Date(periodTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 ml-2 text-[10px]">[F2: Period]</button>
          </p>
        </div>
        <button onClick={() => load()} className="tally-btn-cancel text-xs">
          ⟳ Refresh <span className="opacity-50 text-[10px]">F5</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label}
              className={`rounded-xl border bg-gradient-to-br ${s.color} p-4 flex flex-col gap-1.5 relative overflow-hidden`}>
              <div className="absolute right-3 top-3 text-2xl opacity-20">{s.icon}</div>
              <div className="text-xs text-surface-400 font-medium">{s.label}</div>
              <div className="text-xl font-bold font-mono text-white">{s.value}</div>
              {s.sub && <div className="text-xs text-surface-500">{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Sales Chart (Mini Bar) */}
        {salesData.length > 0 && (
          <div className="rounded-xl border border-surface-800 bg-surface-900/30 p-4">
            <div className="text-xs text-surface-400 font-semibold uppercase tracking-wide mb-3">
              Daily Sales (Last 14 days)
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {salesData.map(d => {
                const pct = (d.amount / maxSales) * 100
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-brand-600 to-brand-400 transition-all"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                    <div className="text-[9px] text-surface-600 rotate-45 origin-left whitespace-nowrap">
                      {formatDate(d.date)}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 bg-surface-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {formatDate(d.date)}: ₹{d.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {salesData.length === 0 && (
          <div className="rounded-xl border border-dashed border-surface-700 p-8 text-center text-surface-500">
            <span className="text-3xl block mb-2">📊</span>
            <span className="text-sm">No sales data yet.</span>
            <br /><span className="text-xs">Create sales vouchers (F8) to see charts.</span>
          </div>
        )}
      </div>
    </div>
  )
}
