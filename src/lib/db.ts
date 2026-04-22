/**
 * Database helper — thin wrapper over electronAPI IPC calls.
 * Falls back gracefully when electronAPI is not available (browser mode).
 */

function api() {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI
  }
  return null
}

// ── Generic DB helpers ────────────────────────────────────────

export async function dbGetAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const a = api()
  if (!a) return []
  const result = await a.db.getAll(sql, params)
  if (!result.success) throw new Error(result.error)
  return result.data as T[]
}

export async function dbRun(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
  const a = api()
  if (!a) throw new Error('Electron API not available')
  const result = await a.db.run(sql, params)
  if (!result.success) throw new Error(result.error)
  return result.data
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await dbGetAll<T>(sql, params)
  return rows[0] ?? null
}

// ── UUID generator ────────────────────────────────────────────
export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function nowISO(): string {
  return new Date().toISOString().replace('T', ' ').split('.')[0]
}

// ── Typed DB operations ───────────────────────────────────────

// Ledgers
export async function getLedgers(companyId: string) {
  return dbGetAll(`
    SELECT l.*, ag.name as groupName, ag.nature
    FROM Ledger l
    JOIN AccountGroup ag ON l.accountGroupId = ag.id
    WHERE l.companyId = ? AND l.isActive = 1
    ORDER BY ag.nature, ag.name, l.name
  `, [companyId])
}

export async function getLedgerById(id: string) {
  return dbGet(`
    SELECT l.*, ag.name as groupName, ag.nature
    FROM Ledger l
    JOIN AccountGroup ag ON l.accountGroupId = ag.id
    WHERE l.id = ?
  `, [id])
}

export async function createLedger(data: {
  id: string
  companyId: string
  name: string
  accountGroupId: string
  openingBalance?: number
  balanceType?: 'DEBIT' | 'CREDIT'
  gstin?: string
  panNumber?: string
  address?: string
  phone?: string
  email?: string
  creditLimit?: number
  creditPeriod?: number
  ledgerType?: string
}) {
  return dbRun(`
    INSERT INTO Ledger (id, companyId, name, accountGroupId, openingBalance, currentBalance,
      balanceType, gstin, panNumber, address, phone, email, creditLimit, creditPeriod, ledgerType, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `, [
    data.id, data.companyId, data.name, data.accountGroupId,
    data.openingBalance ?? 0, data.openingBalance ?? 0,
    data.balanceType ?? 'DEBIT',
    data.gstin ?? '', data.panNumber ?? '', data.address ?? '',
    data.phone ?? '', data.email ?? '',
    data.creditLimit ?? 0, data.creditPeriod ?? 0,
    data.ledgerType ?? 'PARTY'
  ])
}

export async function updateLedger(id: string, data: Partial<{
  name: string, accountGroupId: string, openingBalance: number,
  balanceType: string, gstin: string, panNumber: string,
  address: string, phone: string, email: string,
  creditLimit: number, creditPeriod: number
}>) {
  const fields = Object.entries(data).map(([k]) => `${k} = ?`).join(', ')
  return dbRun(`UPDATE Ledger SET ${fields}, updatedAt = datetime('now') WHERE id = ?`,
    [...Object.values(data), id])
}

// Account Groups
export async function getAccountGroups(companyId: string) {
  return dbGetAll(`
    SELECT ag.*, parent.name as parentName
    FROM AccountGroup ag
    LEFT JOIN AccountGroup parent ON ag.parentId = parent.id
    WHERE ag.companyId = ?
    ORDER BY ag.nature, ag.name
  `, [companyId])
}

export async function createAccountGroup(data: {
  id: string, companyId: string, name: string,
  parentId?: string | null, nature: string
}) {
  return dbRun(`
    INSERT INTO AccountGroup (id, companyId, name, parentId, nature, isSystem)
    VALUES (?, ?, ?, ?, ?, 0)
  `, [data.id, data.companyId, data.name, data.parentId ?? null, data.nature])
}

// Vouchers
export async function getVouchers(companyId: string, opts: {
  from?: string; to?: string; type?: string; limit?: number
} = {}) {
  let sql = `
    SELECT v.*, l.name as partyName
    FROM Voucher v
    LEFT JOIN Ledger l ON v.partyLedgerId = l.id
    WHERE v.companyId = ?
  `
  const params: any[] = [companyId]
  if (opts.type) { sql += ' AND v.voucherType = ?'; params.push(opts.type) }
  if (opts.from) { sql += ' AND v.voucherDate >= ?'; params.push(opts.from) }
  if (opts.to)   { sql += ' AND v.voucherDate <= ?'; params.push(opts.to) }
  sql += ' ORDER BY v.voucherDate DESC, v.voucherNumber DESC'
  if (opts.limit) { sql += ` LIMIT ${opts.limit}` }
  return dbGetAll(sql, params)
}

export async function getVoucherById(id: string) {
  const voucher = await dbGet(`SELECT * FROM Voucher WHERE id = ?`, [id])
  if (!voucher) return null
  const items = await dbGetAll(`
    SELECT vi.*, l.name as ledgerName
    FROM VoucherItem vi
    JOIN Ledger l ON vi.ledgerId = l.id
    WHERE vi.voucherId = ?
    ORDER BY vi.sortOrder
  `, [id])
  return { ...voucher, items }
}

export async function getNextVoucherNumber(companyId: string, type: string): Promise<string> {
  const prefix: Record<string, string> = {
    SALES: 'S', PURCHASE: 'P', RECEIPT: 'R', PAYMENT: 'PY',
    CONTRA: 'C', JOURNAL: 'J', CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN'
  }
  const res = await dbGet<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM Voucher WHERE companyId = ? AND voucherType = ?`,
    [companyId, type]
  )
  const n = (res?.cnt ?? 0) + 1
  return `${prefix[type] ?? 'V'}/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${String(n).padStart(4, '0')}`
}

export async function saveVoucher(voucher: {
  id: string, companyId: string, voucherNumber: string, voucherDate: string,
  voucherType: string, partyLedgerId?: string | null, narration?: string,
  totalAmount: number, isInterState?: number, placeOfSupply?: string,
  referenceNo?: string, status?: string
}, items: {
  id: string, ledgerId: string, amount: number, isDebit: number,
  description?: string, hsnCode?: string, gstRate?: number,
  cgst?: number, sgst?: number, igst?: number, cess?: number,
  taxableAmount?: number, quantity?: number, unit?: string,
  rate?: number, discount?: number, sortOrder?: number
}[]) {
  await dbRun(`
    INSERT INTO Voucher (id, companyId, voucherNumber, voucherDate, voucherType,
      partyLedgerId, narration, totalAmount, isInterState, placeOfSupply,
      referenceNo, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [
    voucher.id, voucher.companyId, voucher.voucherNumber, voucher.voucherDate,
    voucher.voucherType, voucher.partyLedgerId ?? null, voucher.narration ?? '',
    voucher.totalAmount, voucher.isInterState ?? 0, voucher.placeOfSupply ?? '',
    voucher.referenceNo ?? '', voucher.status ?? 'CONFIRMED'
  ])

  for (const item of items) {
    await dbRun(`
      INSERT INTO VoucherItem (id, voucherId, ledgerId, amount, isDebit, description,
        hsnCode, gstRate, cgst, sgst, igst, cess, taxableAmount, quantity, unit,
        rate, discount, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      item.id, voucher.id, item.ledgerId, item.amount, item.isDebit,
      item.description ?? '', item.hsnCode ?? '', item.gstRate ?? 0,
      item.cgst ?? 0, item.sgst ?? 0, item.igst ?? 0, item.cess ?? 0,
      item.taxableAmount ?? item.amount, item.quantity ?? 0,
      item.unit ?? 'PCS', item.rate ?? 0, item.discount ?? 0,
      item.sortOrder ?? 0
    ])
  }

  // Update ledger balances (currentBalance)
  for (const item of items) {
    if (item.isDebit) {
      await dbRun(`UPDATE Ledger SET currentBalance = currentBalance + ?, updatedAt=datetime('now') WHERE id=?`,
        [item.amount, item.ledgerId])
    } else {
      await dbRun(`UPDATE Ledger SET currentBalance = currentBalance - ?, updatedAt=datetime('now') WHERE id=?`,
        [item.amount, item.ledgerId])
    }
  }
}

export async function deleteVoucher(id: string) {
  // Reverse balance updates
  const items = await dbGetAll(`SELECT * FROM VoucherItem WHERE voucherId = ?`, [id])
  for (const item of items) {
    if (item.isDebit) {
      await dbRun(`UPDATE Ledger SET currentBalance = currentBalance - ? WHERE id=?`, [item.amount, item.ledgerId])
    } else {
      await dbRun(`UPDATE Ledger SET currentBalance = currentBalance + ? WHERE id=?`, [item.amount, item.ledgerId])
    }
  }
  await dbRun(`DELETE FROM VoucherItem WHERE voucherId = ?`, [id])
  await dbRun(`DELETE FROM Voucher WHERE id = ?`, [id])
}
