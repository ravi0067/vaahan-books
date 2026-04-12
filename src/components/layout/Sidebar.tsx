import { useCompanyStore, useLicenseStore } from '../../store'

interface SidebarProps {
  activePage: string
  onNavigate: (page: any) => void
}

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'invoices', label: 'Invoices', icon: '📄' },
  { key: 'accounting', label: 'Accounting', icon: '📒' },
  { key: 'gst', label: 'GST', icon: '🏛️' },
  { key: 'reports', label: 'Reports', icon: '📈' },
  { key: 'inventory', label: 'Inventory', icon: '📦' },
  { key: 'banking', label: 'Banking', icon: '🏦' },
  { key: 'payroll', label: 'Payroll', icon: '💰' },
  { type: 'divider' as const },
  { key: 'ai', label: 'AI Assistant', icon: '🤖' },
  { type: 'divider' as const },
  { key: 'backup', label: 'Backup', icon: '💾' },
  { key: 'license', label: 'License', icon: '🔑' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
] as const

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { activeCompany } = useCompanyStore()
  const { license } = useLicenseStore()

  return (
    <aside className="w-60 h-full flex flex-col border-r border-surface-800 bg-surface-900/40 backdrop-blur-sm">
      {/* Brand Header */}
      <div className="px-4 py-5 border-b border-surface-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">VaahanBooks</h1>
            <p className="text-xs text-surface-500 truncate">{activeCompany?.name || 'No Company'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item, idx) => {
          if ('type' in item && item.type === 'divider') {
            return <div key={`div-${idx}`} className="h-px bg-surface-800 my-2 mx-2" />
          }
          if (!('key' in item)) return null
          const isActive = activePage === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* License Status Footer */}
      <div className="px-4 py-4 border-t border-surface-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            license?.status === 'ACTIVE' ? 'bg-green-400' :
            license?.status === 'EXPIRED' ? 'bg-red-400' : 'bg-yellow-400'
          }`} />
          <span className="text-xs text-surface-500">
            {license?.planType || 'Unknown'} Plan
          </span>
        </div>
        {license?.daysRemaining !== undefined && license.daysRemaining <= 30 && (
          <p className={`text-xs mt-1 ${
            license.daysRemaining <= 7 ? 'text-red-400' :
            license.daysRemaining <= 15 ? 'text-orange-400' : 'text-yellow-400'
          }`}>
            {license.daysRemaining} days remaining
          </p>
        )}
      </div>
    </aside>
  )
}
