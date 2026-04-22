import { useState, useEffect, useCallback } from 'react'
import { useNavigationStore, type PageId } from '../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useCompanyStore } from '../store'

interface MenuItem {
  label: string
  shortcutKey?: string
  pageId?: PageId
  children?: MenuItem[]
  icon?: string
}

const GATEWAY_MENU: MenuItem[] = [
  {
    label: 'Masters',
    icon: '📋',
    children: [
      { label: 'Create', children: [
        { label: 'Ledger', shortcutKey: 'L', pageId: 'create-ledger' },
        { label: 'Group', shortcutKey: 'G', pageId: 'create-group' },
        { label: 'Stock Item', shortcutKey: 'S', pageId: 'stock-item' },
        { label: 'Stock Group', shortcutKey: 'T', pageId: 'stock-group' },
        { label: 'Unit', shortcutKey: 'U', pageId: 'unit-of-measure' },
        { label: 'Godown', shortcutKey: 'W', pageId: 'godown' },
      ]},
      { label: 'Alter', children: [
        { label: 'Ledger', shortcutKey: 'L', pageId: 'alter-ledger' },
        { label: 'Group', shortcutKey: 'G', pageId: 'create-group' },
        { label: 'Stock Item', shortcutKey: 'S', pageId: 'stock-item' },
      ]},
      { label: 'Chart of Accounts', shortcutKey: 'A', pageId: 'chart-of-accounts' },
    ]
  },
  {
    label: 'Transactions',
    icon: '📝',
    children: [
      { label: 'Accounting Vouchers', children: [
        { label: 'Contra (F4)', shortcutKey: 'C', pageId: 'voucher-contra' },
        { label: 'Payment (F5)', shortcutKey: 'P', pageId: 'voucher-payment' },
        { label: 'Receipt (F6)', shortcutKey: 'R', pageId: 'voucher-receipt' },
        { label: 'Journal (F7)', shortcutKey: 'J', pageId: 'voucher-journal' },
        { label: 'Sales (F8)', shortcutKey: 'S', pageId: 'voucher-sales' },
        { label: 'Purchase (F9)', shortcutKey: 'U', pageId: 'voucher-purchase' },
      ]},
      { label: 'Day Book', shortcutKey: 'D', pageId: 'day-book' },
    ]
  },
  {
    label: 'Reports',
    icon: '📊',
    children: [
      { label: 'Balance Sheet', shortcutKey: 'B', pageId: 'balance-sheet' },
      { label: 'Profit & Loss A/c', shortcutKey: 'P', pageId: 'profit-loss' },
      { label: 'Trial Balance', shortcutKey: 'T', pageId: 'trial-balance' },
      { label: 'Cash Flow', shortcutKey: 'C', pageId: 'cash-flow' },
      { label: 'Fund Flow', shortcutKey: 'F', pageId: 'fund-flow' },
      { label: 'Ratio Analysis', shortcutKey: 'R', pageId: 'ratio-analysis' },
      { label: 'Day Book', shortcutKey: 'D', pageId: 'day-book' },
      { label: 'Outstanding', children: [
        { label: 'Receivables', shortcutKey: 'R', pageId: 'receivables' },
        { label: 'Payables', shortcutKey: 'P', pageId: 'payables' },
      ]},
    ]
  },
  {
    label: 'Inventory Reports',
    icon: '📦',
    children: [
      { label: 'Stock Summary', shortcutKey: 'S', pageId: 'stock-summary' },
      { label: 'Stock Movement', shortcutKey: 'M', pageId: 'stock-movement' },
      { label: 'Godown Summary', shortcutKey: 'G', pageId: 'godown' },
      { label: 'Item Profitability', shortcutKey: 'I', pageId: 'stock-summary' },
    ]
  },
  {
    label: 'GST Reports',
    icon: '🏛️',
    children: [
      { label: 'GSTR-1', shortcutKey: '1', pageId: 'gstr1' },
      { label: 'GSTR-3B', shortcutKey: '3', pageId: 'gstr3b' },
      { label: 'GSTR-2 Reconciliation', shortcutKey: '2', pageId: 'gstr2-recon' },
      { label: 'GST Computation', shortcutKey: 'C', pageId: 'gst-computation' },
      { label: 'e-Invoice', shortcutKey: 'E', pageId: 'e-invoice' },
      { label: 'e-Way Bill', shortcutKey: 'W', pageId: 'e-way-bill' },
    ]
  },
  {
    label: 'Banking',
    icon: '🏦',
    children: [
      { label: 'Bank Reconciliation', shortcutKey: 'R', pageId: 'bank-reconciliation' },
      { label: 'Cheque Management', shortcutKey: 'C', pageId: 'cheque-management' },
      { label: 'Bank Register', shortcutKey: 'B', pageId: 'bank-register' },
    ]
  },
  {
    label: 'Utilities',
    icon: '⚙️',
    children: [
      { label: 'Import Data', shortcutKey: 'I', pageId: 'import-data' },
      { label: 'Export Data', shortcutKey: 'E', pageId: 'export-data' },
      { label: 'Backup & Restore', shortcutKey: 'B', pageId: 'backup-restore' },
    ]
  },
]

export default function GatewayPage() {
  const { navigateTo, setShowGoToSearch, setShowPeriodSelector, setShowFeatures, setShowConfigure } = useNavigationStore()
  const { activeCompany } = useCompanyStore()
  const [expandedPath, setExpandedPath] = useState<number[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [flatItems, setFlatItems] = useState<{ item: MenuItem; depth: number; path: number[] }[]>([])

  // Flatten the visible tree for keyboard navigation
  const buildFlatList = useCallback(() => {
    const flat: { item: MenuItem; depth: number; path: number[] }[] = []
    const traverse = (items: MenuItem[], depth: number, parentPath: number[]) => {
      items.forEach((item, i) => {
        const path = [...parentPath, i]
        flat.push({ item, depth, path })
        // Only show children if this node is expanded
        if (item.children && isExpanded(path)) {
          traverse(item.children, depth + 1, path)
        }
      })
    }
    traverse(GATEWAY_MENU, 0, [])
    return flat
  }, [expandedPath])

  function isExpanded(path: number[]) {
    const key = path.join('-')
    return expandedPath.some(p => {
      const pp = expandedPath as any
      return false
    }) || expandedPaths.has(key)
  }

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  useEffect(() => {
    const flat = buildFlatVisibleList()
    setFlatItems(flat)
  }, [expandedPaths])

  function buildFlatVisibleList() {
    const flat: { item: MenuItem; depth: number; path: number[] }[] = []
    const traverse = (items: MenuItem[], depth: number, parentPath: number[]) => {
      items.forEach((item, i) => {
        const path = [...parentPath, i]
        flat.push({ item, depth, path })
        if (item.children && expandedPaths.has(path.join('-'))) {
          traverse(item.children, depth + 1, path)
        }
      })
    }
    traverse(GATEWAY_MENU, 0, [])
    return flat
  }

  const toggleExpand = (path: number[]) => {
    const key = path.join('-')
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSelect = (entry: typeof flatItems[0]) => {
    if (entry.item.pageId) {
      navigateTo(entry.item.pageId)
    } else if (entry.item.children) {
      toggleExpand(entry.path)
    }
  }

  // Keyboard navigation
  useKeyboardShortcuts([
    { key: 'ArrowDown', handler: () => setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1)) },
    { key: 'ArrowUp', handler: () => setSelectedIndex(i => Math.max(i - 1, 0)) },
    { key: 'ArrowRight', handler: () => {
      const entry = flatItems[selectedIndex]
      if (entry?.item.children) {
        setExpandedPaths(prev => new Set(prev).add(entry.path.join('-')))
      }
    }},
    { key: 'ArrowLeft', handler: () => {
      const entry = flatItems[selectedIndex]
      if (entry) {
        setExpandedPaths(prev => {
          const next = new Set(prev)
          next.delete(entry.path.join('-'))
          return next
        })
      }
    }},
    { key: 'Enter', handler: () => {
      const entry = flatItems[selectedIndex]
      if (entry) handleSelect(entry)
    }},
    // Global shortcuts
    { key: 'g', alt: true, handler: () => setShowGoToSearch(true), description: 'Go To' },
    { key: 'F2', handler: () => setShowPeriodSelector(true), description: 'Change Period' },
    { key: 'F11', handler: () => setShowFeatures(true), description: 'Features' },
    { key: 'F12', handler: () => setShowConfigure(true), description: 'Configure' },
    // Voucher shortcuts from Gateway
    { key: 'F4', handler: () => navigateTo('voucher-contra') },
    { key: 'F5', handler: () => navigateTo('voucher-payment') },
    { key: 'F6', handler: () => navigateTo('voucher-receipt') },
    { key: 'F7', handler: () => navigateTo('voucher-journal') },
    { key: 'F8', handler: () => navigateTo('voucher-sales') },
    { key: 'F9', handler: () => navigateTo('voucher-purchase') },
  ])

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return dateStr }
  }

  return (
    <div className="gateway-container">
      {/* Left Panel: Tree Menu */}
      <div className="gateway-menu-panel">
        <div className="gateway-title">
          <span className="text-lg">★</span>
          <span className="gateway-title-text">Gateway of VaahanBooks</span>
          <span className="text-lg">★</span>
        </div>

        <div className="gateway-tree">
          {flatItems.map((entry, idx) => {
            const hasChildren = !!entry.item.children
            const isOpen = expandedPaths.has(entry.path.join('-'))
            const isSelected = idx === selectedIndex

            return (
              <button
                key={entry.path.join('-')}
                className={`gateway-tree-item ${isSelected ? 'gateway-tree-item-active' : ''}`}
                style={{ paddingLeft: `${12 + entry.depth * 20}px` }}
                onClick={() => { setSelectedIndex(idx); handleSelect(entry) }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                {/* Expand/Collapse indicator */}
                <span className="gateway-tree-icon">
                  {hasChildren ? (isOpen ? '▼' : '►') : '○'}
                </span>

                {/* Icon */}
                {entry.depth === 0 && entry.item.icon && (
                  <span className="mr-1.5">{entry.item.icon}</span>
                )}

                {/* Label with shortcut key underlined */}
                <span className="flex-1 text-left">
                  {entry.item.shortcutKey ? (
                    <span>
                      <span className="gateway-shortcut-letter">{entry.item.shortcutKey}</span>
                      {entry.item.label.includes(`(${entry.item.shortcutKey})`)
                        ? entry.item.label.replace(entry.item.shortcutKey, '')
                        : ': ' + entry.item.label.replace(new RegExp(entry.item.shortcutKey, 'i'), (m) => m)
                      }
                    </span>
                  ) : (
                    entry.item.label
                  )}
                </span>

                {hasChildren && (
                  <span className="text-surface-600 text-[10px]">►</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Panel: Company Info */}
      <div className="gateway-info-panel">
        <div className="gateway-company-card">
          <div className="gateway-company-header">Company Information</div>
          <div className="gateway-company-body">
            <div className="gateway-info-row">
              <span className="gateway-info-label">Company</span>
              <span className="gateway-info-value">{activeCompany?.name || 'Not Set'}</span>
            </div>
            {activeCompany?.tradeName && (
              <div className="gateway-info-row">
                <span className="gateway-info-label">Trade Name</span>
                <span className="gateway-info-value">{activeCompany.tradeName}</span>
              </div>
            )}
            <div className="gateway-info-row">
              <span className="gateway-info-label">GSTIN</span>
              <span className="gateway-info-value font-mono">{activeCompany?.gstin || 'Not Set'}</span>
            </div>
            <div className="gateway-info-row">
              <span className="gateway-info-label">Address</span>
              <span className="gateway-info-value">
                {[activeCompany?.address, activeCompany?.city, activeCompany?.state].filter(Boolean).join(', ') || 'Not Set'}
              </span>
            </div>
            <div className="gateway-info-row">
              <span className="gateway-info-label">Financial Year</span>
              <span className="gateway-info-value">
                {activeCompany?.bookStartDate ? formatDate(activeCompany.bookStartDate) : 'Apr 2026'} onwards
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="gateway-stats-grid">
          <div className="gateway-stat-card">
            <span className="gateway-stat-label">Cash in Hand</span>
            <span className="gateway-stat-value text-green-400">₹0.00</span>
          </div>
          <div className="gateway-stat-card">
            <span className="gateway-stat-label">Bank Balance</span>
            <span className="gateway-stat-value text-blue-400">₹0.00</span>
          </div>
          <div className="gateway-stat-card">
            <span className="gateway-stat-label">Receivables</span>
            <span className="gateway-stat-value text-amber-400">₹0.00</span>
          </div>
          <div className="gateway-stat-card">
            <span className="gateway-stat-label">Payables</span>
            <span className="gateway-stat-value text-red-400">₹0.00</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="gateway-recent">
          <div className="gateway-company-header">Recent Activity</div>
          <div className="p-4 text-center text-surface-500 text-sm">
            <span className="text-2xl block mb-2">📋</span>
            No recent transactions
            <br />
            <span className="text-xs text-surface-600 mt-1 block">Press F8 for Sales or F9 for Purchase to get started</span>
          </div>
        </div>
      </div>
    </div>
  )
}
