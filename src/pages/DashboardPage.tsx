import { useCompanyStore, useLicenseStore } from '../store'

export default function DashboardPage() {
  const { activeCompany } = useCompanyStore()
  const { license } = useLicenseStore()

  const cards = [
    { title: 'Total Sales', value: '₹0.00', change: '+0%', icon: '📈', color: 'from-green-500/10 to-emerald-500/5', border: 'border-green-500/20' },
    { title: 'Total Purchase', value: '₹0.00', change: '+0%', icon: '📦', color: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-500/20' },
    { title: 'Cash Balance', value: '₹0.00', change: '', icon: '💵', color: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-500/20' },
    { title: 'Bank Balance', value: '₹0.00', change: '', icon: '🏦', color: 'from-purple-500/10 to-violet-500/5', border: 'border-purple-500/20' },
  ]

  const quickActions = [
    { label: 'Sales Invoice', icon: '📝', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    { label: 'Purchase Invoice', icon: '📥', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'Receipt', icon: '💰', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { label: 'Payment', icon: '💸', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { label: 'Journal', icon: '📒', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { label: 'Contra', icon: '🔄', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-0.5">{activeCompany?.name || 'VaahanBooks'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-surface-800/50 text-xs text-surface-400 border border-surface-700">
            FY 2026-27
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface-800/50 text-xs text-surface-400 border border-surface-700 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${license?.status === 'ACTIVE' ? 'bg-green-400' : 'bg-red-400'}`} />
            {license?.planType} Plan
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div
            key={card.title}
            className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.color} p-5 transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-surface-400 font-medium">{card.title}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{card.value}</p>
            {card.change && (
              <p className="text-xs text-surface-500 mt-1">{card.change} from last month</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-surface-300 mb-3 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(action => (
            <button
              key={action.label}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${action.color}
                hover:scale-105 transition-all duration-200 cursor-pointer`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-sm font-semibold text-surface-300 mb-4 uppercase tracking-wider">Recent Transactions</h3>
          <div className="flex items-center justify-center h-40 text-surface-600 text-sm">
            <div className="text-center">
              <span className="text-3xl block mb-2">📋</span>
              <p>No transactions yet</p>
              <p className="text-xs mt-1 text-surface-700">Create your first invoice to get started</p>
            </div>
          </div>
        </div>

        {/* Outstanding Summary */}
        <div className="card">
          <h3 className="text-sm font-semibold text-surface-300 mb-4 uppercase tracking-wider">Outstanding Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-sm">↓</div>
                <div>
                  <p className="text-sm text-white font-medium">Receivable</p>
                  <p className="text-xs text-surface-500">Amount owed to you</p>
                </div>
              </div>
              <p className="text-lg font-bold font-mono text-green-400">₹0.00</p>
            </div>
            <div className="h-px bg-surface-800" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-sm">↑</div>
                <div>
                  <p className="text-sm text-white font-medium">Payable</p>
                  <p className="text-xs text-surface-500">Amount you owe</p>
                </div>
              </div>
              <p className="text-lg font-bold font-mono text-red-400">₹0.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* GST Summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-surface-300 mb-4 uppercase tracking-wider">GST Summary (Current Month)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {['CGST', 'SGST', 'IGST', 'Total GST'].map(tax => (
            <div key={tax} className="text-center p-3 rounded-lg bg-surface-800/30">
              <p className="text-xs text-surface-500 mb-1">{tax}</p>
              <p className="text-lg font-bold font-mono text-white">₹0.00</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
