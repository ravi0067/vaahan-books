import { useState, useEffect, useRef, useCallback } from 'react'
import { useCompanyStore } from '../../store'
import { useNavigationStore } from '../../hooks/useNavigationStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { genId, getLedgers, getNextVoucherNumber, saveVoucher } from '../../lib/db'

/* ─── Types ───────────────────────────────────────────────── */
type VoucherType = 'SALES' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'CONTRA' | 'JOURNAL'

interface VoucherLine {
  id: string
  ledgerId: string
  ledgerName: string
  amount: string
  isDebit: boolean
  hsnCode: string
  gstRate: string
  cgst: number
  sgst: number
  igst: number
  taxableAmount: number
  quantity: string
  unit: string
  rate: string
  discount: string
  description: string
}

interface Ledger {
  id: string; name: string; groupName: string; nature: string
  ledgerType: string; currentBalance: number; balanceType: string
}

/* ─── Voucher Type Meta ───────────────────────────────────── */
const VOUCHER_META: Record<VoucherType, {
  label: string; key: string; color: string; border: string
  defaultDebitGroup: string[]; defaultCreditGroup: string[]
  showParty: boolean; showInventory: boolean
}> = {
  SALES: {
    label: 'Sales', key: 'F8', color: 'text-green-400', border: 'border-green-500/30',
    defaultDebitGroup: ['Sundry Debtors', 'Bank Accounts', 'Cash-in-Hand'],
    defaultCreditGroup: ['Sales Accounts'],
    showParty: true, showInventory: true
  },
  PURCHASE: {
    label: 'Purchase', key: 'F9', color: 'text-blue-400', border: 'border-blue-500/30',
    defaultDebitGroup: ['Purchase Accounts'],
    defaultCreditGroup: ['Sundry Creditors', 'Bank Accounts', 'Cash-in-Hand'],
    showParty: true, showInventory: true
  },
  RECEIPT: {
    label: 'Receipt', key: 'F6', color: 'text-emerald-400', border: 'border-emerald-500/30',
    defaultDebitGroup: ['Bank Accounts', 'Cash-in-Hand'],
    defaultCreditGroup: ['Sundry Debtors'],
    showParty: true, showInventory: false
  },
  PAYMENT: {
    label: 'Payment', key: 'F5', color: 'text-red-400', border: 'border-red-500/30',
    defaultDebitGroup: ['Sundry Creditors'],
    defaultCreditGroup: ['Bank Accounts', 'Cash-in-Hand'],
    showParty: true, showInventory: false
  },
  CONTRA: {
    label: 'Contra', key: 'F4', color: 'text-amber-400', border: 'border-amber-500/30',
    defaultDebitGroup: ['Bank Accounts'],
    defaultCreditGroup: ['Cash-in-Hand'],
    showParty: false, showInventory: false
  },
  JOURNAL: {
    label: 'Journal', key: 'F7', color: 'text-purple-400', border: 'border-purple-500/30',
    defaultDebitGroup: [],
    defaultCreditGroup: [],
    showParty: false, showInventory: false
  },
}

/* ─── GST Calculation ─────────────────────────────────────── */
function calcGST(taxable: number, gstRate: number, isInterState: boolean) {
  const total = taxable * (gstRate / 100)
  if (isInterState) return { cgst: 0, sgst: 0, igst: total }
  return { cgst: total / 2, sgst: total / 2, igst: 0 }
}

/* ─── Empty line factory ──────────────────────────────────── */
function newLine(): VoucherLine {
  return {
    id: genId('li'), ledgerId: '', ledgerName: '', amount: '',
    isDebit: true, hsnCode: '', gstRate: '0', cgst: 0, sgst: 0, igst: 0,
    taxableAmount: 0, quantity: '1', unit: 'PCS', rate: '', discount: '0',
    description: ''
  }
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function VoucherEntryPage({ voucherType: initialType }: { voucherType?: VoucherType }) {
  const { activeCompany } = useCompanyStore()
  const { navigateTo, goBack, currentPage } = useNavigationStore()

  // Derive voucher type from route
  const routeType: VoucherType = (currentPage.replace('voucher-', '').toUpperCase() as VoucherType) || initialType || 'SALES'
  const [vtype, setVtype] = useState<VoucherType>(routeType)
  const meta = VOUCHER_META[vtype]

  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [voucherNo, setVoucherNo] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [partyLedgerId, setPartyLedgerId] = useState('')
  const [partyLedgerName, setPartyLedgerName] = useState('')
  const [partySearch, setPartySearch] = useState('')
  const [showPartyDrop, setShowPartyDrop] = useState(false)
  const [isInterState, setIsInterState] = useState(false)
  const [narration, setNarration] = useState('')
  const [lines, setLines] = useState<VoucherLine[]>([newLine()])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [lineSearchId, setLineSearchId] = useState<string | null>(null)
  const [lineSearch, setLineSearch] = useState('')
  const firstRef = useRef<HTMLInputElement>(null)
  const [provideEInvoice, setProvideEInvoice] = useState(false)
  const [eInvoiceDetails, setEInvoiceDetails] = useState({ billToPlace: '', shipToPlace: '', distance: '' })
  const [showEInvoiceSubForm, setShowEInvoiceSubForm] = useState(false)
  const [showEInvoicePrompt, setShowEInvoicePrompt] = useState(false)
  const [generatedEInvoice, setGeneratedEInvoice] = useState<{ irn: string, ackNo: string, ackDate: string } | null>(null)
  
  // To keep track of the saved voucher ID for attaching e-Invoice later if needed
  const [lastSavedVoucherId, setLastSavedVoucherId] = useState<string | null>(null)

  /* ─── Load data ─────────────────────────── */
  useEffect(() => {
    if (!activeCompany?.id) return
    getLedgers(activeCompany.id).then(setLedgers)
    getNextVoucherNumber(activeCompany.id, vtype).then(setVoucherNo)
    setLines([newLine()])
    setPartyLedgerId('')
    setPartyLedgerName('')
    setPartySearch('')
    setNarration('')
    setError('')
    setProvideEInvoice(false)
    setEInvoiceDetails({ billToPlace: '', shipToPlace: '', distance: '' })
    firstRef.current?.focus()
  }, [activeCompany?.id, vtype])

  /* ─── Keyboard shortcuts ─────────────────── */
  useKeyboardShortcuts([
    { key: 'a', ctrl: true, handler: handleSave, description: 'Accept/Save' },
    { key: 'Escape', handler: goBack },
    { key: 'F4', handler: () => setVtype('CONTRA') },
    { key: 'F5', handler: () => setVtype('PAYMENT') },
    { key: 'F6', handler: () => setVtype('RECEIPT') },
    { key: 'F7', handler: () => setVtype('JOURNAL') },
    { key: 'F8', handler: () => setVtype('SALES') },
    { key: 'F9', handler: () => setVtype('PURCHASE') },
  ])

  /* ─── Derived values ─────────────────────── */
  const totalTaxable = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0)
  const totalCGST = lines.reduce((s, l) => s + l.cgst, 0)
  const totalSGST = lines.reduce((s, l) => s + l.sgst, 0)
  const totalIGST = lines.reduce((s, l) => s + l.igst, 0)
  const grandTotal = totalTaxable + totalCGST + totalSGST + totalIGST

  /* ─── Party search ───────────────────────── */
  const filteredParties = ledgers.filter(l =>
    l.name.toLowerCase().includes(partySearch.toLowerCase()) &&
    ['Sundry Debtors', 'Sundry Creditors', 'Bank Accounts', 'Cash-in-Hand'].includes(l.groupName)
  )

  /* ─── Line ledger search ─────────────────── */
  const filteredLineLedgers = ledgers.filter(l =>
    l.name.toLowerCase().includes(lineSearch.toLowerCase()) &&
    !['Sundry Debtors', 'Sundry Creditors'].includes(l.groupName)
  )

  /* ─── Update a line field ────────────────── */
  function updateLine(id: string, field: keyof VoucherLine, value: any) {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l
      const updated = { ...l, [field]: value }
      // Recalculate GST when rate/qty/gstRate changes
      if (['rate', 'quantity', 'discount', 'gstRate', 'amount'].includes(field)) {
        const amt = parseFloat(updated.amount) || 0
        const gstPct = parseFloat(updated.gstRate) || 0
        const gst = calcGST(amt, gstPct, isInterState)
        return { ...updated, ...gst, taxableAmount: amt }
      }
      return updated
    }))
  }

  /* ─── Select ledger for a line ───────────── */
  function selectLineLedger(lineId: string, led: Ledger) {
    updateLine(lineId, 'ledgerId', led.id)
    updateLine(lineId, 'ledgerName', led.name)
    setLineSearchId(null)
    setLineSearch('')
    // Add new empty line if this was last
    setLines(prev => {
      const idx = prev.findIndex(l => l.id === lineId)
      if (idx === prev.length - 1) return [...prev, newLine()]
      return prev
    })
  }

  /* ─── Remove a line ──────────────────────── */
  function removeLine(id: string) {
    setLines(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev)
  }

  /* ─── Save voucher ───────────────────────── */
  async function handleSave() {
    if (!activeCompany?.id) return
    if (!partyLedgerId && meta.showParty) { setError('Please select a party'); return }
    const validLines = lines.filter(l => l.ledgerId && parseFloat(l.amount) > 0)
    if (validLines.length === 0) { setError('Add at least one ledger line with amount'); return }

    setSaving(true)
    setError('')
    try {
      const vid = genId('vch')

      // Build double entry items
      const items = []

      // Party ledger (Dr for Sales, Cr for Purchase, Dr for Receipt, Cr for Payment)
      if (partyLedgerId) {
        const partyIsDebit = ['SALES', 'RECEIPT'].includes(vtype)
        items.push({
          id: genId('vi'), ledgerId: partyLedgerId,
          amount: grandTotal, isDebit: partyIsDebit ? 1 : 0,
          description: 'Party', sortOrder: 0
        })
      }

      // Inventory/account lines
      validLines.forEach((l, idx) => {
        const lineIsDebit = !(['SALES', 'RECEIPT'].includes(vtype))
        items.push({
          id: l.id, ledgerId: l.ledgerId, amount: parseFloat(l.amount),
          isDebit: lineIsDebit ? 1 : 0,
          hsnCode: l.hsnCode, gstRate: parseFloat(l.gstRate) || 0,
          cgst: l.cgst, sgst: l.sgst, igst: l.igst,
          taxableAmount: l.taxableAmount,
          quantity: parseFloat(l.quantity) || 0, unit: l.unit,
          rate: parseFloat(l.rate) || 0, discount: parseFloat(l.discount) || 0,
          description: l.description, sortOrder: idx + 1
        })
      })

      // GST lines
      if (totalCGST > 0) {
        const cgstLed = ledgers.find(l => l.name.includes('CGST'))
        if (cgstLed) items.push({
          id: genId('vi'), ledgerId: cgstLed.id, amount: totalCGST,
          isDebit: ['PURCHASE'].includes(vtype) ? 1 : 0,
          description: 'CGST', sortOrder: 99
        })
      }
      if (totalSGST > 0) {
        const sgstLed = ledgers.find(l => l.name.includes('SGST'))
        if (sgstLed) items.push({
          id: genId('vi'), ledgerId: sgstLed.id, amount: totalSGST,
          isDebit: ['PURCHASE'].includes(vtype) ? 1 : 0,
          description: 'SGST', sortOrder: 100
        })
      }
      if (totalIGST > 0) {
        const igstLed = ledgers.find(l => l.name.includes('IGST'))
        if (igstLed) items.push({
          id: genId('vi'), ledgerId: igstLed.id, amount: totalIGST,
          isDebit: ['PURCHASE'].includes(vtype) ? 1 : 0,
          description: 'IGST', sortOrder: 101
        })
      }

      await saveVoucher({
        id: vid, companyId: activeCompany.id,
        voucherNumber: voucherNo, voucherDate: date,
        voucherType: vtype, partyLedgerId: partyLedgerId || null,
        narration, totalAmount: grandTotal,
        isInterState: isInterState ? 1 : 0,
        status: 'CONFIRMED'
      }, items as any)

      setSaved(true)
      setLastSavedVoucherId(vid)
      
      // If e-Invoice is enabled, don't reset form immediately, show prompt instead
      if (vtype === 'SALES' && provideEInvoice) {
        setSaved(false)
        setShowEInvoicePrompt(true)
        return
      }

      setTimeout(() => {
        resetForm()
      }, 800)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setSaved(false)
    setLines([newLine()])
    setPartyLedgerId('')
    setPartyLedgerName('')
    setNarration('')
    setProvideEInvoice(false)
    setGeneratedEInvoice(null)
    getNextVoucherNumber(activeCompany.id!, vtype).then(setVoucherNo)
    firstRef.current?.focus()
  }

  /* ─── E-Invoice Generation ───────────────── */
  function generateEInvoice() {
    setShowEInvoicePrompt(false)
    setSaving(true)
    // Simulate API call to IRP
    setTimeout(() => {
      setGeneratedEInvoice({
        irn: '4e6b' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
        ackNo: Math.floor(1000000000000000 + Math.random() * 900000000000000).toString(),
        ackDate: new Date().toLocaleString()
      })
      setSaving(false)
    }, 1500)
  }

  /* ─── Render ─────────────────────────────── */
  return (
    <div className="voucher-page">
      {/* Voucher Type Switcher */}
      <div className="voucher-type-bar">
        {(Object.keys(VOUCHER_META) as VoucherType[]).map(t => (
          <button
            key={t}
            onClick={() => setVtype(t)}
            className={`voucher-type-btn ${vtype === t ? 'voucher-type-btn-active' : ''}`}
          >
            <span className="voucher-type-key">{VOUCHER_META[t].key}</span>
            <span>:{VOUCHER_META[t].label}</span>
          </button>
        ))}
      </div>

      {/* Header row */}
      <div className="voucher-header">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-surface-500">Voucher No.</span>
            <div className={`text-lg font-bold font-mono ${meta.color}`}>{voucherNo}</div>
          </div>
          <div>
            <span className="text-xs text-surface-500">Date</span>
            <input
              ref={firstRef}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="voucher-date-input"
            />
          </div>
          {meta.showInventory && (
            <label className="flex items-center gap-1.5 text-xs text-surface-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isInterState}
                onChange={e => setIsInterState(e.target.checked)}
                className="w-3.5 h-3.5"
              />
              Inter-State (IGST)
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="tally-btn-cancel text-xs">Cancel <span className="opacity-50 text-[10px]">Esc</span></button>
          <button onClick={handleSave} disabled={saving} className="tally-btn-accept text-xs">
            {saving ? 'Saving...' : 'Accept'} <span className="text-brand-300 text-[10px] ml-1">Ctrl+A</span>
          </button>
        </div>
      </div>

      {/* Party selector */}
      {meta.showParty && (
        <div className="voucher-party-row">
          <label className="text-xs text-surface-400 w-28 flex-shrink-0">
            {vtype === 'SALES' ? 'Party A/c Name' :
             vtype === 'PURCHASE' ? 'Party A/c Name' :
             vtype === 'RECEIPT' ? 'Received from' : 'Paid to'}
          </label>
          <div className="relative flex-1">
            <input
              value={partySearch || partyLedgerName}
              onChange={e => { setPartySearch(e.target.value); setShowPartyDrop(true) }}
              onFocus={() => setShowPartyDrop(true)}
              onBlur={() => setTimeout(() => setShowPartyDrop(false), 200)}
              className="voucher-party-input"
              placeholder="Select party ledger..."
            />
            {showPartyDrop && (
              <div className="tally-dropdown max-h-48">
                {filteredParties.map(l => (
                  <button key={l.id} className="tally-dropdown-item"
                    onMouseDown={() => {
                      setPartyLedgerId(l.id)
                      setPartyLedgerName(l.name)
                      setPartySearch('')
                      setShowPartyDrop(false)
                    }}>
                    <span>{l.name}</span>
                    <span className="text-surface-500 text-[10px] ml-2">{l.groupName}</span>
                  </button>
                ))}
                {filteredParties.length === 0 && (
                  <div className="px-3 py-2 text-xs text-surface-500">No party found</div>
                )}
              </div>
            )}
          </div>
          {partyLedgerId && (
            <span className="text-xs text-surface-500 ml-3">
              Current: ₹{ledgers.find(l => l.id === partyLedgerId)?.currentBalance?.toFixed(2) ?? '0.00'}
            </span>
          )}
        </div>
      )}

      {/* Lines Table */}
      <div className="voucher-lines-container">
        <table className="voucher-table">
          <thead>
            <tr className="voucher-table-head">
              <th className="w-8">#</th>
              <th className="text-left">Account Ledger</th>
              {meta.showInventory && <>
                <th>HSN/SAC</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>GST%</th>
              </>}
              <th className="text-right">Amount (₹)</th>
              {meta.showInventory && <>
                <th className="text-right">CGST</th>
                <th className="text-right">SGST</th>
                <th className="text-right">IGST</th>
              </>}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={line.id} className="voucher-table-row">
                <td className="text-center text-surface-500 text-xs">{idx + 1}</td>

                {/* Ledger selector */}
                <td className="relative">
                  {lineSearchId === line.id ? (
                    <div className="relative">
                      <input
                        autoFocus
                        value={lineSearch}
                        onChange={e => setLineSearch(e.target.value)}
                        onBlur={() => {
                          setTimeout(() => {
                            setLineSearchId(null)
                            setLineSearch('')
                          }, 200)
                        }}
                        className="voucher-line-input w-full"
                        placeholder="Search ledger..."
                      />
                      {lineSearch && (
                        <div className="tally-dropdown max-h-40 z-50">
                          {filteredLineLedgers.slice(0, 8).map(l => (
                            <button key={l.id} className="tally-dropdown-item"
                              onMouseDown={() => selectLineLedger(line.id, l)}>
                              <span>{l.name}</span>
                              <span className="text-surface-500 text-[10px] ml-2">{l.groupName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className={`voucher-line-ledger-btn ${line.ledgerName ? 'text-white' : 'text-surface-500'}`}
                      onClick={() => { setLineSearchId(line.id); setLineSearch('') }}
                    >
                      {line.ledgerName || 'Click to select ledger...'}
                    </button>
                  )}
                </td>

                {/* Inventory cols */}
                {meta.showInventory && <>
                  <td>
                    <input value={line.hsnCode} onChange={e => updateLine(line.id, 'hsnCode', e.target.value)}
                      className="voucher-line-input w-20 font-mono" placeholder="HSN" />
                  </td>
                  <td>
                    <input value={line.quantity} onChange={e => updateLine(line.id, 'quantity', e.target.value)}
                      className="voucher-line-input w-16 text-right" type="number" min="0" />
                  </td>
                  <td>
                    <input value={line.rate} onChange={e => {
                      updateLine(line.id, 'rate', e.target.value)
                      const qty = parseFloat(line.quantity) || 1
                      const rate = parseFloat(e.target.value) || 0
                      updateLine(line.id, 'amount', String(qty * rate))
                    }}
                      className="voucher-line-input w-24 text-right" type="number" min="0" />
                  </td>
                  <td>
                    <select value={line.gstRate} onChange={e => updateLine(line.id, 'gstRate', e.target.value)}
                      className="voucher-line-select w-16">
                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </td>
                </>}

                {/* Amount */}
                <td>
                  <input value={line.amount} onChange={e => updateLine(line.id, 'amount', e.target.value)}
                    className="voucher-line-input w-28 text-right font-mono" type="number" min="0" placeholder="0.00" />
                </td>

                {/* GST cols */}
                {meta.showInventory && <>
                  <td className="text-right text-xs font-mono text-surface-400">
                    {line.cgst > 0 ? line.cgst.toFixed(2) : '-'}
                  </td>
                  <td className="text-right text-xs font-mono text-surface-400">
                    {line.sgst > 0 ? line.sgst.toFixed(2) : '-'}
                  </td>
                  <td className="text-right text-xs font-mono text-surface-400">
                    {line.igst > 0 ? line.igst.toFixed(2) : '-'}
                  </td>
                </>}

                {/* Delete */}
                <td>
                  <button onClick={() => removeLine(line.id)}
                    className="text-surface-600 hover:text-red-400 transition-colors text-xs px-1">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add line button */}
        <button
          onClick={() => setLines(prev => [...prev, newLine()])}
          className="voucher-add-line"
        >
          + Add Line
        </button>
      </div>

      {/* Narration + Totals */}
      <div className="voucher-footer-grid">
        {/* Narration */}
        <div className="voucher-narration-box flex flex-col justify-between">
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Narration</label>
            <textarea
              value={narration}
              onChange={e => setNarration(e.target.value)}
              className="voucher-narration-input"
              rows={2}
              placeholder="Being: ..."
            />
          </div>
          {vtype === 'SALES' && (
            <div className="flex items-center gap-4 mt-2 py-1">
              <label className="text-xs text-brand-300 font-semibold">Provide e-Invoice details</label>
              <select 
                value={provideEInvoice ? 'Yes' : 'No'}
                onChange={e => {
                  const val = e.target.value === 'Yes'
                  setProvideEInvoice(val)
                  if (val) setShowEInvoiceSubForm(true)
                }}
                className="tally-field-select !w-16 !bg-brand-900/30 font-bold text-white border-brand-500/50"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="voucher-totals-box">
          {meta.showInventory && <>
            <div className="voucher-total-row">
              <span className="text-surface-400">Taxable Amount</span>
              <span className="font-mono">₹{totalTaxable.toFixed(2)}</span>
            </div>
            {!isInterState && totalCGST > 0 && (
              <>
                <div className="voucher-total-row text-xs">
                  <span className="text-surface-500">CGST</span>
                  <span className="font-mono text-surface-400">₹{totalCGST.toFixed(2)}</span>
                </div>
                <div className="voucher-total-row text-xs">
                  <span className="text-surface-500">SGST</span>
                  <span className="font-mono text-surface-400">₹{totalSGST.toFixed(2)}</span>
                </div>
              </>
            )}
            {isInterState && totalIGST > 0 && (
              <div className="voucher-total-row text-xs">
                <span className="text-surface-500">IGST</span>
                <span className="font-mono text-surface-400">₹{totalIGST.toFixed(2)}</span>
              </div>
            )}
            <div className="voucher-total-divider" />
          </>}
          <div className="voucher-total-row voucher-grand-total">
            <span>Grand Total</span>
            <span className={`font-mono font-bold text-xl ${meta.color}`}>
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Status bar */}
      {(error || saved) && (
        <div className={`voucher-status-msg ${saved ? 'text-green-400' : 'text-red-400'}`}>
          {saved ? `✓ ${meta.label} voucher ${voucherNo} saved successfully!` : `⚠ ${error}`}
        </div>
      )}

      {/* ── e-Invoice Sub Form Modal ── */}
      {showEInvoiceSubForm && (
        <div className="goto-overlay" onClick={() => setShowEInvoiceSubForm(false)}>
          <div className="goto-modal p-5 max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-4 border-b border-surface-700 pb-2">e-Invoice Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs text-surface-400">Bill to Place</label>
                <input 
                  value={eInvoiceDetails.billToPlace}
                  onChange={e => setEInvoiceDetails(d => ({ ...d, billToPlace: e.target.value }))}
                  className="tally-field-input w-48 border border-surface-700 p-1"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-xs text-surface-400">Ship to Place</label>
                <input 
                  value={eInvoiceDetails.shipToPlace}
                  onChange={e => setEInvoiceDetails(d => ({ ...d, shipToPlace: e.target.value }))}
                  className="tally-field-input w-48 border border-surface-700 p-1"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-xs text-surface-400">Distance (Km)</label>
                <input 
                  value={eInvoiceDetails.distance}
                  onChange={e => setEInvoiceDetails(d => ({ ...d, distance: e.target.value }))}
                  type="number"
                  className="tally-field-input w-48 border border-surface-700 p-1"
                />
              </div>
            </div>
            <div className="mt-5 text-right">
              <button 
                onClick={() => setShowEInvoiceSubForm(false)}
                className="tally-btn-accept text-xs px-4"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── e-Invoice Generation Prompt Modal ── */}
      {showEInvoicePrompt && (
        <div className="goto-overlay items-center justify-center">
          <div className="bg-surface-900 border border-brand-500/30 p-6 rounded-lg shadow-2xl max-w-md w-full text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-white font-bold text-lg mb-2">Generate e-Invoice?</h3>
            <p className="text-surface-400 text-sm mb-6">Do you want to generate e-Invoice for voucher {voucherNo}?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setShowEInvoicePrompt(false); resetForm() }} className="tally-btn-cancel w-24">No (Esc)</button>
              <button onClick={generateEInvoice} className="tally-btn-accept w-24">Yes (Enter)</button>
            </div>
          </div>
        </div>
      )}

      {/* ── e-Invoice Success Modal ── */}
      {generatedEInvoice && (
        <div className="goto-overlay items-center justify-center">
          <div className="bg-surface-900 border border-green-500/50 p-6 rounded-lg shadow-2xl max-w-lg w-full">
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">✅</div>
              <h3 className="text-green-400 font-bold text-xl">e-Invoice Generated Successfully</h3>
            </div>
            
            <div className="space-y-4 bg-black/40 p-4 rounded border border-surface-800">
              <div>
                <div className="text-[10px] text-surface-500 uppercase">IRN</div>
                <div className="text-sm font-mono text-white break-all">{generatedEInvoice.irn}</div>
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-[10px] text-surface-500 uppercase">Ack No.</div>
                  <div className="text-sm font-mono text-white">{generatedEInvoice.ackNo}</div>
                </div>
                <div>
                  <div className="text-[10px] text-surface-500 uppercase">Ack Date</div>
                  <div className="text-sm font-mono text-white">{generatedEInvoice.ackDate}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button onClick={resetForm} className="tally-btn-accept">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
