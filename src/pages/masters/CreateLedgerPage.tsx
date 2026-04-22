import { useState, useEffect, useRef } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { genId, createLedger, getAccountGroups } from '../../lib/db'

interface AccountGroup {
  id: string
  name: string
  nature: string
  parentName?: string
  parentId?: string | null
}

const NATURE_COLOR: Record<string, string> = {
  ASSETS: 'text-green-400',
  LIABILITIES: 'text-red-400',
  INCOME: 'text-blue-400',
  EXPENSE: 'text-orange-400',
}

export default function CreateLedgerPage() {
  const { activeCompany } = useCompanyStore()
  const { goBack } = useNavigationStore()

  const [groups, setGroups] = useState<AccountGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    accountGroupId: '',
    accountGroupName: '',
    openingBalance: '',
    balanceType: 'DEBIT' as 'DEBIT' | 'CREDIT',
    gstin: '',
    panNumber: '',
    address: '',
    phone: '',
    email: '',
    creditLimit: '',
    creditPeriod: '',
  })

  useEffect(() => {
    nameRef.current?.focus()
    if (activeCompany?.id) {
      getAccountGroups(activeCompany.id).then(setGroups)
    }
  }, [activeCompany?.id])

  useKeyboardShortcuts([
    { key: 'a', ctrl: true, handler: handleSave, description: 'Accept/Save' },
    { key: 'Escape', handler: goBack, description: 'Go Back' },
  ])

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  )

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    if (error) setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Ledger name is required'); return }
    if (!form.accountGroupId) { setError('Please select a group'); return }
    if (!activeCompany?.id) return

    setLoading(true)
    try {
      const id = genId('led')
      const nature = groups.find(g => g.id === form.accountGroupId)?.nature ?? 'ASSETS'

      // Determine default balance type based on nature
      const defaultBalanceType = ['ASSETS', 'EXPENSE'].includes(nature) ? 'DEBIT' : 'CREDIT'

      await createLedger({
        id,
        companyId: activeCompany.id,
        name: form.name.trim(),
        accountGroupId: form.accountGroupId,
        openingBalance: parseFloat(form.openingBalance) || 0,
        balanceType: form.balanceType || defaultBalanceType,
        gstin: form.gstin,
        panNumber: form.panNumber,
        address: form.address,
        phone: form.phone,
        email: form.email,
        creditLimit: parseFloat(form.creditLimit) || 0,
        creditPeriod: parseInt(form.creditPeriod) || 0,
      })
      setSaved(true)
      setTimeout(() => {
        // Reset for next entry
        setForm({
          name: '', accountGroupId: '', accountGroupName: '',
          openingBalance: '', balanceType: 'DEBIT',
          gstin: '', panNumber: '', address: '', phone: '', email: '',
          creditLimit: '', creditPeriod: '',
        })
        setGroupSearch('')
        setSaved(false)
        nameRef.current?.focus()
      }, 700)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedNature = form.accountGroupId
    ? groups.find(g => g.id === form.accountGroupId)?.nature ?? ''
    : ''

  return (
    <div className="tally-form-page">
      {/* Page Header */}
      <div className="tally-form-header">
        <div>
          <h1 className="tally-form-title">Ledger Creation</h1>
          <p className="tally-form-subtitle">
            {activeCompany?.name} &nbsp;·&nbsp; Press <kbd className="tally-kbd">Ctrl+A</kbd> to Accept
          </p>
        </div>
        <button onClick={goBack} className="tally-form-back">
          ← Back <span className="text-surface-600 text-[10px] ml-1">Esc</span>
        </button>
      </div>

      <div className="tally-form-body">
        {/* LEFT COLUMN - Main fields */}
        <div className="tally-form-left">
          {/* Name */}
          <div className="tally-field-row">
            <label className="tally-field-label">Name</label>
            <input
              ref={nameRef}
              id="ledger-name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setShowGroupDropdown(true)}
              className="tally-field-input"
              placeholder="e.g. ABC Traders"
              autoComplete="off"
            />
          </div>

          {/* Group */}
          <div className="tally-field-row">
            <label className="tally-field-label">Under</label>
            <div className="relative flex-1">
              <input
                id="ledger-group"
                value={groupSearch || form.accountGroupName}
                onChange={e => {
                  setGroupSearch(e.target.value)
                  setShowGroupDropdown(true)
                  if (!e.target.value) set('accountGroupId', '')
                }}
                onFocus={() => setShowGroupDropdown(true)}
                onBlur={() => setTimeout(() => setShowGroupDropdown(false), 200)}
                className="tally-field-input w-full"
                placeholder="Select Group..."
                autoComplete="off"
              />
              {form.accountGroupId && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${NATURE_COLOR[selectedNature]}`}>
                  {selectedNature}
                </span>
              )}
              {showGroupDropdown && (
                <div className="tally-dropdown">
                  {filteredGroups.length === 0 && (
                    <div className="px-3 py-2 text-xs text-surface-500">No groups found</div>
                  )}
                  {/* Group by nature */}
                  {(['ASSETS','LIABILITIES','INCOME','EXPENSE'] as const).map(nature => {
                    const natGroups = filteredGroups.filter(g => g.nature === nature)
                    if (!natGroups.length) return null
                    return (
                      <div key={nature}>
                        <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${NATURE_COLOR[nature]} bg-surface-900/80`}>
                          {nature}
                        </div>
                        {natGroups.map(g => (
                          <button
                            key={g.id}
                            className="tally-dropdown-item"
                            onMouseDown={() => {
                              setForm(f => ({ ...f, accountGroupId: g.id, accountGroupName: g.name }))
                              setGroupSearch('')
                              setShowGroupDropdown(false)
                            }}
                          >
                            <span>{g.name}</span>
                            {g.parentName && (
                              <span className="text-surface-600 text-[10px] ml-2">▸ {g.parentName}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="tally-divider" />

          {/* Opening Balance */}
          <div className="tally-field-row">
            <label className="tally-field-label">Opening Balance</label>
            <div className="flex gap-2 flex-1">
              <input
                id="ledger-opening"
                type="number"
                value={form.openingBalance}
                onChange={e => set('openingBalance', e.target.value)}
                className="tally-field-input flex-1"
                placeholder="0.00"
                min="0"
              />
              <select
                value={form.balanceType}
                onChange={e => set('balanceType', e.target.value as any)}
                className="tally-field-select w-24"
              >
                <option value="DEBIT">Dr</option>
                <option value="CREDIT">Cr</option>
              </select>
            </div>
          </div>

          {/* GSTIN */}
          <div className="tally-field-row">
            <label className="tally-field-label">GSTIN</label>
            <input
              value={form.gstin}
              onChange={e => set('gstin', e.target.value.toUpperCase())}
              className="tally-field-input font-mono"
              placeholder="e.g. 27AABCU9603R1ZM"
              maxLength={15}
            />
          </div>

          {/* PAN */}
          <div className="tally-field-row">
            <label className="tally-field-label">PAN Number</label>
            <input
              value={form.panNumber}
              onChange={e => set('panNumber', e.target.value.toUpperCase())}
              className="tally-field-input font-mono"
              placeholder="e.g. AABCU9603R"
              maxLength={10}
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Contact & Credit */}
        <div className="tally-form-right">
          <div className="tally-section-title">Contact Details</div>

          <div className="tally-field-row">
            <label className="tally-field-label">Address</label>
            <textarea
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="tally-field-textarea"
              rows={2}
              placeholder="Party address..."
            />
          </div>

          <div className="tally-field-row">
            <label className="tally-field-label">Phone</label>
            <input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="tally-field-input"
              placeholder="Mobile/Landline"
            />
          </div>

          <div className="tally-field-row">
            <label className="tally-field-label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="tally-field-input"
              placeholder="party@example.com"
            />
          </div>

          <div className="tally-divider" />
          <div className="tally-section-title">Credit Settings</div>

          <div className="tally-field-row">
            <label className="tally-field-label">Credit Limit</label>
            <input
              type="number"
              value={form.creditLimit}
              onChange={e => set('creditLimit', e.target.value)}
              className="tally-field-input"
              placeholder="₹ 0"
              min="0"
            />
          </div>

          <div className="tally-field-row">
            <label className="tally-field-label">Credit Period</label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="number"
                value={form.creditPeriod}
                onChange={e => set('creditPeriod', e.target.value)}
                className="tally-field-input flex-1"
                placeholder="0"
                min="0"
              />
              <span className="text-xs text-surface-400">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="tally-form-footer">
        {error && <span className="tally-form-error">{error}</span>}
        {saved && <span className="tally-form-success">✓ Ledger created successfully!</span>}
        <div className="flex gap-3 ml-auto">
          <button onClick={goBack} className="tally-btn-cancel">
            Cancel <span className="text-[10px] ml-1 text-surface-600">Esc</span>
          </button>
          <button onClick={handleSave} disabled={loading} className="tally-btn-accept">
            {loading ? 'Saving...' : 'Accept'} <span className="text-[10px] ml-1 text-brand-300">Ctrl+A</span>
          </button>
        </div>
      </div>
    </div>
  )
}
