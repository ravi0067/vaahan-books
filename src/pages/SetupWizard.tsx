import { useState } from 'react'
import { useCompanyStore } from '../store'

const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' }, { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' }, { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' }, { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' }, { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' }, { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' }, { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' }, { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
]

interface FormData {
  name: string
  tradeName: string
  gstin: string
  panNumber: string
  address: string
  city: string
  state: string
  stateCode: string
  pincode: string
  phone: string
  email: string
  financialYearStart: string
}

const STEPS = [
  { num: 1, title: 'Company Name', icon: '🏢' },
  { num: 2, title: 'GSTIN / PAN', icon: '📋' },
  { num: 3, title: 'Address & State', icon: '📍' },
  { num: 4, title: 'Financial Year', icon: '📅' },
  { num: 5, title: 'Contact Details', icon: '📞' },
  { num: 6, title: 'Review & Create', icon: '✅' },
]

export default function SetupWizard() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { loadCompanies } = useCompanyStore()

  const [form, setForm] = useState<FormData>({
    name: '',
    tradeName: '',
    gstin: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    phone: '',
    email: '',
    financialYearStart: '4', // April
  })

  const updateForm = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  // ✅ FIX: GSTIN handler — auto-fills PAN (chars 3-12) and State (first 2 digits)
  const handleGstinChange = (value: string) => {
    const val = value.toUpperCase()
    setForm(prev => {
      const updated = { ...prev, gstin: val }
      // Auto-extract PAN from GSTIN (characters 3-12)
      if (val.length >= 12) {
        updated.panNumber = val.substring(2, 12)
      } else if (val.length < 3) {
        updated.panNumber = ''
      }
      // Auto-detect state from GSTIN (first 2 digits)
      if (val.length >= 2) {
        const sc = val.substring(0, 2)
        const st = INDIAN_STATES.find(s => s.code === sc)
        if (st) {
          updated.state = st.name
          updated.stateCode = st.code
        }
      }
      return updated
    })
    setError('')
  }

  const handleStateChange = (stateCode: string) => {
    const state = INDIAN_STATES.find(s => s.code === stateCode)
    if (state) {
      setForm(prev => ({ ...prev, state: state.name, stateCode: state.code }))
    }
  }

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!form.name.trim()) { setError('Company name is required'); return false }
        return true
      case 2: return true // GSTIN is optional
      case 3:
        if (!form.state) { setError('Please select your state'); return false }
        return true
      case 4: return true
      case 5: return true
      default: return true
    }
  }

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 6))
  }

  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  // ✅ FIX: Removed broken db.run('-- comment'), chart of accounts now seeds in main process
  const handleCreate = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const result = await window.electronAPI.company.create({
        name: form.name,
        tradeName: form.tradeName,
        gstin: form.gstin,
        panNumber: form.panNumber,
        address: form.address,
        city: form.city,
        state: form.state,
        stateCode: form.stateCode,
        pincode: form.pincode,
        phone: form.phone,
        email: form.email,
        financialYearStart: parseInt(form.financialYearStart),
        isDefault: true,
      })

      if (result.success) {
        await loadCompanies()
      } else {
        setError(result.error || 'Failed to create company')
      }
    } catch (err: any) {
      setError(err.message)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="h-screen w-screen flex bg-surface-950 select-none">
      {/* Left - Steps Indicator */}
      <div className="hidden md:flex w-72 flex-col p-8 border-r border-surface-800 bg-surface-900/30">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">VaahanBooks</p>
            <p className="text-xs text-surface-500">Company Setup</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {STEPS.map(s => (
            <div
              key={s.num}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                step === s.num
                  ? 'bg-brand-500/10 border border-brand-500/20'
                  : step > s.num
                  ? 'text-green-400'
                  : 'text-surface-500'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num
                  ? 'bg-brand-500 text-white'
                  : step > s.num
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-surface-800 text-surface-500'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <div>
                <p className={`text-sm font-medium ${step === s.num ? 'text-white' : ''}`}>
                  {s.title}
                </p>
              </div>
            </div>
          ))}
        </nav>

        {/* Progress */}
        <div className="mt-auto">
          <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
          <p className="text-surface-500 text-xs mt-2">Step {step} of 6</p>
        </div>
      </div>

      {/* Right - Form Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile step indicator */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-surface-800">
          <span className="text-sm text-surface-400">Step {step}: {STEPS[step-1].title}</span>
          <span className="text-xs text-bran
          <div className="card !bg-brand-500/5 !border-brand-500/15">
                      <p className="text-sm text-brand-400 flex items-center gap-2">
                        <span>📍</span> State auto-detected: <strong>{form.stateCode} - {form.state}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Address & State */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Business Address</h2>
                  <p className="text-surface-400 text-sm">State is important for correct GST (CGST/SGST vs IGST) calculation.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">Address</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => updateForm('address', e.target.value)}
                      placeholder="Shop No. 12, Main Road, Near Bus Stand"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-white placeholder:text-surface-600 input-focus resize-none"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-1.5">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => updateForm('city', e.target.value)}
                        placeholder="e.g., Jaipur"
                        className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-white placeholder:text-surface-600 input-focus"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-1.5">Pincode</label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={(e) => updateForm('pincode', e.target.value.replace(/\D/g, ''))}
                        placeholder="302001"
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-white placeholder:text-surface-600 input-focus"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">State *</label>
                    <select
                      value={form.stateCode}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-white input-focus"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Financial Year */}
            {step === 4 && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Financial Year Setup</h2>
                  <p className="text-surface-400 text-sm">Most Indian businesses follow April to March financial year.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">Financial Year Starts From</label>
                    <select
                      value={form.financialYearStart}
                      onChange={(e) => updateForm('financialYearStart', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-white input-focus"
                    >
                      <option value="1">January</option>
                      <option value="4">April (Default - Indian Standard)</option>
                      <option value="7">July</option>
                      <option value="10">October</option>
                    </select>
                  </div>
                  <div className="card !bg-brand-500/5 !border-brand-500/15">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">💡</span>
                      <div>
                        <p className="text-sm text-surface-300 font-medium">Tip: Indian Standard (April)</p>
                        <p className="text-xs text-surface-500 mt-1">
                          Most businesses in India follow April-March financial year for GST and IT returns.
                          You cannot change this later for existing data.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Contact */}
            {step === 5 && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Contact Information</h2>
                  <p className="text-surface-400 text-sm">Optional. Used on invoices and for communication.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-white placeholder:text-surface-600 input-focus"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      placeholder="billing@yourbusiness.com"
                      className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-white placeholder:text-surface-600 input-focus"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Review & Create</h2>
                  <p className="text-surface-400 text-sm">Review your company details. You can edit these later from Settings.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Company Name', value: form.name },
                    { label: 'Trade Name', value: form.tradeName || '—' },
                    { label: 'GSTIN', value: form.gstin || 'Not provided' },
                    { label: 'PAN', value: form.panNumber || 'Not provided' },
                    { label: 'Address', value: [form.address, form.city, form.state, form.pincode].filter(Boolean).join(', ') || '—' },
                    { label: 'State', value: form.state ? `${form.stateCode} - ${form.state}` : '—' },
                    { label: 'Financial Year', value: form.financialYearStart === '4' ? 'April - March' : `Month ${form.financialYearStart} start` },
                    { label: 'Phone', value: form.phone || '—' },
                    { label: 'Email', value: form.email || '—' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-surface-800/50">
                      <span className="text-sm text-surface-400">{item.label}</span>
                      <span className="text-sm text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="card !bg-green-500/5 !border-green-500/15">
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <span>✅</span>
                    Indian Chart of Accounts will be auto-created (Tally-compatible)
                  </p>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-white border border-surface-700 hover:border-surface-600 transition-all"
                >
                  ← Back
                </button>
              ) : <div />}

              {step < 6 ? (
                <button
                  onClick={nextStep}
                  className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all glow-blue"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 transition-all glow-green"
                >
                  {isSubmitting ? 'Creating...' : '🎉 Create Company'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
