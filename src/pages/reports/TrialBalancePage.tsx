import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { getLedgers } from '../../lib/db'

interface Ledger {
  id: string; name: string; groupName: string; nature: string
  currentBalance: number; balanceType: string; openingBalance: number
}

export default function TrialBalancePage() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodTo } = useNavigationStore()
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'group' | 'debit' | 'credit'>('name')

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)
    const data = await getLedgers(activeCompany.id)
    setLedgers(data); setLoading(false)
  }, [activeCompany?.id])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([{ key: 'F2', handler: () => setShowPeriodSelector(true) }])

  const fmt = (n: number) => n > 0 ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d } }

  const filtered = ledgers
    .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.groupName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'group') return a.groupName.localeCompare(b.groupName)
      if (sortBy === 'debit') return (b.balanceType === 'DEBIT' ? b.currentBalance : 0) - (a.balanceType === 'DEBIT' ? a.currentBalance : 0)
      return (b.balanceType === 'CREDIT' ? b.currentBalance : 0) - (a.balanceType === 'CREDIT' ? a.currentBalance : 0)
    })

  const totalDebit  = ledgers.filter(l => l.balanceType === 'DEBIT').reduce((s, l) => s + Math.abs(l.currentBalance), 0)
  const totalCredit = ledgers.filter(l => l.balanceType === 'CREDIT').reduce((s, l) => s + Math.abs(l.currentBalance), 0)
  const diff = Math.abs(totalDebit - totalCredit)
  const isBalanced = diff < 0.01

  const NATURE_COLOR: Record<string, string> = {
    ASSETS: 'text-green-400', LIABILITIES: 'text-red-400',
    INCOME: 'text-blue-400', EXPENSE: 'text-orange-400',
  }

  const SortIcon = ({ col }: { col: string }) => (
    <span className={`ml-1 text-[9px] ${sortBy === col ? 'text-brand-400' : 'text-surface-600'}`}>
      {sortBy === col ? '▼' : '⇅'}
    </span>
  )

  if (loading) return <div className="h-full flex items-center justify-center text-surface-400">Loading Trial Balance...</div>

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h1 className="tally-form-title">Trial Balance</h1>
          <p className="text-surface-500 text-xs">
            {activeCompany?.name} &nbsp;·&nbsp; As on {formatDate(periodTo)}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 ml-2 text-[10px]">[F2]</button>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Balance indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${isBalanced ? 'text-green-400 border-green-500/30 bg-green-400/5' : 'text-red-400 border-red-500/30 bg-red-400/5'}`}>
            {isBalanced ? '✓ Balanced' : `⚠ Diff: ₹${diff.toFixed(2)}`}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ledger..." className="tally-field-input w-44 text-xs" />
        </div>
      </div>

      {/* Table */}
      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr className="report-table-head">
              <th className="text-left cursor-pointer" onClick={() => setSortBy('name')}>
                Particulars <SortIcon col="name" />
              </th>
              <th className="text-left cursor-pointer" onClick={() => setSortBy('group')}>
                Group <SortIcon col="group" />
              </th>
              <th className="text-right cursor-pointer" onClick={() => setSortBy('debit')}>
                Debit (Dr) <SortIcon col="debit" />
              </th>
              <th className="text-right cursor-pointer" onClick={() => setSortBy('credit')}>
                Credit (Cr) <SortIcon col="credit" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => {
              const isDebit = l.balanceType === 'DEBIT'
              const bal = Math.abs(l.currentBalance)
              return (
                <tr key={l.id} className="report-table-row">
                  <td className="font-medium">{l.name}</td>
                  <td>
                    <span className={`text-xs ${NATURE_COLOR[l.nature] ?? 'text-surface-400'}`}>{l.groupName}</span>
                  </td>
                  <td className="text-right font-mono">{isDebit ? fmt(bal) : ''}</td>
                  <td className="text-right font-mono">{!isDebit ? fmt(bal) : ''}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="report-table-foot">
              <td colSpan={2} className="text-right text-xs text-surface-400">
                {filtered.length} ledgers
              </td>
              <td className="text-right font-mono font-bold text-green-400">
                ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="text-right font-mono font-bold text-red-400">
                ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Balance Check */}
        {!isBalanced && (
          <div className="p-4 text-center text-red-400 text-xs border-t border-red-500/20 bg-red-400/5">
            ⚠ Trial Balance is not balanced. Difference: ₹{diff.toFixed(2)}
            <br />Check for missing entries or incorrect vouchers.
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-surface-500">
            <span className="text-4xl block mb-3">📊</span>
            No ledgers found. Create ledgers and post vouchers first.
          </div>
        )}
      </div>
    </div>
  )
}
