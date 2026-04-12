import { Decimal } from 'decimal.js';

export type VoucherType = 'SALES' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'CONTRA' | 'JOURNAL' | 'CREDIT_NOTE' | 'DEBIT_NOTE';

export interface Entry {
  ledgerId: string; // The ID of the ledger
  amount: number;
  isDebit: boolean;
}

export interface PostingResult {
  entries: Entry[];
  error?: string;
}

/**
 * Smart Auto Accounting Engine
 * Implements the double-entry accounting rules defined in Phase 2 of the Architecture Plan.
 */
export class AccountingEngine {

  /**
   * Generates double-entry postings automatically based on an invoice or voucher type.
   * "Zero Manual Entry" target: Extracts all the magic of assigning Debits and Credits automatically.
   */
  static generatePostings(
    voucherType: VoucherType, 
    details: {
      partyLedgerId?: string;
      cashBankLedgerId?: string;
      taxableAmount?: number;
      cgstAmount?: number;
      sgstAmount?: number;
      igstAmount?: number;
      totalAmount?: number;
      defaultSalesLedgerId?: string;
      defaultPurchaseLedgerId?: string;
      defaultCgstLedgerId?: string;
      defaultSgstLedgerId?: string;
      defaultIgstLedgerId?: string;
      expenseLedgerId?: string;
    }
  ): PostingResult {
    const entries: Entry[] = [];
    
    try {
      switch (voucherType) {
        
        case 'SALES':
          if (!details.partyLedgerId) throw new Error('Party ledger is required for Sales Invoice');
          if (!details.defaultSalesLedgerId) throw new Error('Sales ledger configuration missing');
          
          // Debit the Party (Buyer owes us money)
          entries.push({ ledgerId: details.partyLedgerId, amount: details.totalAmount || 0, isDebit: true });
          
          // Credit Sales Account (Income)
          entries.push({ ledgerId: details.defaultSalesLedgerId, amount: details.taxableAmount || 0, isDebit: false });
          
          // Credit GST Accounts (Liability to pay government)
          if (details.cgstAmount) entries.push({ ledgerId: details.defaultCgstLedgerId!, amount: details.cgstAmount, isDebit: false });
          if (details.sgstAmount) entries.push({ ledgerId: details.defaultSgstLedgerId!, amount: details.sgstAmount, isDebit: false });
          if (details.igstAmount) entries.push({ ledgerId: details.defaultIgstLedgerId!, amount: details.igstAmount, isDebit: false });
          break;

        case 'PURCHASE':
          if (!details.partyLedgerId) throw new Error('Party ledger is required for Purchase Invoice');
          if (!details.defaultPurchaseLedgerId) throw new Error('Purchase ledger configuration missing');
          
          // Debit Purchase Account (Expense)
          entries.push({ ledgerId: details.defaultPurchaseLedgerId, amount: details.taxableAmount || 0, isDebit: true });
          
          // Debit GST Accounts (Asset/ITC receivable)
          if (details.cgstAmount) entries.push({ ledgerId: details.defaultCgstLedgerId!, amount: details.cgstAmount, isDebit: true });
          if (details.sgstAmount) entries.push({ ledgerId: details.defaultSgstLedgerId!, amount: details.sgstAmount, isDebit: true });
          if (details.igstAmount) entries.push({ ledgerId: details.defaultIgstLedgerId!, amount: details.igstAmount, isDebit: true });

          // Credit the Party (We owe them money)
          entries.push({ ledgerId: details.partyLedgerId, amount: details.totalAmount || 0, isDebit: false });
          break;

        case 'RECEIPT':
          if (!details.partyLedgerId || !details.cashBankLedgerId) throw new Error('Party and Cash/Bank ledgers required');
          
          // Debit Cash/Bank (Money coming in)
          entries.push({ ledgerId: details.cashBankLedgerId, amount: details.totalAmount || 0, isDebit: true });
          // Credit Party (Reducing their due)
          entries.push({ ledgerId: details.partyLedgerId, amount: details.totalAmount || 0, isDebit: false });
          break;

        case 'PAYMENT':
          if (!details.expenseLedgerId && !details.partyLedgerId) throw new Error('Expense/Party ledger required for Payment');
          if (!details.cashBankLedgerId) throw new Error('Cash/Bank ledger required');
          
          // Debit Party/Expense (Reducing our payable or categorizing expense)
          entries.push({ ledgerId: (details.expenseLedgerId || details.partyLedgerId)!, amount: details.totalAmount || 0, isDebit: true });
          // Credit Cash/Bank (Money going out)
          entries.push({ ledgerId: details.cashBankLedgerId, amount: details.totalAmount || 0, isDebit: false });
          break;

        default:
          throw new Error('Unsupported voucher type for auto-accounting');
      }

      // Verify Double Entry rule (Total Debits == Total Credits)
      let totalDebits = new Decimal(0);
      let totalCredits = new Decimal(0);
      
      entries.forEach(e => {
        if (e.isDebit) totalDebits = totalDebits.plus(e.amount);
        else totalCredits = totalCredits.plus(e.amount);
      });

      if (!totalDebits.equals(totalCredits)) {
         throw new Error(`Double-entry mismatch: Debits (${totalDebits.toNumber()}) != Credits (${totalCredits.toNumber()})`);
      }

      return { entries };

    } catch (err: any) {
      return { entries: [], error: err.message };
    }
  }
}
