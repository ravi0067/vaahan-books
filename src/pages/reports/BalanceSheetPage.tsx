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

export default function BalanceSheetPage() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodFrom, periodTo } = useNavigationStore()

  const [groups, setGroups] = useState<Group[]>([])
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [loading, setLoading] = useState(true)
  const [detailed, setDetailed] = useState(false)

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)
    const [g, l] = await Promise.all([
      getAccountGroups(activeCompany.id),
      getLedgers(activeCompany.id),
    ])
    setGroups(g)
    setLedgers(l)
    setLoading(false)
  }, [activeCompany?.id])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([
    { key: 'F2', handler: () => setShowPeriodSelector(true) },
    { key: 'F5', handler: () => setDetailed(d => !d) },
  ])

  // Calculate totals by nature
  const sum = (nature: string, balType: 'DEBIT' | 'CREDIT') =>
    ledgers
      .filter(l => l.nature === nature && l.balanceType === balType)
      .reduce((s, l) => s + Math.abs(l.currentBalance), 0)

  const assets    = sum('ASSETS', 'DEBIT')
  const liab      = sum('LIABILITIES', 'CREDIT')
  const income    = sum('INCOME', 'CREDIT')
  const expenses  = sum('EXPENSE', 'DEBIT')
  const profit    = income - expenses

  // Total both sides of Balance Sheet
  const totalLiab = liab + (profit > 0 ? profit : 0)
  const totalAssets = assets + (profit < 0 ? Math.abs(profit) : 0)

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return d }
  }

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  // Group ledgers by account group
  const ledgersByGroup = (groupId: string) => ledgers.filter(l => l.accountGroupId === groupId)

  // Render a nature section
  const renderSection = (nature: 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSE') => {
    const topGroups = groups.filter(g => g.nature === nature && !g.parentId)
    const subGroups = (parentId: string) => groups.filter(g => g.parentId === parentId)

    return topGroups.map(pg => {
      const subs = subGroups(pg.id)
      const pgTotal = [...subs.map(sg => ledgersByGroup(sg.id)), ledgersByGroup(pg.id)]
        .flat().reduce((s, l) => s + Math.abs(l.currentBalance), 0)

      return (
        <div key={pg.id} className="bs-group">
          <div className="bs-group-header">
            <span>{pg.name}</span>
            <span className="font-mono text-sm font-semibold text-white">{fmt(pgTotal)}</span>
          </div>
          {detailed && (
            <>
              {subs.map(sg => (
                <div key={sg.id}>
                  <div className="bs-subgroup-header">
                    <span>{sg.name}</span>
                  </div>
                  {ledgersByGroup(sg.id).map(l => (
                    <div key={l.id} className="bs-ledger-row">
                      <span>{l.name}</span>
                      <span className={`font-mono text-xs ${l.balanceType === 'DEBIT' ? 'text-green-400' : 'text-red-400'}`}>
                        {fmt(l.currentBalance)} {l.balanceType === 'DEBIT' ? 'Dr' : 'Cr'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              {ledgersByGroup(pg.id).map(l => (
                <div key={l.id} className="bs-ledger-row">
                  <span>{l.name}</span>
                  <span className={`font-mono text-xs ${l.balanceType === 'DEBIT' ? 'text-green-400' : 'text-red-400'}`}>
                    {fmt(l.currentBalance)} {l.balanceType === 'DEBIT' ? 'Dr' : 'Cr'}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )
    })
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-surface-400">Loading Balance Sheet...</div>
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h1 className="tally-form-title">Balance Sheet</h1>
          <p className="text-surface-500 text-xs">
            {activeCompany?.name} &nbsp;·&nbsp; As on {formatDate(periodTo)}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 ml-2 text-[10px]">[F2]</button>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setDetailed(d => !d)}
            className={`tally-btn-cancel text-xs ${detailed ? 'border-brand-500 text-brand-400' : ''}`}
          >
            {detailed ? 'Condensed' : 'Detailed'} <span className="opacity-60 text-[10px]">F5</span>
          </button>
        </div>
      </div>

      {/* T-Format Balance Sheet */}
      <div className="bs-grid">
        {/* LIABILITIES */}
        <div className="bs-side">
          <div className="bs-side-header bs-liabilities-header">
            <span>LIABILITIES</span>
            <span className="font-mono">{fmt(totalLiab)}</span>
          </div>

          {renderSection('LIABILITIES')}

          {/* Profit/Loss */}
          {profit !== 0 && (
            <div className="bs-group">
              <div className="bs-group-header">
                <span>{profit >= 0 ? 'Net Profit' : 'Net Loss'}</span>
                <span className={`font-mono text-sm font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmt(profit)}
                </span>
              </div>
            </div>
          )}

          <div className="bs-total-row">
            <span>Total</span>
            <span className="font-mono font-bold text-white">{fmt(totalLiab)}</span>
          </div>
        </div>

        {/* ASSETS */}
        <div className="bs-side bs-assets-side">
          <div className="bs-side-header bs-assets-header">
            <span>ASSETS</span>
            <span className="font-mono">{fmt(totalAssets)}</span>
          </div>

          {renderSection('ASSETS')}

          {profit < 0 && (
            <div className="bs-group">
              <div className="bs-group-header">
                <span>Net Loss</span>
                <span className="font-mono text-sm font-semibold text-red-400">{fmt(profit)}</span>
              </div>
            </div>
          )}

          <div className="bs-total-row">
            <span>Total</span>
            <span className="font-mono font-bold text-white">{fmt(totalAssets)}</span>
          </div>
        </div>
      </div>

      {/* P&L Mini Summary */}
      <div className="bs-pnl-footer">
        <span className="text-surface-400 text-xs">P&amp;L Summary:</span>
        <span className="text-blue-400 text-xs font-mono">Income: {fmt(income)}</span>
        <span className="text-orange-400 text-xs font-mono">Expenses: {fmt(expenses)}</span>
        <span className={`text-sm font-bold font-mono ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {profit >= 0 ? 'Net Profit' : 'Net Loss'}: {fmt(profit)}
        </span>
      </div>
    </div>
  )
}
