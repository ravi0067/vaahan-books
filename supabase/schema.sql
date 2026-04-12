-- ==============================================================================
-- VAAHAN BOOKS - SUPABASE CLOUD SYNC SCHEMA (PostgreSQL)
-- Execute this file in the Supabase SQL Editor.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANT (Shared with VaahanERP)
CREATE TABLE IF NOT EXISTS public."Tenant" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. COMPANY (Multi-company support)
CREATE TABLE IF NOT EXISTS public."Company" (
    id TEXT PRIMARY KEY,
    tenantId TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
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
    financialYearStart INTEGER DEFAULT 4,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ACCOUNT GROUP (Chart of Accounts hierarchy)
CREATE TABLE IF NOT EXISTS public."AccountGroup" (
    id TEXT PRIMARY KEY,
    tenantId TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    companyId TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parentId TEXT REFERENCES public."AccountGroup"(id),
    nature TEXT NOT NULL CHECK (nature IN ('ASSETS','LIABILITIES','INCOME','EXPENSE')),
    isSystem BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. LEDGER
CREATE TABLE IF NOT EXISTS public."Ledger" (
    id TEXT PRIMARY KEY,
    tenantId TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    companyId TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    accountGroupId TEXT REFERENCES public."AccountGroup"(id),
    openingBalance DECIMAL(14,2) DEFAULT 0,
    currentBalance DECIMAL(14,2) DEFAULT 0,
    balanceType TEXT DEFAULT 'DEBIT' CHECK (balanceType IN ('DEBIT','CREDIT')),
    gstin TEXT DEFAULT '',
    panNumber TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    creditLimit DECIMAL(14,2) DEFAULT 0,
    creditPeriod INTEGER DEFAULT 0,
    ledgerType TEXT DEFAULT 'PARTY',
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. VOUCHER (Master transaction)
CREATE TABLE IF NOT EXISTS public."Voucher" (
    id TEXT PRIMARY KEY,
    tenantId TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    companyId TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    voucherNumber TEXT NOT NULL,
    voucherDate DATE NOT NULL,
    voucherType TEXT NOT NULL,
    partyLedgerId TEXT REFERENCES public."Ledger"(id),
    narration TEXT DEFAULT '',
    totalAmount DECIMAL(14,2) DEFAULT 0,
    status TEXT DEFAULT 'DRAFT',
    referenceNo TEXT DEFAULT '',
    placeOfSupply TEXT DEFAULT '',
    isInterState BOOLEAN DEFAULT false,
    reverseCharge BOOLEAN DEFAULT false,
    gstTreatment TEXT DEFAULT 'REGISTERED',
    sourceSystem TEXT,
    sourceId TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. VOUCHER ITEM
CREATE TABLE IF NOT EXISTS public."VoucherItem" (
    id TEXT PRIMARY KEY,
    tenantId TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    voucherId TEXT REFERENCES public."Voucher"(id) ON DELETE CASCADE,
    ledgerId TEXT REFERENCES public."Ledger"(id),
    amount DECIMAL(14,2) DEFAULT 0,
    isDebit BOOLEAN DEFAULT true,
    description TEXT DEFAULT '',
    hsnCode TEXT DEFAULT '',
    sacCode TEXT DEFAULT '',
    gstRate DECIMAL(5,2) DEFAULT 0,
    cgst DECIMAL(12,2) DEFAULT 0,
    sgst DECIMAL(12,2) DEFAULT 0,
    igst DECIMAL(12,2) DEFAULT 0,
    cess DECIMAL(12,2) DEFAULT 0,
    taxableAmount DECIMAL(14,2) DEFAULT 0,
    quantity DECIMAL(10,3) DEFAULT 0,
    unit TEXT DEFAULT 'PCS',
    rate DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    discountType TEXT DEFAULT 'FLAT',
    sortOrder INTEGER DEFAULT 0
);

-- 7. PRODUCT (Inventory)
CREATE TABLE IF NOT EXISTS public."Product" (
    id TEXT PRIMARY KEY,
    tenantId TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    companyId TEXT REFERENCES public."Company"(id) ON DELETE CASCADE,
    sku TEXT DEFAULT '',
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    unit TEXT DEFAULT 'PCS',
    hsnCode TEXT DEFAULT '',
    sacCode TEXT DEFAULT '',
    purchaseRate DECIMAL(12,2) DEFAULT 0,
    sellingRate DECIMAL(12,2) DEFAULT 0,
    mrp DECIMAL(12,2) DEFAULT 0,
    gstRate DECIMAL(5,2) DEFAULT 0,
    cessRate DECIMAL(5,2) DEFAULT 0,
    stockQty DECIMAL(10,3) DEFAULT 0,
    minStockLevel DECIMAL(10,3) DEFAULT 0,
    barcodeNo TEXT DEFAULT '',
    isActive BOOLEAN DEFAULT true,
    syncedFromERP BOOLEAN DEFAULT false,
    erpProductId TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. SYNC CONFLICT LOG
CREATE TABLE IF NOT EXISTS public."SyncConflict" (
    id TEXT PRIMARY KEY,
    tenantId TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    tableName TEXT NOT NULL,
    recordId TEXT NOT NULL,
    localData JSONB,
    cloudData JSONB,
    conflictType TEXT DEFAULT 'EDIT',
    resolution TEXT DEFAULT 'PENDING',
    resolvedById TEXT,
    resolvedAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. LICENSE (Cross-platform)
CREATE TABLE IF NOT EXISTS public."License" (
    id TEXT PRIMARY KEY,
    tenantId TEXT REFERENCES public."Tenant"(id) ON DELETE CASCADE,
    licenseKey TEXT UNIQUE NOT NULL,
    planType TEXT DEFAULT 'PROFESSIONAL',
    status TEXT DEFAULT 'ACTIVE',
    activatedAt TIMESTAMP WITH TIME ZONE,
    expiryDate TIMESTAMP WITH TIME ZONE,
    lastVerified TIMESTAMP WITH TIME ZONE,
    machineId TEXT,
    maxCompanies INTEGER DEFAULT 1,
    maxUsers INTEGER DEFAULT 3,
    purchaseOrderId TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ADD SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AccountGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Voucher" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VoucherItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyncConflict" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."License" ENABLE ROW LEVEL SECURITY;

-- Expose via RLS to authenticated users reading their tenant only
-- (Requires Supabase auth system setup linked to tenantId)
