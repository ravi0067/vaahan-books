import TopMenuBar from '../TopMenuBar'
import BottomStatusBar from '../BottomStatusBar'
import GoToSearch from '../GoToSearch'
import PeriodSelector from '../PeriodSelector'
import GatewayPage from '../../pages/GatewayPage'
import CreateLedgerPage from '../../pages/masters/CreateLedgerPage'
import ChartOfAccountsPage from '../../pages/masters/ChartOfAccountsPage'
import VoucherEntryPage from '../../pages/vouchers/VoucherEntryPage'
import DayBookPage from '../../pages/reports/DayBookPage'
import BalanceSheetPage from '../../pages/reports/BalanceSheetPage'
import ProfitLossPage from '../../pages/reports/ProfitLossPage'
import TrialBalancePage from '../../pages/reports/TrialBalancePage'
import OutstandingPage from '../../pages/reports/OutstandingPage'
import LedgerStatementPage from '../../pages/reports/LedgerStatementPage'
import DashboardReportsPage from '../../pages/reports/DashboardReportsPage'
import GSTR1Page from '../../pages/reports/GSTR1Page'
import GSTR3BPage from '../../pages/reports/GSTR3BPage'
import GSTComputationPage from '../../pages/reports/GSTComputationPage'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

// Placeholder for pages not yet built
function ComingSoon({ title }: { title: string }) {
  const { goBack } = useNavigationStore()
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-content">
        <span className="text-5xl mb-4 block">🚧</span>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-surface-400 text-sm mb-4">This module is under development</p>
        <button onClick={goBack} className="coming-soon-back">
          ← Back to Gateway <span className="text-surface-500 text-xs ml-2">Esc</span>
        </button>
      </div>
    </div>
  )
}

export default function TallyLayout() {
  const { currentPage, goBack, setShowGoToSearch, setShowPeriodSelector, setShowFeatures, navigateTo } = useNavigationStore()

  // Global shortcuts that work everywhere
  useKeyboardShortcuts([
    { key: 'Escape', handler: () => goBack(), description: 'Go Back' },
    { key: 'g', alt: true, handler: () => setShowGoToSearch(true), description: 'Go To' },
    { key: 'F2', handler: () => setShowPeriodSelector(true), description: 'Period' },
    { key: 'F11', handler: () => setShowFeatures(true), description: 'Features' },
  ])

  const renderPage = () => {
    switch (currentPage) {
      case 'gateway':
        return <GatewayPage />

      // ── Masters ──────────────────────────────────────
      case 'create-ledger':
        return <CreateLedgerPage />
      case 'alter-ledger':
        return <CreateLedgerPage />   // Re-use with alter mode (Phase 4)
      case 'create-group':
        return <ComingSoon title="Create Group" />
      case 'chart-of-accounts':
      case 'ledger-list':
        return <ChartOfAccountsPage />

      // ── Vouchers ─────────────────────────────────────
      case 'voucher-sales':
        return <VoucherEntryPage voucherType="SALES" />
      case 'voucher-purchase':
        return <VoucherEntryPage voucherType="PURCHASE" />
      case 'voucher-payment':
        return <VoucherEntryPage voucherType="PAYMENT" />
      case 'voucher-receipt':
        return <VoucherEntryPage voucherType="RECEIPT" />
      case 'voucher-contra':
        return <VoucherEntryPage voucherType="CONTRA" />
      case 'voucher-journal':
        return <VoucherEntryPage voucherType="JOURNAL" />
      case 'day-book':
      case 'voucher-list':
        return <DayBookPage />

      // ── Reports ──────────────────────────────────────
      case 'balance-sheet':
        return <BalanceSheetPage />
      case 'profit-loss':
        return <ProfitLossPage />
      case 'trial-balance':
        return <TrialBalancePage />
      case 'cash-flow':
        return <ComingSoon title="Cash Flow Statement" />
      case 'fund-flow':
        return <ComingSoon title="Fund Flow Statement" />
      case 'ratio-analysis':
        return <ComingSoon title="Ratio Analysis" />
      case 'receivables':
        return <OutstandingPage />
      case 'payables':
        return <OutstandingPage />
      case 'ledger-statement':
        return <LedgerStatementPage />
      case 'dashboard-reports':
        return <DashboardReportsPage />

      // ── GST ──────────────────────────────────────────
      case 'gstr1':
        return <GSTR1Page />
      case 'gstr3b':
        return <GSTR3BPage />
      case 'gst-computation':
        return <GSTComputationPage />
      case 'gstr2-recon':
        return <ComingSoon title="GSTR-2 Reconciliation" />
      case 'e-invoice':
        return <ComingSoon title="e-Invoice" />
      case 'e-way-bill':
        return <ComingSoon title="e-Way Bill" />

      // ── Inventory ────────────────────────────────────
      case 'stock-item':
        return <ComingSoon title="Stock Item" />
      case 'stock-group':
        return <ComingSoon title="Stock Group" />
      case 'stock-category':
        return <ComingSoon title="Stock Category" />
      case 'stock-summary':
        return <ComingSoon title="Stock Summary" />
      case 'stock-movement':
        return <ComingSoon title="Stock Movement" />
      case 'godown':
        return <ComingSoon title="Godown / Warehouse" />
      case 'bom':
        return <ComingSoon title="Bill of Materials" />
      case 'manufacturing-journal':
        return <ComingSoon title="Manufacturing Journal" />
      case 'unit-of-measure':
        return <ComingSoon title="Units of Measure" />

      // ── Banking ──────────────────────────────────────
      case 'bank-reconciliation':
        return <ComingSoon title="Bank Reconciliation" />
      case 'cheque-management':
        return <ComingSoon title="Cheque Management" />
      case 'bank-register':
        return <ComingSoon title="Bank Register" />

      // ── Settings ─────────────────────────────────────
      case 'company-features':
        return <ComingSoon title="Company Features (F11)" />
      case 'screen-config':
        return <ComingSoon title="Screen Configuration (F12)" />
      case 'user-management':
        return <ComingSoon title="User Management" />
      case 'audit-trail':
        return <ComingSoon title="Audit Trail" />

      // ── Utilities ────────────────────────────────────
      case 'import-data':
        return <ComingSoon title="Import Data" />
      case 'export-data':
        return <ComingSoon title="Export Data" />
      case 'backup-restore':
        return <ComingSoon title="Backup & Restore" />

      default:
        return <GatewayPage />
    }
  }

  return (
    <div className="tally-layout">
      <TopMenuBar />
      <main className="tally-content">
        {renderPage()}
      </main>
      <BottomStatusBar />

      {/* Modals */}
      <GoToSearch />
      <PeriodSelector />
    </div>
  )
}
