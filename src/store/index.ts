import { create } from 'zustand'
import type { LicenseInfo, Company } from '../types'

// ── License Store ─────────────────────────────────────────
interface LicenseState {
  license: LicenseInfo | null
  isLoading: boolean
  isActivated: boolean
  setLicense: (license: LicenseInfo | null) => void
  setLoading: (loading: boolean) => void
  checkLicense: () => Promise<void>
  activateLicense: (key: string) => Promise<{ success: boolean; error?: string }>
}

export const useLicenseStore = create<LicenseState>((set) => ({
  license: null,
  isLoading: true,
  isActivated: false,

  setLicense: (license) => set({
    license,
    isActivated: license?.status === 'ACTIVE'
  }),

  setLoading: (isLoading) => set({ isLoading }),

  checkLicense: async () => {
    set({ isLoading: true })
    try {
      const status = await window.electronAPI.license.getStatus()
      set({
        license: status,
        isActivated: status?.status === 'ACTIVE',
        isLoading: false
      })
    } catch {
      set({ license: null, isActivated: false, isLoading: false })
    }
  },

  activateLicense: async (key: string) => {
    const result = await window.electronAPI.license.activate(key)
    if (result.success && result.data) {
      set({ license: result.data, isActivated: true })
      return { success: true }
    }
    return { success: false, error: result.error }
  }
}))

// ── Company Store ─────────────────────────────────────────
interface CompanyState {
  companies: Company[]
  activeCompany: Company | null
  isLoading: boolean
  setActiveCompany: (company: Company) => void
  loadCompanies: () => Promise<void>
  hasCompany: boolean
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  activeCompany: null,
  isLoading: true,
  hasCompany: false,

  setActiveCompany: (company) => set({ activeCompany: company }),

  loadCompanies: async () => {
    set({ isLoading: true })
    try {
      const result = await window.electronAPI.company.getAll()
      if (result.success && result.data) {
        const companies = result.data as Company[]
        const defaultCompany = companies.find(c => c.isDefault) || companies[0] || null
        set({
          companies,
          activeCompany: defaultCompany,
          hasCompany: companies.length > 0,
          isLoading: false
        })
      } else {
        set({ companies: [], activeCompany: null, hasCompany: false, isLoading: false })
      }
    } catch {
      set({ companies: [], activeCompany: null, hasCompany: false, isLoading: false })
    }
  }
}))
