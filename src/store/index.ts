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
  isLoading: false, // 👈 important (start me loading false)
  isActivated: false,

  setLicense: (license) => set({
    license,
    isActivated: license?.status === 'ACTIVE'
  }),

  setLoading: (isLoading) => set({ isLoading }),

  // 🔥 FULLY DISABLED (no backend call)
  checkLicense: async () => {
    set({ isLoading: false })
  },

  // 🔥 FAKE ACTIVATION (any key works)
  activateLicense: async (key: string) => {
    set({ isLoading: true })

    await new Promise(res => setTimeout(res, 800))

    const fakeLicense = {
      key,
      status: 'ACTIVE'
    } as unknown as LicenseInfo

    set({
      license: fakeLicense,
      isActivated: true,
      isLoading: false
    })

    return { success: true }
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
        const defaultCompany =
          companies.find(c => c.isDefault) || companies[0] || null

        set({
          companies,
          activeCompany: defaultCompany,
          hasCompany: companies.length > 0,
          isLoading: false
        })
      } else {
        set({
          companies: [],
          activeCompany: null,
          hasCompany: false,
          isLoading: false
        })
      }
    } catch {
      set({
        companies: [],
        activeCompany: null,
        hasCompany: false,
        isLoading: false
      })
    }
  }
}))
