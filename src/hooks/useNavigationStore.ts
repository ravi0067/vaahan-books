import { create } from 'zustand'

export type PageId = 
  // Gateway
  | 'gateway'
  // Masters
  | 'create-ledger' | 'alter-ledger' | 'create-group' | 'chart-of-accounts' | 'ledger-list'
  // Vouchers
  | 'voucher-sales' | 'voucher-purchase' | 'voucher-payment' | 'voucher-receipt' 
  | 'voucher-contra' | 'voucher-journal' | 'voucher-list'
  // Reports
  | 'balance-sheet' | 'profit-loss' | 'trial-balance' | 'cash-flow' | 'fund-flow'
  | 'ratio-analysis' | 'day-book' | 'ledger-report' | 'group-summary'
  | 'receivables' | 'payables' | 'ledger-statement' | 'dashboard-reports'
  // GST
  | 'gstr1' | 'gstr3b' | 'gst-computation' | 'gstr2-recon' | 'e-invoice' | 'e-way-bill'
  // Inventory
  | 'stock-group' | 'stock-item' | 'stock-category' | 'godown' | 'stock-summary'
  | 'stock-movement' | 'bom' | 'manufacturing-journal' | 'unit-of-measure'
  // Banking
  | 'bank-reconciliation' | 'cheque-management' | 'bank-register'
  // Settings
  | 'company-features' | 'screen-config' | 'user-management' | 'audit-trail'
  // Utilities
  | 'import-data' | 'export-data' | 'backup-restore'
  // Payroll
  | 'employee-master' | 'salary-processing' | 'payroll-reports'

export interface NavigationState {
  currentPage: PageId
  pageStack: PageId[] // For Escape to go back
  
  // Navigation
  navigateTo: (page: PageId) => void
  goBack: () => void
  
  // Modals
  showGoToSearch: boolean
  showPeriodSelector: boolean
  showCompanyMenu: boolean
  showFeatures: boolean
  showConfigure: boolean
  
  setShowGoToSearch: (show: boolean) => void
  setShowPeriodSelector: (show: boolean) => void
  setShowCompanyMenu: (show: boolean) => void
  setShowFeatures: (show: boolean) => void
  setShowConfigure: (show: boolean) => void

  // Period
  periodFrom: string
  periodTo: string
  setPeriod: (from: string, to: string) => void
}

function getCurrentFY() {
  const now = new Date()
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return {
    from: `${year}-04-01`,
    to: `${year + 1}-03-31`
  }
}

const fy = getCurrentFY()

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentPage: 'gateway',
  pageStack: [],

  navigateTo: (page: PageId) => {
    const { currentPage, pageStack } = get()
    set({
      currentPage: page,
      pageStack: [...pageStack, currentPage]
    })
  },

  goBack: () => {
    const { pageStack } = get()
    if (pageStack.length === 0) return
    const previousPage = pageStack[pageStack.length - 1]
    set({
      currentPage: previousPage,
      pageStack: pageStack.slice(0, -1)
    })
  },

  showGoToSearch: false,
  showPeriodSelector: false,
  showCompanyMenu: false,
  showFeatures: false,
  showConfigure: false,

  setShowGoToSearch: (show) => set({ showGoToSearch: show }),
  setShowPeriodSelector: (show) => set({ showPeriodSelector: show }),
  setShowCompanyMenu: (show) => set({ showCompanyMenu: show }),
  setShowFeatures: (show) => set({ showFeatures: show }),
  setShowConfigure: (show) => set({ showConfigure: show }),

  periodFrom: fy.from,
  periodTo: fy.to,
  setPeriod: (from, to) => set({ periodFrom: from, periodTo: to })
}))
