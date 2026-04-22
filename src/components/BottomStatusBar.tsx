import { useNavigationStore, type PageId } from '../hooks/useNavigationStore'

interface StatusAction {
  label: string
  shortcut: string
  action: () => void
}

// Context-sensitive bottom bar - shows different actions based on current page
function getContextActions(currentPage: PageId, nav: ReturnType<typeof useNavigationStore.getState>): StatusAction[] {
  const common: StatusAction[] = [
    { label: 'Quit', shortcut: 'Q', action: () => nav.goBack() },
  ]

  if (currentPage === 'gateway') {
    return [
      { label: 'Quit', shortcut: 'Q', action: () => {} },
      { label: 'Select', shortcut: 'Space', action: () => {} },
      { label: 'Select Company', shortcut: 'F1', action: () => nav.setShowCompanyMenu(true) },
      { label: 'Date', shortcut: 'F2', action: () => nav.setShowPeriodSelector(true) },
      { label: 'Features', shortcut: 'F11', action: () => nav.setShowFeatures(true) },
      { label: 'Configure', shortcut: 'F12', action: () => nav.setShowConfigure(true) },
    ]
  }

  if (currentPage.startsWith('voucher-')) {
    return [
      ...common,
      { label: 'Accept', shortcut: 'Ctrl+A', action: () => {} },
      { label: 'Contra', shortcut: 'F4', action: () => nav.navigateTo('voucher-contra') },
      { label: 'Payment', shortcut: 'F5', action: () => nav.navigateTo('voucher-payment') },
      { label: 'Receipt', shortcut: 'F6', action: () => nav.navigateTo('voucher-receipt') },
      { label: 'Journal', shortcut: 'F7', action: () => nav.navigateTo('voucher-journal') },
      { label: 'Sales', shortcut: 'F8', action: () => nav.navigateTo('voucher-sales') },
      { label: 'Purchase', shortcut: 'F9', action: () => nav.navigateTo('voucher-purchase') },
    ]
  }

  if (['balance-sheet', 'profit-loss', 'trial-balance', 'cash-flow', 'fund-flow', 'ratio-analysis', 'day-book'].includes(currentPage)) {
    return [
      ...common,
      { label: 'Period', shortcut: 'F2', action: () => nav.setShowPeriodSelector(true) },
      { label: 'Detailed', shortcut: 'F5', action: () => {} },
      { label: 'Condensed', shortcut: 'F6', action: () => {} },
      { label: 'Valuation', shortcut: 'F8', action: () => {} },
      { label: 'Export', shortcut: 'Alt+E', action: () => {} },
      { label: 'Print', shortcut: 'Alt+P', action: () => {} },
    ]
  }

  return [
    ...common,
    { label: 'Date', shortcut: 'F2', action: () => nav.setShowPeriodSelector(true) },
    { label: 'Configure', shortcut: 'F12', action: () => nav.setShowConfigure(true) },
  ]
}

export default function BottomStatusBar() {
  const nav = useNavigationStore()
  const { currentPage, periodFrom, periodTo } = nav
  const actions = getContextActions(currentPage, nav)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="bottom-status-bar">
      {/* Left: Action buttons */}
      <div className="flex items-center gap-0.5 flex-1">
        {actions.map((action) => (
          <button
            key={action.shortcut}
            onClick={action.action}
            className="bottom-bar-item"
            title={action.shortcut}
          >
            <span className="bottom-bar-shortcut">{action.shortcut}</span>
            <span className="text-xs">:{action.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Period display */}
      <div className="flex items-center gap-2 px-3">
        <span className="text-xs text-surface-500">
          {formatDate(periodFrom)} to {formatDate(periodTo)}
        </span>
      </div>
    </div>
  )
}
