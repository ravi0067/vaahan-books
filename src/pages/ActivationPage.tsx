import { useState } from 'react'
import { useLicenseStore } from '../store'

export default function ActivationPage() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { activateLicense } = useLicenseStore()

  const handleActivate = async () => {
    if (!key.trim()) {
      setError('Please enter your license key')
      return
    }

    setIsLoading(true)
    setError('')

    const result = await activateLicense(key.trim().toUpperCase())

    if (!result.success) {
      setError(result.error || 'Activation failed')
    }
    setIsLoading(false)
  }

  const formatKey = (value: string) => {
    // Auto-format: VB-2026-XXXX-XXXX-XXXX
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    setKey(cleaned)
  }

  return (
    <div className="h-screen w-screen flex bg-surface-950 select-none">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-surface-950 to-purple-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">VaahanBooks</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            <span className="gradient-text">AI-Powered</span><br />
            <span className="text-white">Billing & Accounting</span><br />
            <span className="text-surface-400">Software</span>
          </h2>
          <p className="text-surface-400 text-lg leading-relaxed max-w-md">
            GST invoicing, double-entry accounting, GSTR filing,
            bank reconciliation, and AI insights — all in one desktop app.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['GST Compliant', 'E-Invoice', 'AI Insights', 'Offline-First', 'Auto Backup'].map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-surface-600 text-sm">© 2026 VaahanERP. All rights reserved.</p>
      </div>

      {/* Right Panel - Activation Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">VaahanBooks</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Activate Your License</h1>
            <p className="text-surface-400 text-sm">
              Enter the license key you received after purchasing your plan from{' '}
              <button
                onClick={() => window.electronAPI?.system.openExternal('https://books.vaahanerp.com')}
                className="text-brand-400 hover:text-brand-300 underline"
              >
                books.vaahanerp.com
              </button>
            </p>
          </div>

          {/* License Key Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                License Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => formatKey(e.target.value)}
                placeholder="VB-2026-XXXX-XXXX-XXXX"
                maxLength={24}
                className="w-full px-4 py-3.5 rounded-xl bg-surface-900 border border-surface-700
                  text-white font-mono text-base tracking-wider placeholder:text-surface-600
                  input-focus"
                onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={isLoading || !key.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500
                text-white font-semibold text-sm hover:from-brand-500 hover:to-brand-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 glow-blue"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Activating...
                </span>
              ) : (
                'Activate License'
              )}
            </button>
          </div>

          {/* Help Section */}
          <div className="space-y-3 pt-4 border-t border-surface-800">
            <p className="text-surface-500 text-xs">
              <strong className="text-surface-400">Demo Key:</strong>{' '}
              <code className="px-2 py-0.5 rounded bg-surface-800 text-brand-400 font-mono text-xs">
                VB-2026-DEMO-TEST-KEY1
              </code>
            </p>
            <p className="text-surface-600 text-xs">
              Don't have a license? Visit{' '}
              <button
                onClick={() => window.electronAPI?.system.openExternal('https://books.vaahanerp.com/pricing')}
                className="text-brand-400 hover:underline"
              >
                books.vaahanerp.com/pricing
              </button>{' '}
              to purchase a plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
