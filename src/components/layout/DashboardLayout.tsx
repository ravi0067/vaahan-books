import { useState } from 'react'
import Sidebar from './Sidebar'
import ExpiryBanner from './ExpiryBanner'
import DashboardPage from '../../pages/DashboardPage'
import SalesInvoicePage from '../../pages/invoices/SalesInvoicePage'
import VoucherEntryPage from '../../pages/accounting/VoucherEntryPage'
import DayBookPage from '../../pages/reports/DayBookPage'
import BalanceSheetPage from '../../pages/reports/BalanceSheetPage'
import GSTR1Page from '../../pages/gst/GSTR1Page'
import EInvoicePage from '../../pages/gst/EInvoicePage'
import BackupPage from '../../pages/settings/BackupPage'
import SyncPage from '../../pages/settings/SyncPage'
import AIAssistantPage from '../../pages/ai/AIAssistantPage'
import CAModeDashboard from '../../pages/ca-mode/CAModeDashboard'
import PluginMarketplace from '../../pages/plugins/PluginMarketplace'
import PayrollDashboard from '../../pages/payroll/PayrollDashboard'
type PageKey = 'dashboard' | 'invoices' | 'accounting' | 'gst' | 'reports' | 'inventory' | 'banking' | 'payroll' | 'ai' | 'settings' | 'backup' | 'license'

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />
      case 'invoices': return <SalesInvoicePage />
      case 'accounting': return <VoucherEntryPage />
      case 'gst': return <div className="space-y-6"><EInvoicePage /><GSTR1Page /></div>
      case 'reports': return <div className="space-y-6"><BalanceSheetPage /><DayBookPage /></div>
      case 'inventory': return <CAModeDashboard />
      case 'banking': return <PluginMarketplace />
      case 'payroll': return <PayrollDashboard />
      case 'ai': return <AIAssistantPage />
      case 'settings': return <SyncPage />
      case 'backup': return <BackupPage />
      case 'license': return <div className="p-8 text-center"><h2 className="text-2xl text-white">License Management</h2><p className="text-surface-400 mt-2">See Expiry Banner UI at the top of the app!</p></div>
      default: return <DashboardPage />
    }
  }

  return (
    <div className="h-screen w-screen flex bg-surface-950 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Expiry Banner (conditional) */}
        <ExpiryBanner />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

// ── Coming Soon placeholder for Phase 2+ pages ────────────
function ComingSoon({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 animate-fade-in">
        <span className="text-6xl">{icon}</span>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-surface-400 text-sm max-w-sm">{desc}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 text-brand-400 text-sm border border-brand-500/20">
          <span className="animate-pulse-soft">🔨</span>
          Coming in Phase 2+
        </div>
      </div>
    </div>
  )
}
