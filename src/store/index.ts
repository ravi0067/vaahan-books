import { create } from 'zustand'

// 🔥 SAFE TYPES (no strict error)
type LicenseState = {
  license: any
  isLoading: boolean
  isActivated: boolean
  setLicense: (license: any) => void
  setLoading: (loading: boolean) => void
  checkLicense: () => Promise<void>
  activateLicense: (key: string) => Promise<any>
}

type CompanyState = {
  companies: any[]
  activeCompany: any
  isLoading: boolean
  hasCompany: boolean
  setActiveCompany: (company: any) => void
  loadCompanies: () => Promise<void>
  createCompany: (company: any) => Promise<any>
}

// ── License Store ──
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
    }

    set({
      license: fakeLicense,
      isActivated: true,
      isLoading: false
    })

    return { success: true }
  }
}))

// ── Company Store ──
export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  activeCompany: null,
  isLoading: false,
  hasCompany: false,

  setActiveCompany: (company) =>
    set({
      activeCompany: company
    }),

  loadCompanies: async () => {
    set({ isLoading: true })

    try {
      const result = await window.electronAPI.company.getAll()

      if (result.success && result.data) {
        const companies = result.data

        const defaultCompany =
          companies.find((c: any) => c.isDefault == 1 || c.isDefault == true) ||
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
      console.error(error)
      set({
        companies: [],
        activeCompany: null,
        hasCompany: false,
        isLoading: false
      })
    }
  },

  createCompany: async (company: any) => {
    try {
      const result = await window.electronAPI.company.create(company)

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
      console.error(error)
      return { success: false }
    }
  }
}))
