// ── Electron API Type Declarations ────────────────────────

export interface ElectronAPI {
  license: {
    validate: (key: string) => Promise<IpcResult<LicenseInfo>>
    getStatus: () => Promise<LicenseInfo | null>
    activate: (key: string) => Promise<IpcResult<LicenseInfo>>
  }
  db: {
    execute: (sql: string, params?: any[]) => Promise<IpcResult<any>>
    getAll: (sql: string, params?: any[]) => Promise<IpcResult<any[]>>
    run: (sql: string, params?: any[]) => Promise<IpcResult<any>>
  }
  company: {
    create: (data: CompanyFormData) => Promise<IpcResult<{ id: string }>>
    getAll: () => Promise<IpcResult<Company[]>>
    getDefault: () => Promise<IpcResult<Company | null>>
  }
  backup: {
    create: () => Promise<{ success: boolean; path?: string; error?: string }>
    getHistory: () => Promise<any[]>
  }
  system: {
    openExternal: (url: string) => Promise<void>
    getAppVersion: () => Promise<string>
    getDataPath: () => Promise<string>
  }
}

export interface IpcResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface LicenseInfo {
  licenseKey: string
  planType: 'TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'UNACTIVATED'
  activatedAt: string | null
  expiryDate: string | null
  lastVerified: string | null
  machineId: string
  maxCompanies: number
  maxUsers: number
  daysRemaining: number
}

export interface Company {
  id: string
  name: string
  tradeName: string
  gstin: string
  panNumber: string
  tanNumber: string
  address: string
  city: string
  state: string
  stateCode: string
  pincode: string
  phone: string
  email: string
  website: string
  logo: Uint8Array | null
  financialYearStart: number
  bookStartDate: string
  isDefault: number
  isActive: number
  createdAt: string
  updatedAt: string
}

export interface CompanyFormData {
  name: string
  tradeName?: string
  gstin?: string
  panNumber?: string
  tanNumber?: string
  address?: string
  city?: string
  state?: string
  stateCode?: string
  pincode?: string
  phone?: string
  email?: string
  website?: string
  financialYearStart?: number
  bookStartDate?: string
  isDefault?: boolean
}

export interface AccountGroup {
  id: string
  companyId: string
  name: string
  parentId: string | null
  nature: 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSE'
  isSystem: number
}

export interface Ledger {
  id: string
  companyId: string
  name: string
  accountGroupId: string
  openingBalance: number
  currentBalance: number
  balanceType: 'DEBIT' | 'CREDIT'
  ledgerType: 'PARTY' | 'BANK' | 'CASH' | 'TAX' | 'EXPENSE' | 'INCOME' | 'ASSET' | 'LIABILITY'
  isActive: number
}

// ── Augment Window ────────────────────────────────────────
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
