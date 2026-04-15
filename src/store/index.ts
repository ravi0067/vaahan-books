import { create } from 'zustand'

// 🔥 TEMP: remove strict types
type LicenseInfo = any
type Company = any

// ── License Store ─────────────────────────────────────────
export const useLicenseStore = create((set) => ({
  license: null,
  isLoading: false,
  isActivated: false,

  setLicense: (license: any) =>
    set({
      license,
      isActivated: license?.status === 'ACTIVE'
    }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

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

// ── Company Store ─────────────────────────────────────────
export const useCompanyStore = create((set) => ({
  companies: [],
  activeCompany: null,
  isLoading: false,
  hasCompany: false,

  setActiveCompany: (company: any) =>
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
      console.error('Load companies error:', error)

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
      console.error('Create company failed:', error)
      return { success: false }
    }
  }
}))
