import { useEffect, useState } from 'react'
import { useLicenseStore, useCompanyStore } from './store'
import ActivationPage from './pages/ActivationPage'
import SetupWizard from './pages/SetupWizard'
import TallyLayout from './components/layout/TallyLayout'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const { license, isActivated, isLoading: licenseLoading, checkLicense } = useLicenseStore()
  const { hasCompany, isLoading: companyLoading, loadCompanies } = useCompanyStore()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const init = async () => {
      await checkLicense()
      await loadCompanies()
      // Show splash for at least 2 seconds
      setTimeout(() => setShowSplash(false), 2000)
    }
    init()
  }, [])

  // Show splash screen
  if (showSplash || licenseLoading || companyLoading) {
    return <SplashScreen />
  }

  // Step 1: License activation
  if (!isActivated) {
    return <ActivationPage />
  }

  // Step 2: Company setup (first-time)
  if (!hasCompany) {
    return <SetupWizard />
  }

  // Step 3: Tally-style Gateway Dashboard
  return <TallyLayout />
}
