const Database = require('better-sqlite3')
const path = require('node:path')
const { app } = require('electron')
const fs = require('node:fs')

let db: Database.Database | null = null

const DB_PATH = path.join(app.getPath('userData'), 'vaahan-books.db')

export function initDatabase(): Database.Database {
  // Ensure directory exists
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('cache_size = -64000') // 64MB cache

  // Run migrations
  createTables(db)
  seedDefaultData(db)

  console.log(`[DB] Database initialized at: ${DB_PATH}`)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function getDatabasePath(): string {
  return DB_PATH
}

function createTables(db: Database.Database) {
  db.exec(`
    -- ═══════════════════════════════════════════════════════
    -- COMPANY
    -- ═══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS Company (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tradeName TEXT DEFAULT '',
      gstin TEXT DEFAULT '',
      panNumber TEXT DEFAULT '',
      tanNumber TEXT DEFAULT '',
      address TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT '',
      stateCode TEXT DEFAULT '',
      pincode TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      website TEXT DEFAULT '',
      logo BLOB,
      financialYearStart INTEGER DEFAULT 4,
      bookStartDate TEXT,
      isDefault INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- ═══════════════════════════════════════════════════════
    -- ACCOUNT GROUP (Chart of Accounts hierarchy)
    -- ═══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS AccountGroup (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      name TEXT NOT NULL,
      parentId TEXT,
      nature TEXT CHECK(nature IN ('ASSETS','LIABILITIES','INCOME','EXPENSE')) NOT NULL,
      isSystem INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (companyId) REFERENCES Company(id),
      FOREIGN KEY (parentId) REFERENCES AccountGroup(id)
    );

    -- ═══════════════════════════════════════════════════════
    -- LEDGER
    -- ═══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS Ledger (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      name TEXT NOT NULL,
      accountGroupId TEXT NOT NULL,
      openingBalance REAL DEFAULT 0,
      currentBalance REAL DEFAULT 0,
      balanceType TEXT CHECK(balanceType IN ('DEBIT','CREDIT')) DEFAULT 'DEBIT',
      gstin TEXT DEFAULT '',
      panNumber TEXT DEFAULT '',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      creditLimit REAL DEFAULT 0,
      creditPeriod INTEGER DEFAULT 0,
      ledgerType TEXT CHECK(ledgerType IN ('PARTY','BANK','CASH','TAX','EXPENSE','INCOME','ASSET','LIABILITY')) DEFAULT 'PARTY',
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (companyId) REFERENCES Company(id),
      FOREIGN KEY (accountGroupId) REFERENCES AccountGroup(id)
    );

    -- ═══════════════════════════════════════════════════════
    -- VOUCHER (Master transaction)
    -- ═══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS Voucher (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      voucherNumber TEXT NOT NULL,
      voucherDate TEXT NOT NULL,
      voucherType TEXT CHECK(voucherType IN (
        'SALES','PURCHASE','RECEIPT','PAYMENT','CONTRA',
        'JOURNAL','CREDIT_NOTE','DEBIT_NOTE','SALES_RETURN','PURCHASE_RETURN'
      )) NOT NULL,
      partyLedgerId TEXT,
      narration TEXT DEFAULT '',
      totalAmount REAL DEFAULT 0,
      status TEXT CHECK(status IN ('DRAFT','CONFIRMED','CANCELLED')) DEFAULT 'DRAFT',
      referenceNo TEXT DEFAULT '',
      placeOfSupply TEXT DEFAULT '',
      isInterState INTEGER DEFAULT 0,
      reverseCharge INTEGER DEFAULT 0,
      gstTreatment TEXT DEFAULT 'REGISTERED',
      sourceSystem TEXT DEFAULT NULL,
      sourceId TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (companyId) REFERENCES Company(id),
      FOREIGN KEY (partyLedgerId) REFERENCES Ledger(id)
    );

    -- ═══════════════════════════════════════════════════════
    -- VOUCHER ITEM (Line items with double-entry)
    -- ═══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS VoucherItem (
      id TEXT PRIMARY KEY,
      voucherId TEXT NOT NULL,
      ledgerId TEXT NOT NULL,
      amount REAL DEFAULT 0,
      isDebit INTEGER DEFAULT 1,
      description TEXT DEFAULT '',
      hsnCode TEXT DEFAULT '',
      sacCode TEXT DEFAULT '',
      gstRate REAL DEFAULT 0,
      cgst REAL DEFAULT 0,
      sgst REAL DEFAULT 0,
      igst REAL DEFAULT 0,
      cess REAL DEFAULT 0,
      taxableAmount REAL DEFAULT 0,
      quantity REAL DEFAULT 0,
      unit TEXT DEFAULT 'PCS',
      rate REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      discountType TEXT CHECK(discountType IN ('PERCENTAGE','FLAT')) DEFAULT 'FLAT',
      sortOrder INTEGER DEFAULT 0,
      FOREIGN KEY (voucherId) REFERENCES Voucher(id) ON DELETE CASCADE,
      FOREIGN KEY (ledgerId) REFERENCES Ledger(id)
    );

    -- ═══════════════════════════════════════════════════════
    -- PRODUCT (Inventory items)
    -- ═══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS Product (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      sku TEXT DEFAULT '',
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '',
      unit TEXT DEFAULT 'PCS',
      hsnCode TEXT DEFAULT '',
      sacCode TEXT DEFAULT '',
      purchaseRate REAL DEFAULT 0,
      sellingRate REAL DEFAULT 0,
      mrp REAL DEFAULT 0,
      gstRate REAL DEFAULT 0,
      cessRate REAL DEFAULT 0,
      stockQty REAL DEFAULT 0,
      minStockLevel REAL DEFAULT 0,
      barcodeNo TEXT DEFAULT '',
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (companyId) REFERENCES Company(id)
    );

    -- ═══════════════════════════════════════════════════════
    -- SYNC CONFLICT LOG
    -- ═══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS SyncConflict (
      id TEXT PRIMARY KEY,
      tableName TEXT NOT NULL,
      recordId TEXT NOT NULL,
      localData TEXT,
      cloudData TEXT,
      conflictType TEXT CHECK(conflictType IN ('EDIT','DELETE')) DEFAULT 'EDIT',
      resolution TEXT CHECK(resolution IN ('PENDING','LOCAL','CLOUD','MANUAL')) DEFAULT 'PENDING',
      resolvedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    -- ═══════════════════════════════════════════════════════
    -- BACKUP LOG
    -- ═══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS BackupLog (
      id TEXT PRIMARY KEY,
      backupPath TEXT NOT NULL,
      sizeBytes INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('SUCCESS','FAILED')) DEFAULT 'SUCCESS',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    -- ═══════════════════════════════════════════════════════
    -- INDEXES for performance
    -- ═══════════════════════════════════════════════════════
    CREATE INDEX IF NOT EXISTS idx_ledger_company ON Ledger(companyId);
    CREATE INDEX IF NOT EXISTS idx_ledger_group ON Ledger(accountGroupId);
    CREATE INDEX IF NOT EXISTS idx_voucher_company ON Voucher(companyId);
    CREATE INDEX IF NOT EXISTS idx_voucher_date ON Voucher(voucherDate);
    CREATE INDEX IF NOT EXISTS idx_voucher_type ON Voucher(voucherType);
    CREATE INDEX IF NOT EXISTS idx_voucher_party ON Voucher(partyLedgerId);
    CREATE INDEX IF NOT EXISTS idx_voucheritem_voucher ON VoucherItem(voucherId);
    CREATE INDEX IF NOT EXISTS idx_product_company ON Product(companyId);
    CREATE INDEX IF NOT EXISTS idx_product_hsn ON Product(hsnCode);
  `)
}

function seedDefaultData(db: Database.Database) {
  // Check if default account groups already exist
  const existing = db.prepare('SELECT COUNT(*) as count FROM AccountGroup').get() as any
  if (existing.count > 0) return

  // We seed when a company is created, not here
  console.log('[DB] Tables created. Account groups will be seeded on company creation.')
}

// ── Seed Chart of Accounts for a company ──────────────────
export function seedChartOfAccounts(companyId: string) {
  const db = getDatabase()

  const insert = db.prepare(`
    INSERT INTO AccountGroup (id, companyId, name, parentId, nature, isSystem)
    VALUES (?, ?, ?, ?, ?, 1)
  `)

  const groups = db.transaction(() => {
    // ── Primary Groups (Tally-style) ──
    insert.run(`${companyId}_cap`, companyId, 'Capital Account', null, 'LIABILITIES')
    insert.run(`${companyId}_loan`, companyId, 'Loans (Liability)', null, 'LIABILITIES')
    insert.run(`${companyId}_cl`, companyId, 'Current Liabilities', null, 'LIABILITIES')
    insert.run(`${companyId}_fa`, companyId, 'Fixed Assets', null, 'ASSETS')
    insert.run(`${companyId}_inv`, companyId, 'Investments', null, 'ASSETS')
    insert.run(`${companyId}_ca`, companyId, 'Current Assets', null, 'ASSETS')
    insert.run(`${companyId}_di`, companyId, 'Direct Income', null, 'INCOME')
    insert.run(`${companyId}_ii`, companyId, 'Indirect Income', null, 'INCOME')
    insert.run(`${companyId}_de`, companyId, 'Direct Expenses', null, 'EXPENSE')
    insert.run(`${companyId}_ie`, companyId, 'Indirect Expenses', null, 'EXPENSE')
    insert.run(`${companyId}_pur`, companyId, 'Purchase Accounts', null, 'EXPENSE')
    insert.run(`${companyId}_sal`, companyId, 'Sales Accounts', null, 'INCOME')

    // ── Sub-Groups ──
    // Under Current Assets
    insert.run(`${companyId}_ca_cash`, companyId, 'Cash-in-Hand', `${companyId}_ca`, 'ASSETS')
    insert.run(`${companyId}_ca_bank`, companyId, 'Bank Accounts', `${companyId}_ca`, 'ASSETS')
    insert.run(`${companyId}_ca_sd`, companyId, 'Sundry Debtors', `${companyId}_ca`, 'ASSETS')
    insert.run(`${companyId}_ca_stock`, companyId, 'Stock-in-Hand', `${companyId}_ca`, 'ASSETS')
    insert.run(`${companyId}_ca_loan`, companyId, 'Loans & Advances (Asset)', `${companyId}_ca`, 'ASSETS')

    // Under Current Liabilities
    insert.run(`${companyId}_cl_sc`, companyId, 'Sundry Creditors', `${companyId}_cl`, 'LIABILITIES')
    insert.run(`${companyId}_cl_duties`, companyId, 'Duties & Taxes', `${companyId}_cl`, 'LIABILITIES')
    insert.run(`${companyId}_cl_prov`, companyId, 'Provisions', `${companyId}_cl`, 'LIABILITIES')

    // ── Default Ledgers ──
    const insertLedger = db.prepare(`
      INSERT INTO Ledger (id, companyId, name, accountGroupId, openingBalance, currentBalance, balanceType, ledgerType, isActive)
      VALUES (?, ?, ?, ?, 0, 0, ?, ?, 1)
    `)

    // Cash
    insertLedger.run(`${companyId}_cash`, companyId, 'Cash', `${companyId}_ca_cash`, 'DEBIT', 'CASH')

    // Tax Ledgers (GST)
    insertLedger.run(`${companyId}_cgst_pay`, companyId, 'CGST Payable', `${companyId}_cl_duties`, 'CREDIT', 'TAX')
    insertLedger.run(`${companyId}_sgst_pay`, companyId, 'SGST Payable', `${companyId}_cl_duties`, 'CREDIT', 'TAX')
    insertLedger.run(`${companyId}_igst_pay`, companyId, 'IGST Payable', `${companyId}_cl_duties`, 'CREDIT', 'TAX')
    insertLedger.run(`${companyId}_cgst_rec`, companyId, 'CGST Receivable', `${companyId}_ca_loan`, 'DEBIT', 'TAX')
    insertLedger.run(`${companyId}_sgst_rec`, companyId, 'SGST Receivable', `${companyId}_ca_loan`, 'DEBIT', 'TAX')
    insertLedger.run(`${companyId}_igst_rec`, companyId, 'IGST Receivable', `${companyId}_ca_loan`, 'DEBIT', 'TAX')
    insertLedger.run(`${companyId}_tds_pay`, companyId, 'TDS Payable', `${companyId}_cl_duties`, 'CREDIT', 'TAX')

    // Default Sales & Purchase
    insertLedger.run(`${companyId}_sales`, companyId, 'Sales A/C', `${companyId}_sal`, 'CREDIT', 'INCOME')
    insertLedger.run(`${companyId}_purchase`, companyId, 'Purchase A/C', `${companyId}_pur`, 'DEBIT', 'EXPENSE')

    // Common Expense Ledgers
    insertLedger.run(`${companyId}_rent`, companyId, 'Rent', `${companyId}_ie`, 'DEBIT', 'EXPENSE')
    insertLedger.run(`${companyId}_salary`, companyId, 'Salary', `${companyId}_ie`, 'DEBIT', 'EXPENSE')
    insertLedger.run(`${companyId}_electricity`, companyId, 'Electricity', `${companyId}_ie`, 'DEBIT', 'EXPENSE')
    insertLedger.run(`${companyId}_telephone`, companyId, 'Telephone', `${companyId}_ie`, 'DEBIT', 'EXPENSE')
    insertLedger.run(`${companyId}_misc`, companyId, 'Miscellaneous Expenses', `${companyId}_ie`, 'DEBIT', 'EXPENSE')

    // Discount
    insertLedger.run(`${companyId}_disc_given`, companyId, 'Discount Allowed', `${companyId}_ie`, 'DEBIT', 'EXPENSE')
    insertLedger.run(`${companyId}_disc_recv`, companyId, 'Discount Received', `${companyId}_ii`, 'CREDIT', 'INCOME')
  })

  groups()
  console.log(`[DB] Chart of Accounts seeded for company: ${companyId}`)
}
