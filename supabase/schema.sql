-- ==============================================================================
-- VAAHAN BOOKS - SUPABASE CLOUD SYNC SCHEMA (PostgreSQL)
-- Complete schema matching VaahanBooks_Architecture_Plan.md v3.0
-- Execute this file in the Supabase SQL Editor.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TENANT (Shared with VaahanERP)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."Tenant" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. COMPANY (Multi-company support) — Plan §Module 13 / §Multi-Company
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."Company" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "tradeName" TEXT DEFAULT '',
    gstin TEXT DEFAULT '',
    "panNumber" TEXT DEFAULT '',
    "tanNumber" TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    "stateCode" TEXT DEFAULT '',
    pincode TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    website TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    "financialYearStart" INTEGER DEFAULT 4,
    "bookStartDate" DATE,
    "isDefault" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. ACCOUNT GROUP (Chart of Accounts hierarchy) — Plan §Core Accounting
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."AccountGroup" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "parentId" TEXT REFERENCES public."AccountGroup"(id),
    nature TEXT NOT NULL CHECK (nature IN ('ASSETS','LIABILITIES','INCOME','EXPENSE')),
    "isSystem" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. LEDGER — Plan §Core Accounting
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."Ledger" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "accountGroupId" TEXT REFERENCES public."AccountGroup"(id),
    "openingBalance" DECIMAL(14,2) DEFAULT 0,
    "currentBalance" DECIMAL(14,2) DEFAULT 0,
    "balanceType" TEXT DEFAULT 'DEBIT' CHECK ("balanceType" IN ('DEBIT','CREDIT')),
    gstin TEXT DEFAULT '',
    "panNumber" TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    "creditLimit" DECIMAL(14,2) DEFAULT 0,
    "creditPeriod" INTEGER DEFAULT 0,
    "ledgerType" TEXT DEFAULT 'PARTY' CHECK ("ledgerType" IN ('PARTY','BANK','CASH','TAX','EXPENSE','INCOME','ASSET','LIABILITY')),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. VOUCHER (Master transaction) — Plan §Core Accounting
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."Voucher" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    "voucherNumber" TEXT NOT NULL,
    "voucherDate" DATE NOT NULL,
    "voucherType" TEXT NOT NULL CHECK ("voucherType" IN ('SALES','PURCHASE','RECEIPT','PAYMENT','CONTRA','JOURNAL','CREDIT_NOTE','DEBIT_NOTE','SALES_RETURN','PURCHASE_RETURN')),
    "partyLedgerId" TEXT REFERENCES public."Ledger"(id),
    narration TEXT DEFAULT '',
    "totalAmount" DECIMAL(14,2) DEFAULT 0,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','CONFIRMED','CANCELLED')),
    "referenceNo" TEXT DEFAULT '',
    "isRecurring" BOOLEAN DEFAULT false,
    "recurPattern" TEXT,
    "linkedVoucherId" TEXT REFERENCES public."Voucher"(id),
    "placeOfSupply" TEXT DEFAULT '',
    "isInterState" BOOLEAN DEFAULT false,
    "reverseCharge" BOOLEAN DEFAULT false,
    "gstTreatment" TEXT DEFAULT 'REGISTERED' CHECK ("gstTreatment" IN ('REGISTERED','UNREGISTERED','COMPOSITION','SEZ','EXPORT','EXEMPTED')),
    "eInvoiceIrn" TEXT,
    "eInvoiceAckNo" TEXT,
    "eInvoiceAckDate" TIMESTAMP WITH TIME ZONE,
    "eWayBillNo" TEXT,
    "eWayBillDate" TIMESTAMP WITH TIME ZONE,
    "eWayBillExpiry" TIMESTAMP WITH TIME ZONE,
    "sourceSystem" TEXT,
    "sourceId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. VOUCHER ITEM (Line items with double-entry) — Plan §Core Accounting
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."VoucherItem" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "voucherId" TEXT REFERENCES public."Voucher"(id) ON DELETE CASCADE,
    "ledgerId" TEXT REFERENCES public."Ledger"(id),
    amount DECIMAL(14,2) DEFAULT 0,
    "isDebit" BOOLEAN DEFAULT true,
    description TEXT DEFAULT '',
    "hsnCode" TEXT DEFAULT '',
    "sacCode" TEXT DEFAULT '',
    "gstRate" DECIMAL(5,2) DEFAULT 0,
    cgst DECIMAL(12,2) DEFAULT 0,
    sgst DECIMAL(12,2) DEFAULT 0,
    igst DECIMAL(12,2) DEFAULT 0,
    cess DECIMAL(12,2) DEFAULT 0,
    "taxableAmount" DECIMAL(14,2) DEFAULT 0,
    "productId" TEXT,
    quantity DECIMAL(10,3) DEFAULT 0,
    unit TEXT DEFAULT 'PCS',
    rate DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    "discountType" TEXT DEFAULT 'FLAT' CHECK ("discountType" IN ('PERCENTAGE','FLAT')),
    "sortOrder" INTEGER DEFAULT 0
);

-- ==============================================================================
-- 7. GST RETURN — Plan §GST Compliance
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."GSTReturn" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    "returnType" TEXT NOT NULL CHECK ("returnType" IN ('GSTR1','GSTR3B','CMP08','GSTR9')),
    period TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','GENERATED','FILED','ERROR')),
    "filingDate" TIMESTAMP WITH TIME ZONE,
    "ackNumber" TEXT,
    "jsonData" JSONB,
    "errorLog" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. E-INVOICE — Plan §GST Compliance
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."EInvoice" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "voucherId" TEXT REFERENCES public."Voucher"(id) ON DELETE CASCADE,
    irn TEXT UNIQUE,
    "ackNumber" TEXT,
    "ackDate" TIMESTAMP WITH TIME ZONE,
    "signedInvoice" TEXT,
    "qrCodeData" TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','GENERATED','CANCELLED')),
    "cancelReason" TEXT,
    "cancelDate" TIMESTAMP WITH TIME ZONE,
    "jsonPayload" JSONB,
    "responseData" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. E-WAY BILL — Plan §GST Compliance
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."EWayBill" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "voucherId" TEXT REFERENCES public."Voucher"(id) ON DELETE CASCADE,
    "ewbNumber" TEXT UNIQUE,
    "ewbDate" TIMESTAMP WITH TIME ZONE,
    "validUntil" TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'GENERATED' CHECK (status IN ('GENERATED','EXTENDED','CANCELLED')),
    "transporterName" TEXT DEFAULT '',
    "transporterId" TEXT DEFAULT '',
    "vehicleNumber" TEXT DEFAULT '',
    "transportMode" TEXT DEFAULT 'ROAD' CHECK ("transportMode" IN ('ROAD','RAIL','AIR','SHIP')),
    distance INTEGER DEFAULT 0,
    "fromAddress" TEXT DEFAULT '',
    "toAddress" TEXT DEFAULT '',
    "partBUpdated" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. BANK ACCOUNT — Plan §Banking
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."BankAccount" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    "ledgerId" TEXT REFERENCES public."Ledger"(id),
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT DEFAULT '',
    "branchName" TEXT DEFAULT '',
    "accountType" TEXT DEFAULT 'CURRENT' CHECK ("accountType" IN ('CURRENT','SAVINGS','OD','CC')),
    "openingBalance" DECIMAL(14,2) DEFAULT 0,
    "currentBalance" DECIMAL(14,2) DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. BANK STATEMENT — Plan §Banking
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."BankStatement" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "bankAccountId" TEXT REFERENCES public."BankAccount"(id) ON DELETE CASCADE,
    "txnDate" DATE NOT NULL,
    description TEXT DEFAULT '',
    reference TEXT DEFAULT '',
    "debitAmount" DECIMAL(14,2) DEFAULT 0,
    "creditAmount" DECIMAL(14,2) DEFAULT 0,
    balance DECIMAL(14,2) DEFAULT 0,
    "isReconciled" BOOLEAN DEFAULT false,
    "matchedVoucherId" TEXT REFERENCES public."Voucher"(id),
    "importBatch" TEXT DEFAULT '',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 12. TDS ENTRY — Plan §TDS/TCS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."TDSEntry" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "voucherId" TEXT REFERENCES public."Voucher"(id) ON DELETE CASCADE,
    "partyLedgerId" TEXT REFERENCES public."Ledger"(id),
    section TEXT NOT NULL,
    "tdsRate" DECIMAL(5,2) DEFAULT 0,
    "tdsAmount" DECIMAL(12,2) DEFAULT 0,
    "panNumber" TEXT DEFAULT '',
    "tanNumber" TEXT DEFAULT '',
    "certificateNo" TEXT DEFAULT '',
    "depositDate" DATE,
    "challanNo" TEXT DEFAULT '',
    status TEXT DEFAULT 'DEDUCTED' CHECK (status IN ('DEDUCTED','DEPOSITED','FILED')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 13. PRODUCT (Inventory) — Plan §Inventory
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."Product" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    sku TEXT DEFAULT '',
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    unit TEXT DEFAULT 'PCS',
    "hsnCode" TEXT DEFAULT '',
    "sacCode" TEXT DEFAULT '',
    "purchaseRate" DECIMAL(12,2) DEFAULT 0,
    "sellingRate" DECIMAL(12,2) DEFAULT 0,
    mrp DECIMAL(12,2) DEFAULT 0,
    "gstRate" DECIMAL(5,2) DEFAULT 0,
    "cessRate" DECIMAL(5,2) DEFAULT 0,
    "stockQty" DECIMAL(10,3) DEFAULT 0,
    "minStockLevel" DECIMAL(10,3) DEFAULT 0,
    "batchTracking" BOOLEAN DEFAULT false,
    "expiryTracking" BOOLEAN DEFAULT false,
    "barcodeNo" TEXT DEFAULT '',
    "godownId" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "syncedFromERP" BOOLEAN DEFAULT false,
    "erpProductId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 14. GODOWN (Warehouse) — Plan §Inventory
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."Godown" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT DEFAULT '',
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add FK from Product to Godown after Godown exists
ALTER TABLE public."Product" ADD CONSTRAINT fk_product_godown
    FOREIGN KEY ("godownId") REFERENCES public."Godown"(id) ON DELETE SET NULL;

-- ==============================================================================
-- 15. STOCK JOURNAL — Plan §Inventory
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."StockJournal" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('TRANSFER','ADJUSTMENT','MANUFACTURING')),
    "sourceGodownId" TEXT REFERENCES public."Godown"(id),
    "destGodownId" TEXT REFERENCES public."Godown"(id),
    "productId" TEXT REFERENCES public."Product"(id),
    quantity DECIMAL(10,3) DEFAULT 0,
    notes TEXT DEFAULT '',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 16. EMPLOYEE — Plan §Payroll
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."Employee" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    designation TEXT DEFAULT '',
    department TEXT DEFAULT '',
    "joinDate" DATE,
    "panNumber" TEXT DEFAULT '',
    "aadharNumber" TEXT DEFAULT '',
    "bankAccountNo" TEXT DEFAULT '',
    "ifscCode" TEXT DEFAULT '',
    "basicSalary" DECIMAL(12,2) DEFAULT 0,
    hra DECIMAL(12,2) DEFAULT 0,
    da DECIMAL(12,2) DEFAULT 0,
    "otherAllowance" DECIMAL(12,2) DEFAULT 0,
    pf BOOLEAN DEFAULT false,
    esi BOOLEAN DEFAULT false,
    "professionalTax" BOOLEAN DEFAULT false,
    "tdsRate" DECIMAL(5,2) DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 17. PAY SLIP — Plan §Payroll
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."PaySlip" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    "employeeId" TEXT REFERENCES public."Employee"(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    "basicSalary" DECIMAL(12,2) DEFAULT 0,
    hra DECIMAL(12,2) DEFAULT 0,
    da DECIMAL(12,2) DEFAULT 0,
    "otherAllowance" DECIMAL(12,2) DEFAULT 0,
    "grossSalary" DECIMAL(12,2) DEFAULT 0,
    "pfDeduction" DECIMAL(12,2) DEFAULT 0,
    "esiDeduction" DECIMAL(12,2) DEFAULT 0,
    "ptDeduction" DECIMAL(12,2) DEFAULT 0,
    "tdsDeducted" DECIMAL(12,2) DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) DEFAULT 0,
    "netSalary" DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','PAID')),
    "paidDate" DATE,
    "voucherId" TEXT REFERENCES public."Voucher"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 18. AI CONVERSATION — Plan §AI Features
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."AIConversation" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    "userId" TEXT,
    messages JSONB DEFAULT '[]'::jsonb,
    context JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 19. AI INSIGHT — Plan §AI Features
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."AIInsight" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    "insightType" TEXT NOT NULL CHECK ("insightType" IN ('ANOMALY','SUGGESTION','FORECAST','ALERT')),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    severity TEXT DEFAULT 'LOW' CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    data JSONB DEFAULT '{}'::jsonb,
    "isRead" BOOLEAN DEFAULT false,
    "isDismissed" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 20. LICENSE — Plan §License Key System
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."License" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "licenseKey" TEXT UNIQUE NOT NULL,
    "planType" TEXT DEFAULT 'PROFESSIONAL' CHECK ("planType" IN ('STARTER','PROFESSIONAL','ENTERPRISE')),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','SUSPENDED','REVOKED')),
    "activatedAt" TIMESTAMP WITH TIME ZONE,
    "expiryDate" TIMESTAMP WITH TIME ZONE,
    "lastVerified" TIMESTAMP WITH TIME ZONE,
    "machineId" TEXT,
    "maxCompanies" INTEGER DEFAULT 1,
    "maxUsers" INTEGER DEFAULT 3,
    "isVaahanERPUser" BOOLEAN DEFAULT false,
    "purchaseOrderId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 21. LICENSE LOG — Plan §License Key System
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."LicenseLog" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "licenseId" TEXT REFERENCES public."License"(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('ACTIVATED','VERIFIED','EXPIRED','RENEWED','SUSPENDED','REVOKED','MACHINE_CHANGED')),
    "oldMachineId" TEXT,
    "newMachineId" TEXT,
    "ipAddress" TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 22. SYNC CONFLICT LOG — Plan §Conflict Resolution
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."SyncConflict" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "localData" JSONB,
    "cloudData" JSONB,
    "conflictType" TEXT DEFAULT 'EDIT' CHECK ("conflictType" IN ('EDIT','DELETE')),
    resolution TEXT DEFAULT 'PENDING' CHECK (resolution IN ('PENDING','LOCAL','CLOUD','MANUAL')),
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 23. BACKUP LOG — Plan §Module 11 Backup & Recovery
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public."BackupLog" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "tenantId" TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    "companyId" TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    "backupType" TEXT NOT NULL CHECK ("backupType" IN ('AUTO','MANUAL','CLOUD','PENDRIVE')),
    "filePath" TEXT DEFAULT '',
    "fileSize" BIGINT DEFAULT 0,
    checksum TEXT DEFAULT '',
    status TEXT DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','IN_PROGRESS')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================
ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AccountGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Voucher" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VoucherItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GSTReturn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EWayBill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BankAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BankStatement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TDSEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Godown" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StockJournal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PaySlip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."License" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LicenseLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyncConflict" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BackupLog" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES — Service role can access all, anon can read License for validation
-- ==============================================================================

-- Allow service_role full access (used by portal API)
CREATE POLICY "Service role full access" ON public."License"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public."LicenseLog"
    FOR ALL USING (true) WITH CHECK (true);

-- Allow anon to validate license keys (desktop app calls this)
CREATE POLICY "Anon can validate license" ON public."License"
    FOR SELECT USING (true);

-- ==============================================================================
-- INDEXES for performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_voucher_tenant ON public."Voucher"("tenantId");
CREATE INDEX IF NOT EXISTS idx_voucher_company ON public."Voucher"("companyId");
CREATE INDEX IF NOT EXISTS idx_voucher_date ON public."Voucher"("voucherDate");
CREATE INDEX IF NOT EXISTS idx_voucher_type ON public."Voucher"("voucherType");
CREATE INDEX IF NOT EXISTS idx_voucher_number ON public."Voucher"("voucherNumber");
CREATE INDEX IF NOT EXISTS idx_ledger_tenant ON public."Ledger"("tenantId");
CREATE INDEX IF NOT EXISTS idx_ledger_company ON public."Ledger"("companyId");
CREATE INDEX IF NOT EXISTS idx_ledger_group ON public."Ledger"("accountGroupId");
CREATE INDEX IF NOT EXISTS idx_voucheritem_voucher ON public."VoucherItem"("voucherId");
CREATE INDEX IF NOT EXISTS idx_product_tenant ON public."Product"("tenantId");
CREATE INDEX IF NOT EXISTS idx_product_barcode ON public."Product"("barcodeNo");
CREATE INDEX IF NOT EXISTS idx_license_key ON public."License"("licenseKey");
CREATE INDEX IF NOT EXISTS idx_license_tenant ON public."License"("tenantId");
CREATE INDEX IF NOT EXISTS idx_employee_tenant ON public."Employee"("tenantId");
CREATE INDEX IF NOT EXISTS idx_bankaccount_tenant ON public."BankAccount"("tenantId");
CREATE INDEX IF NOT EXISTS idx_gstreturn_tenant ON public."GSTReturn"("tenantId");
CREATE INDEX IF NOT EXISTS idx_gstreturn_period ON public."GSTReturn"(period);
