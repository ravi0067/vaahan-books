import { useState, useRef, useEffect } from 'react'
import { useNavigationStore } from '../hooks/useNavigationStore'

export default function PeriodSelector() {
  const { showPeriodSelector, setShowPeriodSelector, periodFrom, periodTo, setPeriod } = useNavigationStore()
  const [fromDate, setFromDate] = useState(periodFrom)
  const [toDate, setToDate] = useState(periodTo)
  const fromRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showPeriodSelector) {
      setFromDate(periodFrom)
      setToDate(periodTo)
      setTimeout(() => fromRef.current?.focus(), 50)
    }
  }, [showPeriodSelector, periodFrom, periodTo])

  if (!showPeriodSelector) return null

  const handleApply = () => {
    setPeriod(fromDate, toDate)
    setShowPeriodSelector(false)
  }

  const quickPeriods = [
    { label: 'This Month', from: getMonthStart(0), to: getMonthEnd(0) },
    { label: 'Last Month', from: getMonthStart(-1), to: getMonthEnd(-1) },
    { label: 'This Quarter', from: getQuarterStart(0), to: getQuarterEnd(0) },
    { label: 'Last Quarter', from: getQuarterStart(-1), to: getQuarterEnd(-1) },
    { label: 'This FY', from: getFYStart(0), to: getFYEnd(0) },
    { label: 'Last FY', from: getFYStart(-1), to: getFYEnd(-1) },
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowPeriodSelector(false)
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleApply()
    }
  }

  return (
    <div className="goto-overlay" onClick={() => setShowPeriodSelector(false)}>
      <div className="period-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="period-header">
          <span className="text-sm font-semibold text-white">📅 Change Period</span>
          <kbd className="goto-kbd">F2</kbd>
        </div>

        {/* Quick Periods */}
        <div className="period-quick-grid">
          {quickPeriods.map(p => (
            <button
              key={p.label}
              onClick={() => { setFromDate(p.from); setToDate(p.to) }}
              className={`period-quick-btn ${fromDate === p.from && toDate === p.to ? 'period-quick-btn-active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="period-date-row">
          <div className="period-date-group">
            <label className="text-xs text-surface-400 mb-1 block">From</label>
            <input
              ref={fromRef}
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="period-date-input"
            />
          </div>
          <div className="period-date-group">
            <label className="text-xs text-surface-400 mb-1 block">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="period-date-input"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="period-actions">
          <button onClick={() => setShowPeriodSelector(false)} className="period-btn-cancel">
            Cancel <span className="text-surface-600 text-[10px] ml-1">Esc</span>
          </button>
          <button onClick={handleApply} className="period-btn-apply">
            Apply <span className="text-brand-300 text-[10px] ml-1">Ctrl+Enter</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Date Helpers ─────────────────────────────
function getMonthStart(offset: number) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset, 1)
  return d.toISOString().split('T')[0]
}

function getMonthEnd(offset: number) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset + 1, 0)
  return d.toISOString().split('T')[0]
}

function getQuarterStart(offset: number) {
  const d = new Date()
  const quarter = Math.floor(d.getMonth() / 3) + offset
  const startMonth = quarter * 3
  d.setMonth(startMonth, 1)
  return d.toISOString().split('T')[0]
}

function getQuarterEnd(offset: number) {
  const d = new Date()
  const quarter = Math.floor(d.getMonth() / 3) + offset
  const endMonth = quarter * 3 + 3
  d.setMonth(endMonth, 0)
  return d.toISOString().split('T')[0]
}

function getFYStart(offset: number) {
  const now = new Date()
  const year = (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1) + offset
  return `${year}-04-01`
}

function getFYEnd(offset: number) {
  const now = new Date()
  const year = (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1) + offset + 1
  return `${year}-03-31`
}
