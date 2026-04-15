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
  isLoading: false,
  isActivated: false,

  setLicense: (license) =>
    set({
      license,
      isActivated: license?.status === 'ACTIVE'
    }),

  setLoading: (isLoading) => set({ isLoading }),

  checkLicense: async () => {
    set({ isLoading: false })
  },

  activateLicense: async (key: string) => {
    set({ isLoading: true })

    await new Promise((res) => setTimeout(res, 800))

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
  hasCompany: boolean
  setActiveCompany: (company: Company) => void
  loadCompanies: () => Promise<void>
  createCompany: (company: Company) => Promise<{ success: boolean }>
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  activeCompany: null,
  isLoading: false,
  hasCompany: false,

  // ✅ FIX: normalize isDefault
  setActiveCompany: (company) =>
    set({
      activeCompany: {
        ...company,
        isDefault: Boolean(company.isDefault)
      }
    }),

  loadCompanies: async () => {
    set({ isLoading: true })

    try {
      const result = await window.electronAPI.company.getAll()

      if (result.success && result.data) {
        const companies = result.data as any[] // 🔥 loosen type

        const defaultCompany =
          companies.find((c) => c.isDefault === 1 || c.isDefault === true) ||
          companies[0] ||
          null

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
    } catch (error) {
      console.error('Load companies error:', error)

      set({
        companies: [],
        activeCompany: null,
        hasCompany: false,
        isLoading: false
      })
    }
  },

  // 🔥 FINAL FIXED CREATE
  createCompany: async (company: Company) => {
    try {
      console.log('Sending company:', company)

      const result = await window.electronAPI.company.create(company)

      console.log('Received response:', result)

      if (result.success && result.data) {
        const newCompany = {
          ...result.data,
          isDefault: Boolean(result.data.isDefault)
        }

        set({
          companies: [newCompany],
          activeCompany: newCompany,
          hasCompany: true
        })

        return { success: true }
      }

      return { success: false }
    } catch (error) {
      console.error('Create company failed:', error)
      return { success: false }
    }
  }
}))
