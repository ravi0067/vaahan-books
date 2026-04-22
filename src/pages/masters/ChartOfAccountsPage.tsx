import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { getLedgers, getAccountGroups } from '../../lib/db'

interface AccountGroup {
  id: string; name: string; nature: string; parentId: string | null; parentName?: string
}
interface Ledger {
  id: string; name: string; accountGroupId: string; groupName: string
  nature: string; currentBalance: number; balanceType: string; ledgerType: string
}

const NATURE_COLOR: Record<string, string> = {
  ASSETS: '#22c55e', LIABILITIES: '#ef4444', INCOME: '#3b82f6', EXPENSE: '#f97316',
}
const NATURE_BG: Record<string, string> = {
  ASSETS: 'rgba(34,197,94,0.08)', LIABILITIES: 'rgba(239,68,68,0.08)',
  INCOME: 'rgba(59,130,246,0.08)', EXPENSE: 'rgba(249,115,22,0.08)',
}

export default function ChartOfAccountsPage() {
  const { activeCompany } = useCompanyStore()
  const { navigateTo } = useNavigationStore()

  const [groups, setGroups] = useState<AccountGroup[]>([])
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)
    const [g, l] = await Promise.all([
      getAccountGroups(activeCompany.id),
      getLedgers(activeCompany.id),
    ])
    setGroups(g)
    setLedgers(l)
    // Expand all top-level groups by default
    const topLevel = g.filter((gr: AccountGroup) => !gr.parentId)
    setExpandedGroups(new Set(topLevel.map((gr: AccountGroup) => gr.id)))
    setLoading(false)
  }, [activeCompany?.id])

  useEffect(() => { load() }, [load])

  useKeyboardShortcuts([
    { key: 'F5', handler: () => load(), description: 'Refresh' },
    { key: 'F4', handler: () => navigateTo('create-ledger'), description: 'Create Ledger' },
  ])

  // Build tree: primary groups → sub-groups → ledgers
  const buildTree = () => {
    const q = search.toLowerCase()

    const topGroups = groups.filter(g => !g.parentId)

    return topGroups.map(primary => {
      const subGroups = groups.filter(g => g.parentId === primary.id)
      const directLedgers = ledgers.filter(l =>
        l.accountGroupId === primary.id && (!q || l.name.toLowerCase().includes(q))
      )

      const subWithLedgers = subGroups.map(sub => ({
        ...sub,
        ledgers: ledgers.filter(l =>
          l.accountGroupId === sub.id && (!q || l.name.toLowerCase().includes(q))
        ),
        subSubs: groups
          .filter(g => g.parentId === sub.id)
          .map(ss => ({
            ...ss,
            ledgers: ledgers.filter(l =>
              l.accountGroupId === ss.id && (!q || l.name.toLowerCase().includes(q))
            )
          }))
      }))

      // Total balance for this group
      const totalDebit = ledgers
        .filter(l => l.nature === primary.nature && l.balanceType === 'DEBIT')
        .reduce((s, l) => s + (l.currentBalance || 0), 0)

      return { ...primary, subs: subWithLedgers, directLedgers, totalDebit }
    })
  }

  const tree = buildTree()

  const formatAmt = (amt: number, type: string) => {
    const abs = Math.abs(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })
    return `₹${abs} ${type === 'DEBIT' ? 'Dr' : 'Cr'}`
  }

  const totalsByNature = (['ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSE'] as const).map(n => {
    const total = ledgers
      .filter(l => l.nature === n)
      .reduce((s, l) => s + (l.balanceType === 'DEBIT' ? l.currentBalance : -l.currentBalance), 0)
    return { nature: n, total }
  })

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-surface-400">
        Loading Chart of Accounts...
      </div>
    )
  }

  return (
    <div className="coa-page">
      {/* Header */}
      <div className="coa-header">
        <div>
          <h1 className="tally-form-title">Chart of Accounts</h1>
          <p className="text-surface-500 text-xs">{activeCompany?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ledgers..."
            className="tally-field-input w-48 text-xs"
          />
          <button
            onClick={() => navigateTo('create-ledger')}
            className="tally-btn-accept text-xs"
          >
            + Create Ledger <kbd className="text-[10px] ml-1 opacity-60">F4</kbd>
          </button>
          <button
            onClick={() => navigateTo('create-group')}
            className="tally-btn-cancel text-xs"
          >
            + Create Group
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="coa-summary-bar">
        {totalsByNature.map(({ nature, total }) => (
          <div key={nature} className="coa-summary-item" style={{ borderColor: NATURE_COLOR[nature] }}>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: NATURE_COLOR[nature] }}>{nature}</span>
            <span className="font-mono text-sm font-bold text-white">
              ₹{Math.abs(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="coa-tree-container">
        {tree.map(primary => (
          <div key={primary.id} className="coa-primary-group">
            {/* Primary Group Header */}
            <button
              className="coa-group-row coa-primary-row"
              style={{ borderLeftColor: NATURE_COLOR[primary.nature], background: NATURE_BG[primary.nature] }}
              onClick={() => setExpandedGroups(prev => {
                const n = new Set(prev)
                n.has(primary.id) ? n.delete(primary.id) : n.add(primary.id)
                return n
              })}
            >
              <span className="coa-expand-icon">
                {expandedGroups.has(primary.id) ? '▼' : '►'}
              </span>
              <span className="flex-1 font-semibold text-white">{primary.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold"
                style={{ color: NATURE_COLOR[primary.nature], background: NATURE_BG[primary.nature] }}>
                {primary.nature}
              </span>
            </button>

            {expandedGroups.has(primary.id) && (
              <div className="coa-group-children">
                {/* Direct ledgers under primary */}
                {primary.directLedgers.map(l => (
                  <LedgerRow key={l.id} ledger={l} depth={1} selected={selectedId === l.id}
                    onSelect={() => setSelectedId(l.id)} />
                ))}

                {/* Sub-groups */}
                {primary.subs.map(sub => (
                  <div key={sub.id}>
                    <button
                      className="coa-group-row coa-sub-row"
                      onClick={() => setExpandedGroups(prev => {
                        const n = new Set(prev)
                        n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id)
                        return n
                      })}
                    >
                      <span style={{ width: 20 }} />
                      <span className="coa-expand-icon">
                        {expandedGroups.has(sub.id) ? '▼' : '►'}
                      </span>
                      <span className="flex-1">{sub.name}</span>
                      <span className="text-surface-600 text-[10px]">{sub.ledgers.length + sub.subSubs.reduce((a, ss) => a + ss.ledgers.length, 0)} ledgers</span>
                    </button>

                    {expandedGroups.has(sub.id) && (
                      <>
                        {sub.ledgers.map(l => (
                          <LedgerRow key={l.id} ledger={l} depth={2} selected={selectedId === l.id}
                            onSelect={() => setSelectedId(l.id)} />
                        ))}
                        {sub.subSubs.map(ss => (
                          <div key={ss.id}>
                            <button
                              className="coa-group-row coa-subsub-row"
                              onClick={() => setExpandedGroups(prev => {
                                const n = new Set(prev)
                                n.has(ss.id) ? n.delete(ss.id) : n.add(ss.id)
                                return n
                              })}
                            >
                              <span style={{ width: 36 }} />
                              <span className="coa-expand-icon">
                                {expandedGroups.has(ss.id) ? '▼' : '►'}
                              </span>
                              <span className="flex-1">{ss.name}</span>
                            </button>
                            {expandedGroups.has(ss.id) && ss.ledgers.map(l => (
                              <LedgerRow key={l.id} ledger={l} depth={3} selected={selectedId === l.id}
                                onSelect={() => setSelectedId(l.id)} />
                            ))}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {tree.length === 0 && (
          <div className="text-center py-16 text-surface-500">
            <span className="text-4xl block mb-3">📋</span>
            No accounts found. Create a company first.
          </div>
        )}
      </div>
    </div>
  )
}

function LedgerRow({ ledger, depth, selected, onSelect }: {
  ledger: Ledger, depth: number, selected: boolean, onSelect: () => void
}) {
  const bal = Math.abs(ledger.currentBalance)
  const balStr = `₹${bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${ledger.balanceType === 'DEBIT' ? 'Dr' : 'Cr'}`
  const balColor = ledger.balanceType === 'DEBIT' ? 'text-green-400' : 'text-red-400'

  return (
    <div
      className={`coa-ledger-row ${selected ? 'coa-ledger-row-active' : ''}`}
      style={{ paddingLeft: `${12 + depth * 20}px` }}
      onClick={onSelect}
    >
      <span className="coa-ledger-dot" />
      <span className="flex-1 text-sm">{ledger.name}</span>
      <span className={`font-mono text-xs ${balColor}`}>{balStr}</span>
    </div>
  )
}
