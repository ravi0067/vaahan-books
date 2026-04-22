import { useState, useRef, useEffect } from 'react'
import { useNavigationStore, type PageId } from '../hooks/useNavigationStore'

interface SearchItem {
  id: string
  label: string
  category: string
  pageId: PageId
  shortcut?: string
}

const ALL_ITEMS: SearchItem[] = [
  // Masters
  { id: 'create-ledger', label: 'Create Ledger', category: 'Masters', pageId: 'create-ledger' },
  { id: 'alter-ledger', label: 'Alter Ledger', category: 'Masters', pageId: 'alter-ledger' },
  { id: 'create-group', label: 'Create Group', category: 'Masters', pageId: 'create-group' },
  { id: 'chart-of-accounts', label: 'Chart of Accounts', category: 'Masters', pageId: 'chart-of-accounts' },
  
  // Vouchers
  { id: 'sales', label: 'Sales Voucher', category: 'Vouchers', pageId: 'voucher-sales', shortcut: 'F8' },
  { id: 'purchase', label: 'Purchase Voucher', category: 'Vouchers', pageId: 'voucher-purchase', shortcut: 'F9' },
  { id: 'payment', label: 'Payment Voucher', category: 'Vouchers', pageId: 'voucher-payment', shortcut: 'F5' },
  { id: 'receipt', label: 'Receipt Voucher', category: 'Vouchers', pageId: 'voucher-receipt', shortcut: 'F6' },
  { id: 'contra', label: 'Contra Voucher', category: 'Vouchers', pageId: 'voucher-contra', shortcut: 'F4' },
  { id: 'journal', label: 'Journal Voucher', category: 'Vouchers', pageId: 'voucher-journal', shortcut: 'F7' },
  { id: 'day-book', label: 'Day Book', category: 'Vouchers', pageId: 'day-book' },
  
  // Reports
  { id: 'balance-sheet', label: 'Balance Sheet', category: 'Reports', pageId: 'balance-sheet' },
  { id: 'profit-loss', label: 'Profit & Loss', category: 'Reports', pageId: 'profit-loss' },
  { id: 'trial-balance', label: 'Trial Balance', category: 'Reports', pageId: 'trial-balance' },
  { id: 'cash-flow', label: 'Cash Flow', category: 'Reports', pageId: 'cash-flow' },
  { id: 'fund-flow', label: 'Fund Flow', category: 'Reports', pageId: 'fund-flow' },
  { id: 'ratio-analysis', label: 'Ratio Analysis', category: 'Reports', pageId: 'ratio-analysis' },
  { id: 'receivables', label: 'Bills Receivable', category: 'Reports', pageId: 'receivables' },
  { id: 'payables', label: 'Bills Payable', category: 'Reports', pageId: 'payables' },
  { id: 'ledger-statement', label: 'Ledger Statement', category: 'Reports', pageId: 'ledger-statement' },
  { id: 'dashboard-reports', label: 'Dashboard Reports', category: 'Reports', pageId: 'dashboard-reports' },
  
  // GST
  { id: 'gstr1', label: 'GSTR-1', category: 'GST', pageId: 'gstr1' },
  { id: 'gstr3b', label: 'GSTR-3B', category: 'GST', pageId: 'gstr3b' },
  { id: 'gst-computation', label: 'GST Computation', category: 'GST', pageId: 'gst-computation' },
  
  // Inventory
  { id: 'stock-summary', label: 'Stock Summary', category: 'Inventory', pageId: 'stock-summary' },
  { id: 'stock-item', label: 'Create Stock Item', category: 'Inventory', pageId: 'stock-item' },
  { id: 'stock-group', label: 'Stock Group', category: 'Inventory', pageId: 'stock-group' },
  { id: 'godown', label: 'Godown/Warehouse', category: 'Inventory', pageId: 'godown' },
  
  // Banking
  { id: 'bank-recon', label: 'Bank Reconciliation', category: 'Banking', pageId: 'bank-reconciliation' },
  
  // Settings
  { id: 'company-features', label: 'Company Features', category: 'Settings', pageId: 'company-features', shortcut: 'F11' },
  { id: 'backup', label: 'Backup & Restore', category: 'Utilities', pageId: 'backup-restore' },
  { id: 'import', label: 'Import Data', category: 'Utilities', pageId: 'import-data' },
  { id: 'export', label: 'Export Data', category: 'Utilities', pageId: 'export-data' },
]

export default function GoToSearch() {
  const { showGoToSearch, setShowGoToSearch, navigateTo } = useNavigationStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.length === 0
    ? ALL_ITEMS
    : ALL_ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )

  useEffect(() => {
    if (showGoToSearch) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [showGoToSearch])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!showGoToSearch) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowGoToSearch(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        navigateTo(filtered[selectedIndex].pageId)
        setShowGoToSearch(false)
      }
    }
  }

  // Group items by category
  const grouped: Record<string, SearchItem[]> = {}
  filtered.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  })

  let globalIndex = -1

  return (
    <div className="goto-overlay" onClick={() => setShowGoToSearch(false)}>
      <div className="goto-modal" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="goto-search-box">
          <span className="text-brand-400 text-lg">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Go To... (type to search)"
            className="goto-input"
            autoFocus
          />
          <kbd className="goto-kbd">Esc</kbd>
        </div>

        {/* Results */}
        <div className="goto-results">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="goto-category">{category}</div>
              {items.map(item => {
                globalIndex++
                const idx = globalIndex
                return (
                  <button
                    key={item.id}
                    className={`goto-item ${idx === selectedIndex ? 'goto-item-active' : ''}`}
                    onClick={() => {
                      navigateTo(item.pageId)
                      setShowGoToSearch(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="goto-item-shortcut">{item.shortcut}</kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-surface-500 py-8 text-sm">
              No results for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
