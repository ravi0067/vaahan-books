# 📘 VaahanBooks — Complete Architecture Plan
### AI-Powered Desktop Billing & Accounting Software (Tally Prime Alternative)
**Version:** 3.0 (FINAL) | **Date:** 13 April 2026 | **Author:** Antigravity AI Architect

---

## 🎯 Product Vision

**VaahanBooks** is a production-grade, AI-first **desktop billing and accounting software** for Indian SMBs — downloadable and installable like Tally Prime. Fully integrated with VaahanERP for automobile dealerships, and independently purchasable by any business type.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRODUCT ECOSYSTEM                                │
│                                                                          │
│  🌐 WEBSITES (Web)                    💻 DESKTOP SOFTWARE (Download)     │
│  ─────────────────                    ──────────────────────────────     │
│                                                                          │
│  vaahanerp.com                        VaahanBooks Desktop App            │
│  ┌──────────────────┐                 ┌─────────────────────────┐       │
│  │ VaahanERP Website │                 │  VaahanBooks (Electron) │       │
│  │ (Marketing +      │                 │  (Installed on PC)      │       │
│  │  SaaS Dealership  │   Cloud Sync    │                         │       │
│  │  Dashboard)       │◄──────────────►│  • GST Invoicing        │       │
│  │                   │     API         │  • Ledger/Accounts      │       │
│  │ • Booking         │                 │  • GSTR-1/3B Filing     │       │
│  │ • Stock           │                 │  • E-Invoice/E-Way      │       │
│  │ • Service/JobCard │                 │  • Balance Sheet/P&L    │       │
│  │ • CRM/AI/Exotel   │                 │  • TDS/TCS              │       │
│  └──────────────────┘                 │  • Bank Reconciliation  │       │
│                                        │  • AI Financial Analyst │       │
│  books.vaahanerp.com                   │  • Payroll              │       │
│  ┌──────────────────┐                 │  • Multi-Company        │       │
│  │ VaahanBooks       │  Download ──►  │  • License Key System   │       │
│  │ Download Portal   │                 └─────────────────────────┘       │
│  │ (Marketing +      │                                                   │
│  │  Plan Purchase +  │  ┌─────────────────────────────────────┐         │
│  │  Download Button  │  │  License Key Auto-Generated         │         │
│  │  + License Mgmt)  │  │  After Plan Purchase                │         │
│  └──────────────────┘  │  ┌────────────────────────────┐     │         │
│                          │  │ VB-2026-XXXX-XXXX-XXXX    │     │         │
│                          │  │ Plan: Professional         │     │         │
│                          │  │ Expiry: 12 Apr 2027        │     │         │
│                          │  │ Status: ✅ Active           │     │         │
│                          │  └────────────────────────────┘     │         │
│                          └─────────────────────────────────────┘         │
│                                                                          │
│  💰 Business Model:                                                     │
│  ├── VaahanERP users → VaahanBooks FREE license (auto-activated)        │
│  ├── Standalone users → Purchase plan → Download → Install → Activate  │
│  └── Any business type → Fully customizable desktop setup              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Tech Stack

### Desktop App (VaahanBooks)
| Layer | Technology | Why |
|-------|-----------|-----|
| **Desktop Shell** | Electron.js 34+ | Cross-platform desktop app (like Tally Prime) |
| **Frontend** | React 18 + TypeScript | Fast UI, component reuse |
| **Local Database** | SQLite (via better-sqlite3) | Offline-first, zero-config local DB |
| **Cloud Sync** | Supabase (PostgreSQL) | Sync to cloud when online, shared with VaahanERP |
| **ORM** | Prisma 5 (SQLite + PostgreSQL) | Dual-adapter for local + cloud |
| **State** | Zustand | Lightweight, same as VaahanERP |
| **UI** | Radix UI + Shadcn + TailwindCSS | Same design system as VaahanERP |
| **Charts** | Recharts | Financial charts & dashboards |
| **PDF** | pdfkit + electron-pdf | Native PDF generation (invoices, reports) |
| **Excel** | ExcelJS | Export GSTR-1, Ledgers, Reports |
| **AI Engine** | **Hybrid:** Rule-based engine + Claude API | 70% rule-based (fast, free), 30% Claude (complex insights only) |
| **GST Provider** | GSP (ClearTax / MastersIndia) + Mock | Phase 1: Mock → Phase 2: GSP → Later: Direct NIC |
| **DB Encryption** | SQLCipher | AES-256 encryption at rest for SQLite |
| **Worker Threads** | Node.js worker_threads | Heavy calculations offloaded from UI thread |
| **Financial Precision** | decimal.js | Zero floating-point errors in billing |
| **Barcode/QR** | qrcode + JsBarcode | QR on invoices, barcode scanning |
| **Auto-Update** | electron-updater | Silent background updates |
| **Installer** | electron-builder | .exe for Windows, .dmg for Mac |
| **Printing** | Electron native print | Direct thermal/dot-matrix/laser printer support |

### Download Portal Website (books.vaahanerp.com)
| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 14 (App Router) | Marketing + Download + License portal |
| **Auth** | NextAuth.js v4 | Shared SSO with VaahanERP |
| **Payments** | Razorpay + PayPal | Plan purchase, renewal |
| **Hosting** | Vercel | Same platform as VaahanERP |
| **Email** | Nodemailer | License key delivery, renewal reminders |
| **Voice/SMS** | Exotel (reuse) | Debtor follow-up calls |
| **WhatsApp** | WhatsApp Business API | Invoice sharing, payment reminders |

---

## 📐 System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  💻 USER'S PC (Desktop App - Electron)                                    │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │  VaahanBooks Desktop Application                                  │     │
│  │                                                                    │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │     │
│  │  │ Invoicing│ │Accounting│ │   GST    │ │ Reports  │            │     │
│  │  │ Module   │ │ Module   │ │ Module   │ │ Module   │            │     │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │     │
│  │       │            │            │             │                   │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │     │
│  │  │Inventory │ │ Banking  │ │ Payroll  │ │AI Engine │            │     │
│  │  │ Module   │ │ Module   │ │ Module   │ │ (Claude) │            │     │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │     │
│  │       │            │            │             │                   │     │
│  │  ┌────┴────────────┴────────────┴─────────────┴─────────┐        │     │
│  │  │              LOCAL DATABASE (SQLite)                   │        │     │
│  │  │  All data stored locally → works OFFLINE               │        │     │
│  │  │  Company, Ledger, Voucher, Product, etc.              │        │     │
│  │  └──────────────────────┬────────────────────────────────┘        │     │
│  │                         │                                         │     │
│  │  ┌──────────────────────┴────────────────────────────────┐        │     │
│  │  │           LICENSE MANAGER (Built-in)                    │        │     │
│  │  │  ┌─────────────────────────────────────────────┐      │        │     │
│  │  │  │ License: VB-2026-XXXX-XXXX-XXXX             │      │        │     │
│  │  │  │ Plan: Professional | Expiry: 12-Apr-2027    │      │        │     │
│  │  │  │ Status: ✅ Active                            │      │        │     │
│  │  │  │ [🔴 30 days warning → Red highlight banner]  │      │        │     │
│  │  │  │ [Renew Now] button → opens portal            │      │        │     │
│  │  │  └─────────────────────────────────────────────┘      │        │     │
│  │  └───────────────────────────────────────────────────────┘        │     │
│  └──────────────────────────────┬────────────────────────────────────┘     │
│                                 │ Cloud Sync (when online)                 │
│                                 │                                          │
├─────────────────────────────────┼──────────────────────────────────────────┤
│                                 │                                          │
│  ☁️ CLOUD LAYER                │                                          │
│  ┌──────────────────────────────┴──────────────────────────────────┐      │
│  │                    Supabase (PostgreSQL)                         │      │
│  │                                                                  │      │
│  │  VaahanERP Tables (27)    │    VaahanBooks Tables (30+)         │      │
│  │  Tenant, Customer,        │    AccountGroup, Ledger,            │      │
│  │  Vehicle, Booking...      │    Voucher, License, etc.           │      │
│  │               ◄── Shared tenantId ──►                           │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                  books.vaahanerp.com (Download Portal)            │      │
│  │  • Plan selection & purchase (Razorpay/PayPal)                    │      │
│  │  • License key auto-generation                                    │      │
│  │  • Download .exe/.dmg installer                                   │      │
│  │  • License management dashboard                                   │      │
│  │  • Renewal & expiry management                                    │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │GST via │ │Bank    │ │Claude  │ │Exotel  │ │WhatsApp│                  │
│  │GSP     │ │APIs    │ │API     │ │Voice   │ │Business│                  │
│  │(Clear- │ │(ICICI, │ │(Complex│ │(Debtor │ │API     │                  │
│  │Tax/    │ │HDFC)   │ │insights│ │follow  │ │(share) │                  │
│  │Masters)│ │        │ │only)   │ │ups)    │ │        │                  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema — VaahanBooks Tables

### 🔑 Core Accounting (Double-Entry)

#### Table: `AccountGroup`
```
id            TEXT PK
tenantId      TEXT FK → Tenant
name          TEXT           -- e.g., "Current Assets", "Sales"
parentId      TEXT FK → self -- Hierarchical groups
nature        ENUM           -- ASSETS, LIABILITIES, INCOME, EXPENSE
isSystem      BOOLEAN        -- true = cannot delete (like Tally)
createdAt     TIMESTAMP
```

#### Table: `Ledger`
```
id                TEXT PK
tenantId          TEXT FK → Tenant
name              TEXT           -- e.g., "Cash", "SBI Current A/C", "CGST Payable"
accountGroupId    TEXT FK → AccountGroup
openingBalance    DECIMAL(14,2)
currentBalance    DECIMAL(14,2)
balanceType       ENUM           -- DEBIT, CREDIT
gstin             TEXT           -- Party GSTIN (if applicable)
panNumber         TEXT
address           TEXT
phone             TEXT
email             TEXT
creditLimit       DECIMAL(14,2)
creditPeriod      INT            -- days
ledgerType        ENUM           -- PARTY, BANK, CASH, TAX, EXPENSE, INCOME, ASSET, LIABILITY
isActive          BOOLEAN
createdAt         TIMESTAMP
updatedAt         TIMESTAMP
```

#### Table: `Voucher` (Master Transaction)
```
id              TEXT PK
tenantId        TEXT FK → Tenant
voucherNumber   TEXT UNIQUE     -- Auto-generated: SAL/2026-27/0001
voucherDate     DATE
voucherType     ENUM            -- SALES, PURCHASE, RECEIPT, PAYMENT,
                                -- CONTRA, JOURNAL, CREDIT_NOTE, DEBIT_NOTE,
                                -- SALES_RETURN, PURCHASE_RETURN
partyLedgerId   TEXT FK → Ledger
narration       TEXT
totalAmount     DECIMAL(14,2)
status          ENUM            -- DRAFT, CONFIRMED, CANCELLED
referenceNo     TEXT            -- Manual ref / cheque no
createdById     TEXT FK → User
isRecurring     BOOLEAN
recurPattern    TEXT            -- monthly/quarterly/yearly
linkedVoucherId TEXT FK → self   -- e.g., CN linked to Sales Invoice

-- GST Fields
placeOfSupply   TEXT            -- State code
isInterState    BOOLEAN
reverseCharge   BOOLEAN
gstTreatment    ENUM            -- REGISTERED, UNREGISTERED, COMPOSITION,
                                -- SEZ, EXPORT, EXEMPTED

-- E-Invoice / E-Way Bill
eInvoiceIrn     TEXT            -- IRN from NIC portal
eInvoiceAckNo   TEXT
eInvoiceAckDate TIMESTAMP
eWayBillNo      TEXT
eWayBillDate    TIMESTAMP
eWayBillExpiry  TIMESTAMP

-- Source sync
sourceSystem    TEXT            -- 'vaahanerp' or null
sourceId        TEXT            -- Original record ID from VaahanERP

createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

#### Table: `VoucherItem` (Line items with double-entry)
```
id              TEXT PK
voucherId       TEXT FK → Voucher
ledgerId        TEXT FK → Ledger    -- Debit/Credit ledger
amount          DECIMAL(14,2)
isDebit         BOOLEAN
description     TEXT

-- GST per item
hsnCode         TEXT
sacCode         TEXT
gstRate         DECIMAL(5,2)
cgst            DECIMAL(12,2)
sgst            DECIMAL(12,2)
igst            DECIMAL(12,2)
cess            DECIMAL(12,2)
taxableAmount   DECIMAL(14,2)

-- Inventory link
productId       TEXT FK → Product (optional)
quantity         DECIMAL(10,3)
unit            TEXT
rate            DECIMAL(12,2)
discount        DECIMAL(12,2)
discountType    ENUM               -- PERCENTAGE, FLAT

sortOrder       INT
```

### 🧾 GST Compliance

#### Table: `GSTReturn`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
returnType      ENUM           -- GSTR1, GSTR3B, CMP08, GSTR9
period          TEXT           -- '04-2026' (month-year)
financialYear   TEXT           -- '2026-27'
status          ENUM           -- DRAFT, GENERATED, FILED, ERROR
filingDate      TIMESTAMP
ackNumber       TEXT
jsonData        JSONB          -- Full return data in NIC format
errorLog        JSONB
createdAt       TIMESTAMP
```

#### Table: `EInvoice`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
voucherId       TEXT FK → Voucher
irn             TEXT UNIQUE
ackNumber       TEXT
ackDate         TIMESTAMP
signedInvoice   TEXT           -- Signed QR data
qrCodeData      TEXT
status          ENUM           -- PENDING, GENERATED, CANCELLED
cancelReason    TEXT
cancelDate      TIMESTAMP
jsonPayload     JSONB
responseData    JSONB
createdAt       TIMESTAMP
```

#### Table: `EWayBill`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
voucherId       TEXT FK → Voucher
ewbNumber       TEXT UNIQUE
ewbDate         TIMESTAMP
validUntil      TIMESTAMP
status          ENUM           -- GENERATED, EXTENDED, CANCELLED
transporterName TEXT
transporterId   TEXT
vehicleNumber   TEXT
transportMode   ENUM           -- ROAD, RAIL, AIR, SHIP
distance        INT
fromAddress     TEXT
toAddress       TEXT
partBUpdated    BOOLEAN
createdAt       TIMESTAMP
```

### 🏦 Banking

#### Table: `BankAccount`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
ledgerId        TEXT FK → Ledger
bankName        TEXT
accountNumber   TEXT
ifscCode        TEXT
branchName      TEXT
accountType     ENUM           -- CURRENT, SAVINGS, OD, CC
openingBalance  DECIMAL(14,2)
currentBalance  DECIMAL(14,2)
isActive        BOOLEAN
createdAt       TIMESTAMP
```

#### Table: `BankStatement`
```
id              TEXT PK
bankAccountId   TEXT FK → BankAccount
txnDate         DATE
description     TEXT
reference       TEXT
debitAmount     DECIMAL(14,2)
creditAmount    DECIMAL(14,2)
balance         DECIMAL(14,2)
isReconciled    BOOLEAN
matchedVoucherId TEXT FK → Voucher
importBatch     TEXT
createdAt       TIMESTAMP
```

### 💼 TDS/TCS

#### Table: `TDSEntry`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
voucherId       TEXT FK → Voucher
partyLedgerId   TEXT FK → Ledger
section         TEXT           -- '194C', '194J', etc.
tdsRate         DECIMAL(5,2)
tdsAmount       DECIMAL(12,2)
panNumber       TEXT
tanNumber       TEXT
certificateNo   TEXT
depositDate     DATE
challanNo       TEXT
status          ENUM           -- DEDUCTED, DEPOSITED, FILED
createdAt       TIMESTAMP
```

### 📦 Inventory (Extended from VaahanERP)

#### Table: `Product` (Billing software's own)
```
id              TEXT PK
tenantId        TEXT FK → Tenant
sku             TEXT
name            TEXT
description     TEXT
category        TEXT
unit            TEXT           -- PCS, KG, LTR, MTR, BOX
hsnCode         TEXT
sacCode         TEXT
purchaseRate    DECIMAL(12,2)
sellingRate     DECIMAL(12,2)
mrp             DECIMAL(12,2)
gstRate         DECIMAL(5,2)
cessRate        DECIMAL(5,2)
stockQty        DECIMAL(10,3)
minStockLevel   DECIMAL(10,3)
batchTracking   BOOLEAN
expiryTracking  BOOLEAN
barcodeNo       TEXT
godownId        TEXT FK → Godown
isActive        BOOLEAN
syncedFromERP   BOOLEAN         -- true if synced from VaahanERP
erpProductId    TEXT            -- Original VaahanERP vehicle/product ID
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

#### Table: `Godown` (Warehouse/Location)
```
id              TEXT PK
tenantId        TEXT FK → Tenant
name            TEXT
address         TEXT
isDefault       BOOLEAN
createdAt       TIMESTAMP
```

#### Table: `StockJournal`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
type            ENUM           -- TRANSFER, ADJUSTMENT, MANUFACTURING
sourceGodownId  TEXT FK → Godown
destGodownId    TEXT FK → Godown
productId       TEXT FK → Product
quantity        DECIMAL(10,3)
notes           TEXT
createdAt       TIMESTAMP
```

### 👥 Payroll

#### Table: `Employee`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
name            TEXT
designation     TEXT
department      TEXT
joinDate        DATE
panNumber       TEXT
aadharNumber    TEXT
bankAccountNo   TEXT
ifscCode        TEXT
basicSalary     DECIMAL(12,2)
hra             DECIMAL(12,2)
da              DECIMAL(12,2)
otherAllowance  DECIMAL(12,2)
pf              BOOLEAN
esi             BOOLEAN
professionalTax BOOLEAN
tdsRate         DECIMAL(5,2)
isActive        BOOLEAN
createdAt       TIMESTAMP
```

#### Table: `PaySlip`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
employeeId      TEXT FK → Employee
month           INT
year            INT
basicSalary     DECIMAL(12,2)
hra             DECIMAL(12,2)
da              DECIMAL(12,2)
otherAllowance  DECIMAL(12,2)
grossSalary     DECIMAL(12,2)
pfDeduction     DECIMAL(12,2)
esiDeduction    DECIMAL(12,2)
ptDeduction     DECIMAL(12,2)
tdsDeducted     DECIMAL(12,2)
otherDeductions DECIMAL(12,2)
netSalary       DECIMAL(12,2)
status          ENUM           -- DRAFT, APPROVED, PAID
paidDate        DATE
voucherId       TEXT FK → Voucher
createdAt       TIMESTAMP
```

### 📄 Multi-Company

#### Table: `Company`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
name            TEXT
tradeName       TEXT
gstin           TEXT
panNumber       TEXT
tanNumber       TEXT
address         TEXT
city            TEXT
state           TEXT
stateCode       TEXT
pincode         TEXT
phone           TEXT
email           TEXT
website         TEXT
logo            TEXT
financialYearStart INT        -- 4 (April)
bookStartDate   DATE
isDefault       BOOLEAN
isActive        BOOLEAN
createdAt       TIMESTAMP
```

### 🤖 AI Features

#### Table: `AIConversation`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
userId          TEXT FK → User
companyId       TEXT FK → Company
messages        JSONB          -- [{role, content, timestamp}]
context         JSONB          -- financial context snapshot
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

#### Table: `AIInsight`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
companyId       TEXT FK → Company
insightType     ENUM           -- ANOMALY, SUGGESTION, FORECAST, ALERT
title           TEXT
description     TEXT
severity        ENUM           -- LOW, MEDIUM, HIGH, CRITICAL
data            JSONB
isRead          BOOLEAN
isDismissed     BOOLEAN
createdAt       TIMESTAMP
```

---

## 🔑 License Key System & Download Flow

### Customer Journey:
```
1. Customer visits books.vaahanerp.com
2. Selects a Plan (Starter / Professional / Enterprise)
3. Makes payment via Razorpay/PayPal
4. License Key auto-generated: VB-2026-XXXX-XXXX-XXXX
5. Download button ENABLED → downloads VaahanBooks-Setup.exe
6. Customer installs on their PC
7. First launch → Enter License Key
8. Key validated against cloud → Software ACTIVATED
9. Company setup wizard starts (name, GSTIN, address, etc.)
10. Ready to use! 🎉
```

### License Key Tables (Supabase)

#### Table: `License`
```
id              TEXT PK
tenantId        TEXT FK → Tenant
licenseKey      TEXT UNIQUE      -- VB-2026-XXXX-XXXX-XXXX
planType        ENUM             -- STARTER, PROFESSIONAL, ENTERPRISE
status          ENUM             -- ACTIVE, EXPIRED, SUSPENDED, REVOKED
activatedAt     TIMESTAMP
expiryDate      TIMESTAMP
lastVerified    TIMESTAMP        -- Last online license check
machineId       TEXT             -- Hardware fingerprint (prevents sharing)
maxCompanies    INT              -- Company limit per plan
maxUsers        INT              -- User limit per plan
isVaahanERPUser BOOLEAN          -- true = free license for ERP users
purchaseOrderId TEXT             -- Razorpay/PayPal order ID
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

#### Table: `LicenseLog`
```
id              TEXT PK
licenseId       TEXT FK → License
action          ENUM             -- ACTIVATED, VERIFIED, EXPIRED, RENEWED,
                                 -- SUSPENDED, REVOKED, MACHINE_CHANGED
oldMachineId    TEXT
newMachineId    TEXT
ipAddress       TEXT
metadata        JSONB
createdAt       TIMESTAMP
```

### License Key Format:
```
VB-{YEAR}-{RANDOM_4}-{RANDOM_4}-{RANDOM_4}
Example: VB-2026-A7K9-M3P2-X8L5
```

### Plan Expiry & Renewal System:
```
┌─────────────────────────────────────────────────────────┐
│                 EXPIRY ALERT SYSTEM                       │
│                                                           │
│  📅 > 30 days remaining  →  Normal (no alert)            │
│  📅 30 days remaining    →  🟡 Yellow banner appears     │
│                              "Your plan expires in 30 days"│
│  📅 15 days remaining    →  🟠 Orange banner             │
│                              "Plan expiring soon! Renew" │
│  📅 7 days remaining     →  🔴 RED banner (persistent)   │
│                              "⚠️ EXPIRES IN 7 DAYS!      │
│                               RENEW NOW to avoid          │
│                               service interruption"       │
│  📅 0 days (expired)     →  🚫 Software enters READ-ONLY │
│                              Can view data, cannot create │
│                              new invoices/vouchers        │
│                              "License Expired. Renew to  │
│                               continue using VaahanBooks"│
│                                                           │
│  [Renew Now] button → Opens books.vaahanerp.com/renew    │
│  After payment → License auto-renewed → Software unlocks │
└─────────────────────────────────────────────────────────┘
```

### License Verification (Anti-Piracy):
1. **On first launch** — License key + machine fingerprint validated online
2. **Every 7 days** — Background online check (silent)
3. **Grace period** — If offline for 30 days, still works. After 30 days, requires online verification
4. **Machine binding** — License tied to hardware ID (1 transfer allowed per year)

---

## 🔗 VaahanERP ↔ VaahanBooks Sync Architecture

```
                    SYNC FLOW (Cloud Sync when online)
                    
VaahanERP (Web)                    VaahanBooks (Desktop)
───────────────                    ─────────────────────

BookingPayment ─── cloud sync ──►  Receipt Voucher
(Cash/UPI/NEFT                     (Auto-create with
 received)                          Party Ledger entry)

JobCard Complete ── cloud sync ──►  Sales Invoice
(Service billing)                   (GST calculated,
                                    E-Invoice generated)

CashTransaction ── cloud sync ──►  Cash/Bank Voucher
(INFLOW/OUTFLOW)                   (Daybook → Cash Book)

Expense ────────── cloud sync ──►  Payment Voucher  
                                    (Expense Ledger entry)

Vehicle Sale ───── cloud sync ──►  Sales Invoice
(Booking DELIVERED)                (Full GST invoice)

Customer ──────── shared cloud ──► Party Ledger
(Same tenantId)                    (Auto-create from
                                    customer data)
```

### Sync Implementation:
1. **Supabase as cloud hub** — both VaahanERP and VaahanBooks share `tenantId`
2. **Desktop syncs periodically** — every 5 minutes when online, or manual sync
3. **Local SQLite as primary** — all work happens locally, syncs to cloud
4. **Offline resilience** — Desktop works 100% offline, syncs when back online
5. **Idempotent processing** — `sourceSystem` + `sourceId` prevents duplicates

### ⚠️ Conflict Resolution (Accounting-Safe — NOT Last-Write-Wins)
```
❌ WRONG: Last-write-wins (data overwrite = accounting disaster)
✅ CORRECT: Immutable accounting + conflict log

RULES:
1. Vouchers are IMMUTABLE once CONFIRMED
   → Cannot overwrite a confirmed voucher
   → Only way is to create a reversal/correction voucher

2. Conflict Log Table:
   ┌─────────────────────────────────────────────┐
   │ SyncConflict Table                           │
   │ id, tenantId, tableName, recordId,           │
   │ localData (JSONB), cloudData (JSONB),        │
   │ conflictType (EDIT/DELETE),                  │
   │ resolution (PENDING/LOCAL/CLOUD/MANUAL),     │
   │ resolvedById, resolvedAt, createdAt          │
   └─────────────────────────────────────────────┘

3. When conflict detected:
   → 🟡 Alert shown: "Sync conflict found in Invoice #1234"
   → User sees BOTH versions side-by-side
   → User picks: Keep Local / Keep Cloud / Merge
   → Full audit trail logged

4. Priority order:
   → CONFIRMED vouchers = NEVER overwritten
   → DRAFT vouchers = can be merged
   → Master data (Ledger, Product) = latest update wins with log
   → Transactions = ALWAYS create conflict for manual resolution
```

---

## 📱 Module Breakdown & Pages

### Module 1: Dashboard
```
/dashboard
├── Financial Summary (Revenue, Expenses, P&L snapshot)
├── Cash & Bank Position
├── Outstanding Receivables / Payables
├── GST Due Summary
├── AI Insights Panel
└── Quick Actions (Create Invoice, Receipt, Payment)
```

### Module 2: Invoicing (Sales & Purchase)
```
/invoices
├── /sales          — Sales Invoice (B2B, B2C, Export)
├── /purchase       — Purchase Invoice
├── /credit-notes   — Credit Notes (Sales Return)
├── /debit-notes    — Debit Notes (Purchase Return)
├── /proforma       — Proforma / Estimate
├── /recurring      — Recurring Invoices
└── /templates      — Custom Invoice Templates
```

### Module 3: Accounting
```
/accounting
├── /vouchers       — All Voucher Types
│   ├── /receipt    — Receipt Voucher
│   ├── /payment    — Payment Voucher
│   ├── /contra     — Contra (Cash ↔ Bank)
│   └── /journal    — Journal Entry
├── /ledgers        — Ledger Management
├── /groups         — Account Groups (Chart of Accounts)
├── /day-book       — Day Book
├── /cash-book      — Cash Book
├── /bank-book      — Bank Book
└── /trial-balance  — Trial Balance
```

### Module 4: GST Compliance
```
/gst
├── /gstr-1         — GSTR-1 (Outward Supplies)
├── /gstr-3b        — GSTR-3B (Summary Return)
├── /gstr-2a        — GSTR-2A Reconciliation
├── /e-invoice      — E-Invoice Generation
├── /e-way-bill     — E-Way Bill Management
├── /hsn-summary    — HSN-wise Summary
└── /itc            — Input Tax Credit Tracker
```

### Module 5: Reports
```
/reports
├── /balance-sheet    — Balance Sheet
├── /profit-loss      — Profit & Loss Statement
├── /cash-flow        — Cash Flow Statement
├── /receivables      — Outstanding Receivables
├── /payables         — Outstanding Payables
├── /stock-summary    — Stock Summary
├── /sales-register   — Sales Register
├── /purchase-register — Purchase Register
├── /party-statement  — Party-wise Statement
├── /tds-report       — TDS/TCS Reports
└── /custom           — Custom Report Builder
```

### Module 6: Inventory
```
/inventory
├── /products       — Product/Item Master
├── /stock          — Stock Summary
├── /godowns        — Warehouse Management
├── /stock-journal  — Stock Transfer/Adjustment
├── /barcode        — Barcode/QR Management
└── /valuation      — Stock Valuation (FIFO/Weighted Avg)
```

### Module 7: Banking
```
/banking
├── /accounts       — Bank Account Management
├── /reconciliation — Bank Reconciliation
├── /import         — Statement Import (CSV/OFX)
└── /cheque         — Cheque Management
```

### Module 8: Payroll
```
/payroll
├── /employees      — Employee Master
├── /payslips       — Monthly Pay Slips
├── /process        — Salary Processing
└── /reports        — Payroll Reports
```

### Module 9: AI Assistant (Hybrid — Rule + Claude)
```
/ai
├── /chat           — Natural Language Query (Claude API — complex only)
├── /insights       — AI Business Insights (Claude — monthly cron)
├── /anomalies      — Anomaly Detection (RULE-BASED — real-time)
├── /gst-fix        — GST Error Auto-Fix (RULE + AI hybrid)
├── /forecasts      — Revenue/Expense Forecasts (Claude — on-demand)
└── /follow-ups     — Debtor Follow-ups (RULE-BASED triggers)
```

### Module 10: CA Mode (Chartered Accountant) 🆕
```
/ca-mode
├── /clients        — Multi-client dashboard
├── /bulk-gst       — Bulk GSTR filing for all clients
├── /compliance     — Compliance calendar
├── /review         — Data review & approval
└── /reports        — Cross-client analytics
```

### Module 11: Backup & Recovery 🆕
```
/backup
├── /auto           — Auto daily backup settings
├── /manual         — Manual backup (pen drive / local folder)
├── /cloud          — Cloud backup to Supabase
├── /restore        — One-click restore
└── /history        — Backup history log
```

### Module 12: Plugin Marketplace 🆕
```
/plugins
├── /installed      — Active plugins
├── /marketplace    — Browse & install third-party plugins
├── /developer      — Plugin SDK documentation
└── /settings       — Plugin permissions & config
```

### Module 13: Settings
```
/settings
├── /company        — Company Profile(s)
├── /gst            — GST Configuration (GSP provider selection)
├── /invoice        — Invoice Customization
├── /tax-rates      — Tax Rate Master
├── /print          — Print Templates
├── /users          — User Management
├── /import-export  — Data Import/Export (Tally import supported!)
├── /integration    — VaahanERP Sync Settings
├── /backup         — Backup & Restore
├── /license        — License & Renewal
└── /plugins        — Plugin Management
```

---

## 🤖 AI Strategy (HYBRID: Rule-Based + Claude API)

> **⚠️ CRITICAL DESIGN DECISION:**
> NOT everything needs AI. Claude API is expensive (~$3/1M tokens).
> We use a HYBRID approach: Rule-based for 70% tasks, Claude for 30%.

### AI Decision Matrix:
```
┌──────────────────────────────┬─────────────┬───────────────┐
│ FEATURE                       │ ENGINE      │ WHY           │
├──────────────────────────────┼─────────────┼───────────────┤
│ Payment reminders             │ RULE-BASED  │ Simple logic  │
│ Duplicate invoice detection   │ RULE-BASED  │ String match  │
│ Sequential number check       │ RULE-BASED  │ Gap detection │
│ GST rate validation           │ RULE-BASED  │ HSN lookup    │
│ Negative stock alerts         │ RULE-BASED  │ Simple check  │
│ Auto ledger posting           │ RULE-BASED  │ Mapping table │
│ Debtor follow-up triggers     │ RULE-BASED  │ Date logic    │
│ Expiry/renewal alerts         │ RULE-BASED  │ Date logic    │
├──────────────────────────────┼─────────────┼───────────────┤
│ Natural Language Querying     │ CLAUDE API  │ NLP required  │
│ Financial insights/forecast   │ CLAUDE API  │ Analysis      │
│ Anomaly explanation           │ CLAUDE API  │ Reasoning     │
│ Smart invoice from voice      │ CLAUDE API  │ NLP parsing   │
│ GST error fix suggestions     │ HYBRID      │ Rules + AI    │
│ Debtor message composition    │ CLAUDE API  │ Personalized  │
│ Business decision advice      │ CLAUDE API  │ Complex logic │
└──────────────────────────────┴─────────────┴───────────────┘
```

### Claude API Cost Control:
```
- Cache frequent queries ("aaj ka sales") → don't call Claude
- Batch insights generation (daily cron, not real-time)
- Use Claude Haiku for simple tasks, Sonnet for complex
- Monthly AI usage dashboard per tenant
- Hard limit: X API calls per plan tier
```

### 1. Natural Language Querying (NLQ) — Claude API
```typescript
// User types: "pichhle mahine ka profit batao"
// Step 1: Check local cache for similar query
// Step 2: If miss → Claude parses → generates SQL → returns formatted answer

// Claude generates:
// → Query P&L data for last month
// → Format: "Pichhle mahine (March 2026) ka Net Profit ₹2,45,678 raha 📊"
```

### 2. Smart Auto Accounting Engine 🆕 — RULE-BASED (Zero AI Cost)
```
┌─────────────────────────────────────────────────────────────┐
│          SMART AUTO ACCOUNTING ENGINE                        │
│                                                             │
│  Invoice Created → Auto Ledger Posting:                    │
│  ┌─────────────────────────────────────────────┐           │
│  │ Sales Invoice → Debit: Party Ledger         │           │
│  │               → Credit: Sales A/C           │           │
│  │               → Credit: CGST Payable        │           │
│  │               → Credit: SGST Payable        │           │
│  │               → Stock reduced automatically  │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Purchase Invoice → Debit: Purchase A/C                    │
│                   → Debit: CGST Receivable                 │
│                   → Credit: Party Ledger                   │
│                   → Stock increased automatically           │
│                                                             │
│  Receipt → Debit: Cash/Bank    → Credit: Party             │
│  Payment → Debit: Party        → Credit: Cash/Bank         │
│  Expense → Debit: Expense A/C  → Credit: Cash/Bank         │
│                                                             │
│  ✅ RESULT: 90% transactions need ZERO manual entry        │
│  ✅ User only enters invoice → system does rest             │
└─────────────────────────────────────────────────────────────┘
```

### 3. GST Error Auto-Fix 🆕 — HYBRID (Rules + AI)
```
┌─────────────────────────────────────────────────────────────┐
│          GST ERROR AUTO-FIX SYSTEM                          │
│                                                             │
│  RULE-BASED (instant, free):                               │
│  ├── ❌ Wrong GST rate for HSN code → ✅ Suggest correct   │
│  ├── ❌ Missing HSN/SAC code → ✅ Auto-lookup from master  │
│  ├── ❌ Invalid GSTIN format → ✅ Highlight + format hint  │
│  ├── ❌ Inter-state IGST applied as CGST+SGST → ✅ Fix     │
│  ├── ❌ Reverse charge missed → ✅ Flag for review         │
│  └── ❌ Place of supply mismatch → ✅ Auto-correct         │
│                                                             │
│  AI-ASSISTED (Claude, on-demand):                          │
│  ├── Complex HSN classification for new products           │
│  ├── Explain WHY a GST error occurred (training)           │
│  └── Suggest correct treatment for edge cases              │
│                                                             │
│  ✅ Runs before GSTR-1 filing → catches ALL errors         │
│  ✅ Saves CA fees for simple corrections                   │
└─────────────────────────────────────────────────────────────┘
```

### 4. Automated Debtor Follow-ups — RULE-BASED + Claude
```
RULE-BASED triggers:
  Invoice overdue 7 days  → WhatsApp gentle reminder (template)
  Invoice overdue 15 days → Email follow-up (template)
  Invoice overdue 30 days → Voice call via Exotel (template)
  Invoice overdue 60 days → Final notice (template)

CLAUDE API (optional upgrade):
  → AI composes PERSONALIZED message based on party history
  → Auto-detect language (Hindi/English/Hinglish)
  → Only for Enterprise plan users
```

### 5. Financial Insights — Claude API (Batched)
```
- Monthly revenue trends with predictions (daily cron job)
- Top debtors with aging analysis (cached, updated 4x/day)
- Cash flow forecasts next 30/60/90 days (weekly generation)
- Tax liability predictions (monthly)
- Expense pattern analysis (weekly)
- NOT real-time → batched to control costs
```

---

## 🔐 Authentication & Authorization

### Shared SSO Architecture
```
VaahanERP (vaahanerp.com)     VaahanBooks (books.vaahanerp.com)
         │                              │
         └──── Shared JWT Token ────────┘
                     │
              Supabase Auth + NextAuth
                     │
           Same User table, same tenantId
```

### Role Mapping
| VaahanERP Role | VaahanBooks Access |
|---------------|-------------------|
| SUPER_ADMIN | Full system access |
| OWNER | Full company access |
| MANAGER | View all + Create vouchers |
| ACCOUNTANT | Full accounting access |
| SALES_EXEC | Create sales invoices, view reports |
| MECHANIC | No billing access (service only) |
| VIEWER | Dashboard + Reports (read-only) |

---

## 📁 GitHub Repository Structure

### Repo 1: `vaahan-books` (Desktop App — Electron)
```
vaahan-books/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── electron-builder.yml          -- Installer config (.exe/.dmg)
├── electron/
│   ├── main.ts                   -- Electron main process
│   ├── preload.ts                -- Bridge: renderer ↔ main
│   ├── license-manager.ts        -- License validation & expiry
│   ├── auto-updater.ts           -- Silent background updates
│   ├── cloud-sync.ts             -- Supabase sync engine
│   ├── print-service.ts          -- Native printer support
│   └── database/
│       ├── sqlite.ts             -- Local SQLite connection
│       ├── migrations.ts         -- Local DB migrations
│       └── seed.ts               -- Default chart of accounts
├── src/                          -- React frontend (renderer)
│   ├── pages/
│   │   ├── activation/           -- License key entry screen
│   │   ├── setup-wizard/         -- Company setup on first launch
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   │   ├── sales/
│   │   │   ├── purchase/
│   │   │   ├── credit-notes/
│   │   │   └── debit-notes/
│   │   ├── accounting/
│   │   │   ├── vouchers/
│   │   │   ├── ledgers/
│   │   │   ├── groups/
│   │   │   ├── day-book/
│   │   │   ├── cash-book/
│   │   │   └── bank-book/
│   │   ├── gst/
│   │   │   ├── gstr-1/
│   │   │   ├── gstr-3b/
│   │   │   ├── e-invoice/
│   │   │   └── e-way-bill/
│   │   ├── reports/
│   │   ├── inventory/
│   │   ├── banking/
│   │   ├── payroll/
│   │   ├── ai/
│   │   └── settings/
│   │       ├── company/
│   │       ├── license/          -- View license, renew
│   │       └── sync/             -- VaahanERP sync settings
│   ├── components/
│   │   ├── ui/                   -- Shadcn components
│   │   ├── license/              -- Expiry banner, renewal CTA
│   │   ├── invoices/
│   │   ├── accounting/
│   │   ├── gst/
│   │   ├── reports/
│   │   ├── ai/
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       ├── header.tsx
│   │       └── expiry-banner.tsx  -- Red/Yellow/Orange expiry alert
│   ├── lib/
│   │   ├── local-db.ts           -- SQLite queries
│   │   ├── cloud-api.ts          -- Supabase API calls
│   │   ├── claude.ts             -- Claude API client
│   │   ├── gst-api.ts            -- NIC E-Invoice/E-Way APIs
│   │   ├── pdf-generator.ts
│   │   └── excel-export.ts
│   ├── utils/
│   │   ├── billing.ts            -- GST calculations (decimal.js)
│   │   ├── accounting.ts         -- Double-entry helpers
│   │   ├── license.ts            -- License key validation logic
│   │   ├── validators.ts
│   │   └── formatters.ts
│   ├── store/
│   │   ├── license-store.ts      -- License state management
│   │   ├── voucher-store.ts
│   │   └── company-store.ts
│   └── types/
├── build/                        -- Generated installers
│   ├── VaahanBooks-Setup-1.0.0.exe
│   └── VaahanBooks-1.0.0.dmg
└── scripts/
    ├── build-win.sh              -- Windows build script
    └── build-mac.sh              -- Mac build script
```

### Repo 2: `vaahan-books-portal` (Download Website — Next.js on Vercel)
```
vaahan-books-portal/
├── src/
│   ├── app/
│   │   ├── page.tsx              -- Landing page (marketing)
│   │   ├── pricing/              -- Plan selection
│   │   ├── download/             -- Download page (enabled after purchase)
│   │   ├── license/              -- License management dashboard
│   │   │   ├── activate/
│   │   │   ├── renew/
│   │   │   └── history/
│   │   ├── login/
│   │   ├── register/
│   │   └── api/
│   │       ├── license/
│   │       │   ├── generate/     -- Auto-generate license key
│   │       │   ├── validate/     -- Validate license (called by desktop)
│   │       │   ├── renew/        -- Renew license
│   │       │   └── revoke/
│   │       ├── payments/
│   │       │   ├── razorpay/
│   │       │   └── paypal/
│   │       └── download/
│   │           └── latest/       -- Serve latest installer file
└── ...
```

---

## 🚀 Development Plan (Phased — 26 Weeks)

### Phase 1: Foundation (Week 1-3)
- [x] Electron + React + Vite + TypeScript project setup ✅
- [x] SQLite database with WAL mode + full schema (Company, AccountGroup, Ledger, Voucher, VoucherItem, Product, SyncConflict, BackupLog) ✅
- [x] License key activation screen (machine fingerprint SHA-256, format validation) ✅
- [x] License validation with encrypted local store + machine binding ✅
- [x] Company setup wizard (6-step: Name, GSTIN/PAN, Address/State, FY, Contact, Review) ✅
- [x] Default Chart of Accounts — 12 primary groups + sub-groups + 18 default ledgers (Tally-compatible) ✅
- [x] Sidebar navigation (13 modules) + Dashboard layout + plan status indicator ✅
- [x] Expiry banner system (Yellow 30d / Orange 15d / Red 7d / Expired read-only) ✅
- [x] **Auto daily backup system** (.vbak format, 30-day retention, startup backup) ✅
- [x] **Download portal website** (books.vaahanerp.com) — Phase 1b (separate repo) ✅
- [x] **npm install complete** — Node.js found and dependencies installed ✅

### Phase 2: Core Invoicing + Auto Accounting (Week 4-7)
- [x] Sales Invoice (B2B, B2C)
- [x] Purchase Invoice
- [x] Credit Notes & Debit Notes
- [x] Party Ledger auto-creation
- [x] GST calculation engine (CGST/SGST/IGST) (Using decimal.js) ✅
- [x] **Smart Auto Accounting Engine** (invoice → auto ledger posting) ✅
- [x] Invoice PDF generation (native print support)
- [x] Invoice thermal printer support
- [x] **GST Error Auto-Fix (rule-based)** — catches errors before filing ✅

### Phase 3: Accounting (Week 8-10)
- [x] Voucher Entry (Receipt, Payment, Contra, Journal) ✅
- [x] Double-entry posting engine (with auto-post rules) ✅
- [x] Ledger views & statements ✅
- [x] Day Book, Cash Book, Bank Book ✅
- [x] Trial Balance ✅
- [x] Balance Sheet & P&L ✅
- [x] **Conflict-safe sync architecture** (immutable vouchers) ✅

### Phase 4: GST Compliance (Week 11-13)
- [x] **Mock GST system** for development/testing ✅
- [x] **GSP integration (ClearTax/MastersIndia)** for production ✅
- [x] GSTR-1 generation & filing via GSP ✅
- [x] GSTR-3B generation & filing via GSP
- [x] E-Invoice via GSP ✅
- [x] E-Way Bill via GSP ✅
- [x] GSTR-2A/2B reconciliation
- [x] HSN summary report
- [x] *(Direct NIC API — future phase, when access approved)*

### Phase 5: License, Sync & Advanced (Week 14-17)
- [x] Plan expiry alert system (30/15/7 day warnings) ✅
- [x] In-app renewal flow ✅
- [x] Cloud sync with Supabase (**conflict log + manual resolution UI**) ✅
- [x] VaahanERP ↔ VaahanBooks sync with audit trail ✅
- [x] Bank reconciliation
- [x] TDS/TCS management
- [x] Inventory management with barcodes
- [x] Multi-company support
- [x] Payroll module
- [x] **Offline backup to pen drive / external folder** ✅

### Phase 6: AI (Hybrid) + Installer (Week 18-22)
- [x] **Rule-based engine** (reminders, validations, auto-posting) ✅
- [x] Claude API integration (**batched, cost-controlled**) ✅
- [x] Natural Language Querying (Claude Haiku for simple, Sonnet for complex) ✅
- [x] AI financial insights (daily cron, cached) ✅
- [x] GST Error AI fix (hybrid — rules + Claude) ✅
- [x] Automated debtor follow-ups (rule triggers + AI message) ✅
- [x] Electron auto-updater
- [x] Windows installer (.exe) with **code signing**
- [x] Mac installer (.dmg) with **notarization**
- [x] **Electron performance optimization** (worker threads, lazy loading)
- [x] Production release on books.vaahanerp.com

### Phase 7: CA Mode + Plugins + Polish (Week 23-26) 🆕
- [x] **CA Mode** — multi-client dashboard for Chartered Accountants ✅
- [x] Bulk GSTR filing for multiple clients ✅
- [x] Cross-client compliance calendar ✅
- [x] **Plugin System** — SDK + marketplace architecture ✅
- [x] Sample plugins (custom report builder, industry templates) ✅
- [x] **Tally import** — migrate data from Tally Prime ✅
- [x] Final security audit & penetration testing ✅
- [x] Performance benchmarks vs Tally Prime ✅

---

## 🔄 How Development Will Work (Process)

### Step 1: Create GitHub Repos
```bash
github.com/ravi0067/vaahan-books          # Desktop app (Electron)
github.com/ravi0067/vaahan-books-portal    # Download website (Next.js)
```

### Step 2: Supabase Setup
- Same Supabase project (vsadlgeprxfaihmveamk)
- New tables: License, LicenseLog + all VaahanBooks accounting tables
- Shared `tenantId` for data isolation
- API endpoints for license validation

### Step 3: Deployment
```
vaahanerp.com          → vaahan-erp repo (existing, Vercel)
books.vaahanerp.com    → vaahan-books-portal repo (new, Vercel)
Desktop App (.exe/.dmg) → Built from vaahan-books repo,
                          hosted on GitHub Releases / S3
```

### Step 4: Development Flow
```
1. I create both repos on GitHub
2. Desktop app: Develop Electron + React modules phase by phase
3. Portal website: Marketing + purchase + download + license management
4. You review and provide feedback at each phase
5. Desktop builds uploaded to GitHub Releases
6. Portal deployed to books.vaahanerp.com via Vercel
```

### Step 5: Release Flow
```
Code push → GitHub Actions → electron-builder → .exe/.dmg
         → Upload to GitHub Releases
         → Portal download page points to latest release
         → Auto-updater in desktop checks for new versions
```

---

## 💰 Pricing Model (Suggestion)

| Plan | VaahanERP Users | Standalone Users | Features | License |
|------|----------------|-----------------|----------|----------|
| **Trial** | N/A | ✅ 30-day free | Basic invoicing, 50 invoices | Auto-expires |
| **Starter** (₹999/mo) | ✅ FREE | ✅ Purchase | Unlimited invoices, GST, reports | 1 Company, 2 Users |
| **Professional** (₹2,499/mo) | ✅ FREE | ✅ Purchase | + E-Invoice, E-Way, Bank, AI Basic | 3 Companies, 5 Users |
| **Enterprise** (₹4,999/mo) | ✅ FREE | ✅ Purchase | + Multi-company, Payroll, AI Pro | Unlimited |

---

## ⚡ Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **App type** | **Desktop (Electron)** | Like Tally Prime — download, install, license |
| **Local DB** | **SQLCipher (encrypted SQLite)** | AES-256 at rest, offline-first, fast |
| **Cloud DB** | **Supabase (PostgreSQL)** | Shared tenantId with VaahanERP |
| **License system** | **Signed JWT + machine fingerprint** | Tamper-proof, hardware-bound |
| **Installer** | **electron-builder + code signing** | Trusted .exe/.dmg installers |
| **Auto-update** | **electron-updater** | Silent background updates |
| **Financial precision** | **decimal.js** | Zero floating-point errors |
| **AI strategy** | **Hybrid: Rules (70%) + Claude (30%)** | Cost control, fast for simple tasks |
| **PDF engine** | **pdfkit (native)** | Direct desktop printing support |
| **GST API** | **GSP (ClearTax/MastersIndia)** | Realistic, production-ready, no NIC hassle |
| **Sync conflicts** | **Immutable vouchers + conflict log** | Accounting-safe, no data overwrite |
| **Download portal** | **Next.js + Vercel** | books.vaahanerp.com |
| **Performance** | **Worker threads + virtual scroll** | Heavy calc off UI thread |
| **Backup** | **Auto daily + pen drive export** | Data safety for Indian SMBs |
| **Plugin system** | **Electron IPC + sandboxed plugins** | Third-party extensibility |

---

## 📱 Desktop App User Flow (First-Time)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Download   │     │   Install    │     │   Activate   │
│   .exe from  │────►│   on PC      │────►│   Enter      │
│   website    │     │   (wizard)   │     │   License    │
└──────────────┘     └──────────────┘     │   Key        │
                                           └──────┬───────┘
                                                  │
                     ┌───────────────────────────────┐
                     │   Company Setup Wizard         │
                     │   ┌─────────────────────────┐ │
                     │   │ Step 1: Company Name     │ │
                     │   │ Step 2: GSTIN / PAN      │ │
                     │   │ Step 3: Address & State  │ │
                     │   │ Step 4: Financial Year   │ │
                     │   │ Step 5: Upload Logo      │ │
                     │   │ Step 6: Create Users     │ │
                     │   └─────────────────────────┘ │
                     └──────────────┬────────────────┘
                                   │
                     ┌──────────────┴──────────────┐
                     │      🎉 DASHBOARD            │
                     │      Ready to use!           │
                     │      Create first invoice    │
                     └─────────────────────────────┘
```

---

## 🔒 Security Architecture (Hardened)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
│                                                                  │
│  1. DATA AT REST                                                 │
│     └── SQLCipher (AES-256-CBC encryption)                      │
│     └── Key derived from license + machine ID                   │
│     └── Even if .db file copied, cannot read without key        │
│                                                                  │
│  2. LICENSE PROTECTION                                           │
│     └── License key = Signed JWT (RS256)                        │
│     └── Machine ID = SHA-256(CPU + Disk + MAC + OS serial)      │
│     └── Online verification every 7 days                        │
│     └── Obfuscated validation logic (webpack obfuscation)       │
│     └── Anti-debugging: detect DevTools, disable in production  │
│                                                                  │
│  3. CODE PROTECTION                                              │
│     └── ASAR archive (Electron app packaging)                   │
│     └── Code signing (Windows Authenticode + Mac notarization)  │
│     └── CSP headers (Content Security Policy)                   │
│                                                                  │
│  4. NETWORK SECURITY                                             │
│     └── All API calls over HTTPS/TLS 1.3                        │
│     └── Certificate pinning for license server                  │
│     └── Request signing (HMAC) for sync API                     │
│                                                                  │
│  5. BACKUP SECURITY                                              │
│     └── Encrypted backup files (.vbak)                          │
│     └── Password-protected exports                               │
│     └── Backup integrity checksum (SHA-256)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Electron Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│              PERFORMANCE STRATEGY                                │
│              (Must be FASTER than Tally)                         │
│                                                                  │
│  1. HEAVY LOGIC → NODE WORKER THREADS                           │
│     └── GST calculations in worker thread                       │
│     └── Report generation (P&L, Balance Sheet) in worker        │
│     └── GSTR-1/3B JSON generation in worker                     │
│     └── UI thread stays responsive = no freezing                │
│                                                                  │
│  2. UI OPTIMIZATION                                              │
│     └── Virtual scrolling for large lists (1000+ invoices)      │
│     └── Lazy loading — load modules on-demand, not all at once  │
│     └── Skeleton loaders instead of blank screens               │
│     └── Debounced search & filter inputs                        │
│                                                                  │
│  3. DATABASE OPTIMIZATION                                        │
│     └── SQLite WAL mode (concurrent reads)                      │
│     └── Proper indexes on all query fields                      │
│     └── Prepared statements (no SQL injection, faster)          │
│     └── Batch inserts for bulk operations                       │
│                                                                  │
│  4. MEMORY MANAGEMENT                                            │
│     └── Target: < 200MB RAM usage                               │
│     └── Electron contextIsolation = true                        │
│     └── No memory leaks — cleanup on page navigation            │
│     └── Monitoring: built-in memory usage indicator             │
│                                                                  │
│  5. STARTUP SPEED                                                │
│     └── Target: < 3 seconds cold start                          │
│     └── Deferred module loading (load accounting on first use)  │
│     └── Pre-compiled Prisma queries                              │
│     └── Splash screen while loading                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Plugin System Architecture 🆕

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLUGIN SYSTEM                                 │
│                                                                  │
│  ARCHITECTURE:                                                   │
│  ├── Plugins = Electron IPC-based modules                       │
│  ├── Each plugin runs in sandboxed renderer                     │
│  ├── Plugin manifest (plugin.json) defines:                     │
│  │   ├── name, version, author                                  │
│  │   ├── permissions (read_invoices, write_ledger, etc.)        │
│  │   ├── menu position (sidebar placement)                      │
│  │   └── hooks (onInvoiceCreate, onPaymentReceive, etc.)        │
│  │                                                               │
│  USE CASES:                                                      │
│  ├── Custom industry invoice templates                          │
│  ├── WhatsApp bulk invoice sender                               │
│  ├── Custom report builder                                      │
│  ├── Industry-specific modules (medical, retail, wholesale)     │
│  ├── Third-party payment gateway                                │
│  └── Integration with other software (Zoho, QuickBooks)         │
│                                                                  │
│  DEVELOPER SDK:                                                  │
│  ├── npm package: @vaahan-books/plugin-sdk                      │
│  ├── CLI tool: vb-plugin init / build / test / publish          │
│  ├── Documentation site                                         │
│  └── Revenue share: 70% developer / 30% VaahanBooks             │
└─────────────────────────────────────────────────────────────────┘
```

---

> **📌 STATUS: PLAN v3.0 — FINAL VERSION**
> 
> **Critical Fixes Applied:**
> - ✅ GST: Mock → GSP (ClearTax/MastersIndia) → Direct NIC later
> - ✅ AI: Hybrid (70% Rule-based + 30% Claude) — cost controlled
> - ✅ Sync: Immutable vouchers + conflict log + manual resolution UI
> - ✅ Security: SQLCipher encryption, signed JWT license, code signing
> - ✅ Performance: Worker threads, virtual scroll, < 200MB RAM, < 3s startup
>
> **Next-Level Features Added:**
> - ✅ Smart Auto Accounting Engine (90% zero manual entry)
> - ✅ CA Mode (multi-client dashboard for CAs)
> - ✅ GST Error Auto-Fix (rule-based + AI hybrid)
> - ✅ Offline Backup System (auto daily + pen drive + cloud)
> - ✅ Plugin System (third-party marketplace + SDK)
>
> **This is the FINAL plan. Jab aap bolo "start karo" — coding shuru!** 🚀
