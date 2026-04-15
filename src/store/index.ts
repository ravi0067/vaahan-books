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

  setLicense: (license) => set({
    license,
    isActivated: license?.status === 'ACTIVE'
  }),

  setLoading: (isLoading) => set({ isLoading }),

  // License check disabled
  checkLicense: async () => {
    set({ isLoading: false })
  },

  // Fake activation (any key works)
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
    } catch (error) {
      console.error("Load companies error:", error)
      set({
        companies: [],
        activeCompany: null,
        hasCompany: false,
        isLoading: false
      })
    }
  },

  // 🔥 FIXED COMPANY CREATE
  createCompany: async (company: Company) => {
    try {
      console.log("Sending company:", company)

      const result = await window.electronAPI.company.create(company)

      console.log("Received response:", result)

      if (result.success && result.data) {
        set({
          companies: [result.data],
          activeCompany: result.data,
          hasCompany: true
        })
        return { success: true }
      }

      return { success: false }
    } catch (error) {
      console.error("Create company failed:", error)
      return { success: false }
    }
  }
}))
