import { useNavigationStore } from '../hooks/useNavigationStore'
import { useCompanyStore } from '../store'

interface MenuAction {
  key: string
  label: string
  shortcut: string
  action: () => void
}

export default function TopMenuBar() {
  const { setShowCompanyMenu, setShowGoToSearch } = useNavigationStore()
  const { activeCompany } = useCompanyStore()

  const menuItems: MenuAction[] = [
    { key: 'K', label: 'Company', shortcut: 'Alt+K', action: () => setShowCompanyMenu(true) },
    { key: 'Y', label: 'Data', shortcut: 'Alt+Y', action: () => {} },
    { key: 'Z', label: 'Exchange', shortcut: 'Alt+Z', action: () => {} },
    { key: 'G', label: 'Go To', shortcut: 'Alt+G', action: () => setShowGoToSearch(true) },
    { key: 'O', label: 'Import', shortcut: 'Alt+O', action: () => {} },
    { key: 'E', label: 'Export', shortcut: 'Alt+E', action: () => {} },
    { key: 'M', label: 'E-Mail', shortcut: 'Alt+M', action: () => {} },
    { key: 'P', label: 'Print', shortcut: 'Alt+P', action: () => {} },
  ]

  return (
    <div className="top-menu-bar">
      {/* Left: App Name */}
      <div className="flex items-center gap-2 px-3">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <span className="text-white text-xs font-black">V</span>
        </div>
        <span className="text-sm font-bold text-white tracking-wide">VaahanBooks</span>
      </div>

      {/* Center: Menu Items */}
      <div className="flex items-center gap-0.5 flex-1 justify-center">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={item.action}
            className="top-menu-item group"
            title={item.shortcut}
          >
            <span className="top-menu-shortcut">{item.key}</span>
            <span className="text-xs">:{item.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Company Name & Help */}
      <div className="flex items-center gap-3 px-3">
        <span className="text-xs text-surface-400 max-w-[150px] truncate">
          {activeCompany?.name || 'No Company'}
        </span>
        <button className="top-menu-item" title="F1: Help">
          <span className="top-menu-shortcut">F1</span>
          <span className="text-xs">:Help</span>
        </button>
      </div>
    </div>
  )
}
