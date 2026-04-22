import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { getLedgers, getAccountGroups } from '../../lib/db'

interface Ledger {
  id: string; name: string; accountGroupId: string; groupName: string
  nature: string; currentBalance: number; balanceType: string; openingBalance: number
}
interface Group {
  id: string; name: string; nature: string; parentId: string | null
}

export default function ProfitLossPage() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodFrom, periodTo } = useNavigationStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [loading, setLoading] = useState(true)
  const [detailed, setDetailed] = useState(false)

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)
    const [g, l] = await Promise.all([getAccountGroups(activeCompany.id), getLedgers(activeCompany.id)])
    setGroups(g); setLedgers(l); setLoading(false)
  }, [activeCompany?.id])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([
    { key: 'F2', handler: () => setShowPeriodSelector(true) },
    { key: 'F5', handler: () => setDetailed(d => !d) },
  ])

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d } }

  // Summarise by group
  const sumByNature = (nature: string) => {
    const topGroups = groups.filter(g => g.nature === nature && !g.parentId)
    return topGroups.map(pg => {
      const allSubs = groups.filter(g => g.parentId === pg.id)
      const allLeds = [...ledgers.filter(l => l.accountGroupId === pg.id), ...allSubs.flatMap(s => ledgers.filter(l => l.accountGroupId === s.id))]
      const total = allLeds.reduce((s, l) => s + Math.abs(l.currentBalance), 0)
      return { group: pg, subs: allSubs, ledgers: allLeds, total }
    }).filter(x => x.total > 0)
  }

  const incomeData = sumByNature('INCOME')
  const expenseData = sumByNature('EXPENSE')

  const totalIncome = incomeData.reduce((s, x) => s + x.total, 0)
  const totalExpense = expenseData.reduce((s, x) => s + x.total, 0)
  const grossProfit = totalIncome - totalExpense
  const isProfit = grossProfit >= 0

  if (loading) return <div className="h-full flex items-center justify-center text-surface-400">Loading P&L...</div>

  const renderSection = (data: typeof incomeData) =>
    data.map(({ group, subs, ledgers: leds, total }) => (
      <div key={group.id} className="bs-group">
        <div className="bs-group-header">
          <span>{group.name}</span>
          <span className="font-mono text-sm font-semibold text-white">{fmt(total)}</span>
        </div>
        {detailed && (
          <>
            {leds.filter(l => l.accountGroupId === group.id).map(l => (
              <div key={l.id} className="bs-ledger-row">
                <span>{l.name}</span>
                <span className="font-mono text-xs text-surface-400">{fmt(l.currentBalance)}</span>
              </div>
            ))}
            {subs.map(sub => (
              <div key={sub.id}>
                <div className="bs-subgroup-header"><span>{sub.name}</span></div>
                {leds.filter(l => l.accountGroupId === sub.id).map(l => (
                  <div key={l.id} className="bs-ledger-row pl-12">
                    <span>{l.name}</span>
                    <span className="font-mono text-xs text-surface-400">{fmt(l.currentBalance)}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    ))

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h1 className="tally-form-title">Profit & Loss Account</h1>
          <p className="text-surface-500 text-xs">
            {activeCompany?.name} &nbsp;·&nbsp; {formatDate(periodFrom)} to {formatDate(periodTo)}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 ml-2 text-[10px]">[F2: Change Period]</button>
          </p>
        </div>
        <button onClick={() => setDetailed(d => !d)} className={`tally-btn-cancel text-xs ${detailed ? 'border-brand-500 text-brand-400' : ''}`}>
          {detailed ? 'Condensed' : 'Detailed'} <span className="opacity-60 text-[10px]">F5</span>
        </button>
      </div>

      {/* T-Format P&L */}
      <div className="bs-grid">
        {/* EXPENSES (Left) */}
        <div className="bs-side">
          <div className="bs-side-header bs-liabilities-header">
            <span>EXPENSES</span>
            <span className="font-mono">{fmt(totalExpense)}</span>
          </div>

          {renderSection(expenseData)}

          {/* Net Profit goes on expense side if profit */}
          {isProfit && (
            <div className="bs-group">
              <div className="bs-group-header">
                <span className="text-green-400 font-bold">Net Profit</span>
                <span className="font-mono text-green-400 font-bold text-sm">{fmt(grossProfit)}</span>
              </div>
            </div>
          )}

          <div className="bs-total-row">
            <span>Total</span>
            <span className="font-mono font-bold text-white">{fmt(totalIncome)}</span>
          </div>
        </div>

        {/* INCOME (Right) */}
        <div className="bs-side bs-assets-side">
          <div className="bs-side-header bs-assets-header">
            <span>INCOME</span>
            <span className="font-mono">{fmt(totalIncome)}</span>
          </div>

          {renderSection(incomeData)}

          {/* Net Loss goes on income side if loss */}
          {!isProfit && (
            <div className="bs-group">
              <div className="bs-group-header">
                <span className="text-red-400 font-bold">Net Loss</span>
                <span className="font-mono text-red-400 font-bold text-sm">{fmt(grossProfit)}</span>
              </div>
            </div>
          )}

          <div className="bs-total-row">
            <span>Total</span>
            <span className="font-mono font-bold text-white">{fmt(totalIncome)}</span>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bs-pnl-footer">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-surface-500">Total Income</div>
            <div className="font-mono font-bold text-blue-400">{fmt(totalIncome)}</div>
          </div>
          <div className="text-surface-600">−</div>
          <div className="text-center">
            <div className="text-xs text-surface-500">Total Expenses</div>
            <div className="font-mono font-bold text-orange-400">{fmt(totalExpense)}</div>
          </div>
          <div className="text-surface-600">=</div>
          <div className="text-center">
            <div className="text-xs text-surface-500">{isProfit ? 'Net Profit' : 'Net Loss'}</div>
            <div className={`font-mono font-bold text-xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>{fmt(grossProfit)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
