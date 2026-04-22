import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { getLedgers, dbGetAll } from '../../lib/db'

interface Ledger { id: string; name: string; groupName: string; nature: string; currentBalance: number; balanceType: string; openingBalance: number }
interface Transaction { voucherId: string; voucherNumber: string; voucherDate: string; voucherType: string; narration: string; amount: number; isDebit: number; balance: number }

const VTYPE_COLOR: Record<string, string> = {
  SALES: 'text-green-400', PURCHASE: 'text-blue-400',
  RECEIPT: 'text-emerald-400', PAYMENT: 'text-red-400',
  CONTRA: 'text-amber-400', JOURNAL: 'text-purple-400',
}
const VTYPE_ABBR: Record<string, string> = {
  SALES: 'Sal', PURCHASE: 'Pur', RECEIPT: 'Rec',
  PAYMENT: 'Pay', CONTRA: 'Cntr', JOURNAL: 'Jrnl',
  CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN',
}

export default function LedgerStatementPage() {
  const { activeCompany } = useCompanyStore()
  const { setShowPeriodSelector, periodFrom, periodTo } = useNavigationStore()

  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [showLedgerDrop, setShowLedgerDrop] = useState(false)

  useEffect(() => {
    if (activeCompany?.id) getLedgers(activeCompany.id).then(setLedgers)
  }, [activeCompany?.id])

  useKeyboardShortcuts([{ key: 'F2', handler: () => setShowPeriodSelector(true) }])

  const loadTransactions = useCallback(async (ledgerId: string) => {
    if (!activeCompany?.id) return
    setLoading(true)
    const rows = await dbGetAll(`
      SELECT vi.amount, vi.isDebit, vi.description,
             v.id as voucherId, v.voucherNumber, v.voucherDate, v.voucherType, v.narration
      FROM VoucherItem vi
      JOIN Voucher v ON vi.voucherId = v.id
      WHERE vi.ledgerId = ? AND v.companyId = ?
        AND v.voucherDate >= ? AND v.voucherDate <= ?
        AND v.status = 'CONFIRMED'
      ORDER BY v.voucherDate ASC, v.createdAt ASC
    `, [ledgerId, activeCompany.id, periodFrom, periodTo])

    // Running balance starting from opening balance
    const led = ledgers.find(l => l.id === ledgerId)
    let runningBal = led?.openingBalance ?? 0

    const txns: Transaction[] = rows.map((r: any) => {
      if (r.isDebit) runningBal += r.amount
      else runningBal -= r.amount
      return { ...r, balance: runningBal }
    })

    setTransactions(txns)
    setLoading(false)
  }, [activeCompany?.id, ledgers, periodFrom, periodTo])

  useEffect(() => {
    if (selectedLedger) loadTransactions(selectedLedger.id)
  }, [selectedLedger, periodFrom, periodTo])

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) } catch { return d } }

  const filteredLedgers = ledgers.filter(l => l.name.toLowerCase().includes(ledgerSearch.toLowerCase()))

  const totalDebit  = transactions.filter(t => t.isDebit).reduce((s, t) => s + t.amount, 0)
  const totalCredit = transactions.filter(t => !t.isDebit).reduce((s, t) => s + t.amount, 0)
  const closingBal  = (selectedLedger?.openingBalance ?? 0) + totalDebit - totalCredit

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h1 className="tally-form-title">Ledger Statement</h1>
          <p className="text-surface-500 text-xs">
            {activeCompany?.name}
            {selectedLedger && <> &nbsp;·&nbsp; <span className="text-brand-400">{selectedLedger.name}</span></>}
            <button onClick={() => setShowPeriodSelector(true)} className="text-brand-400 ml-2 text-[10px]">[F2: Period]</button>
          </p>
        </div>
        {/* Ledger Picker */}
        <div className="relative w-64">
          <input
            value={ledgerSearch || selectedLedger?.name || ''}
            onChange={e => { setLedgerSearch(e.target.value); setShowLedgerDrop(true) }}
            onFocus={() => setShowLedgerDrop(true)}
            onBlur={() => setTimeout(() => setShowLedgerDrop(false), 200)}
            className="tally-field-input w-full text-xs"
            placeholder="Select ledger..."
          />
          {showLedgerDrop && filteredLedgers.length > 0 && (
            <div className="tally-dropdown z-50 max-h-56">
              {filteredLedgers.slice(0, 20).map(l => (
                <button key={l.id} className="tally-dropdown-item"
                  onMouseDown={() => {
                    setSelectedLedger(l); setLedgerSearch(''); setShowLedgerDrop(false)
                  }}>
                  <span>{l.name}</span>
                  <span className="text-surface-600 text-[10px] ml-2">{l.groupName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!selectedLedger ? (
        <div className="flex-1 flex flex-col items-center justify-center text-surface-500 gap-3">
          <span className="text-5xl">📒</span>
          <span className="text-sm">Select a ledger to view its statement</span>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center text-surface-400">Loading...</div>
      ) : (
        <>
          {/* Opening balance */}
          <div className="flex items-center justify-between px-5 py-2 bg-surface-900/40 border-b border-surface-800 text-xs flex-shrink-0">
            <span className="text-surface-400">Opening Balance</span>
            <span className="font-mono font-semibold text-white">
              {fmt(selectedLedger.openingBalance)} {selectedLedger.balanceType === 'DEBIT' ? 'Dr' : 'Cr'}
            </span>
          </div>

          {/* Transactions */}
          <div className="report-table-container">
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-surface-500">
                <span className="text-4xl block mb-3">📋</span>
                No transactions in this period
              </div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr className="report-table-head">
                    <th className="text-left">Date</th>
                    <th className="text-left">Voucher</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Narration</th>
                    <th className="text-right">Debit (₹)</th>
                    <th className="text-right">Credit (₹)</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={`${t.voucherId}-${i}`} className="report-table-row">
                      <td className="text-xs font-mono">{formatDate(t.voucherDate)}</td>
                      <td className="text-xs font-mono text-brand-400">{t.voucherNumber}</td>
                      <td>
                        <span className={`text-[10px] font-bold ${VTYPE_COLOR[t.voucherType] ?? 'text-surface-400'}`}>
                          {VTYPE_ABBR[t.voucherType] ?? t.voucherType}
                        </span>
                      </td>
                      <td className="text-xs text-surface-400 max-w-48 truncate">{t.narration || '—'}</td>
                      <td className="text-right font-mono text-green-400">
                        {t.isDebit ? fmt(t.amount) : ''}
                      </td>
                      <td className="text-right font-mono text-red-400">
                        {!t.isDebit ? fmt(t.amount) : ''}
                      </td>
                      <td className={`text-right font-mono text-xs font-semibold ${t.balance >= 0 ? 'text-white' : 'text-red-300'}`}>
                        {fmt(t.balance)} {t.balance >= 0 ? 'Dr' : 'Cr'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="report-table-foot">
                    <td colSpan={4} className="text-right text-xs text-surface-400">{transactions.length} transactions</td>
                    <td className="text-right font-mono font-bold text-green-400">{fmt(totalDebit)}</td>
                    <td className="text-right font-mono font-bold text-red-400">{fmt(totalCredit)}</td>
                    <td className="text-right font-mono font-bold text-white">
                      {fmt(closingBal)} {closingBal >= 0 ? 'Dr' : 'Cr'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Closing balance */}
          <div className="flex items-center justify-between px-5 py-3 bg-surface-900/60 border-t border-surface-800 text-sm font-bold flex-shrink-0">
            <span className="text-surface-300">Closing Balance</span>
            <span className={`font-mono font-bold text-lg ${closingBal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmt(closingBal)} {closingBal >= 0 ? 'Dr' : 'Cr'}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
