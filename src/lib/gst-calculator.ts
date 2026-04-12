import { Decimal } from 'decimal.js';

export type GSTState = 'INTRA_STATE' | 'INTER_STATE' | 'EXPORT';

export interface InvoiceItem {
  id?: string;
  name: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  discount: number;
  gstRate: number;    // e.g. 18
  cessRate?: number;  // e.g. 0
}

export interface CalculatedItem extends InvoiceItem {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number;
  errors: GSTError[];
}

export interface GSTError {
  code: string;
  message: string;
  suggestion?: string;
}

export class GSTCalculator {
  /**
   * Calculates taxes for a given invoice item
   */
  static calculateItemAmounts(item: InvoiceItem, supplyState: GSTState): CalculatedItem {
    let errors: GSTError[] = [];

    // Rule-based validations (GST Error Auto-fix capability)
    if (!item.hsnCode || item.hsnCode.length < 4) {
      errors.push({
        code: 'MISSING_HSN',
        message: 'HSN/SAC code is missing or too short.',
        suggestion: 'Items should have at least a 4-digit HSN code for GST compliance.'
      });
    }

    if (item.gstRate !== 0 && item.gstRate !== 5 && item.gstRate !== 12 && item.gstRate !== 18 && item.gstRate !== 28) {
      errors.push({
        code: 'INVALID_RATE',
        message: `Invalid GST Rate: ${item.gstRate}%`,
        suggestion: 'Standard GST rates are 0%, 5%, 12%, 18%, or 28%.'
      });
    }

    // High precision calculations using decimal.js to entirely avoid floating point issues
    const qty = new Decimal(item.quantity);
    const rate = new Decimal(item.rate);
    const discount = new Decimal(item.discount);
    
    // Amount before tax = (qty * rate) - discount
    const initialAmount = qty.times(rate);
    const taxableAmount = initialAmount.minus(discount);

    // GST Values
    let cgstAmount = new Decimal(0);
    let sgstAmount = new Decimal(0);
    let igstAmount = new Decimal(0);
    
    const gstRateDec = new Decimal(item.gstRate).dividedBy(100);
    const cessRateDec = new Decimal(item.cessRate || 0).dividedBy(100);

    const totalTaxAmount = taxableAmount.times(gstRateDec);
    const cessAmount = taxableAmount.times(cessRateDec);

    if (supplyState === 'INTRA_STATE') {
      // Intra-state (Within state)
      cgstAmount = totalTaxAmount.dividedBy(2);
      sgstAmount = totalTaxAmount.dividedBy(2);
    } else if (supplyState === 'INTER_STATE') {
      // Inter-state (Outside state)
      igstAmount = totalTaxAmount;
    }

    const totalAmount = taxableAmount.plus(totalTaxAmount).plus(cessAmount);

    return {
      ...item,
      taxableAmount: taxableAmount.toDP(2).toNumber(),
      cgstAmount: cgstAmount.toDP(2).toNumber(),
      sgstAmount: sgstAmount.toDP(2).toNumber(),
      igstAmount: igstAmount.toDP(2).toNumber(),
      cessAmount: cessAmount.toDP(2).toNumber(),
      totalAmount: totalAmount.toDP(2).toNumber(),
      errors,
    };
  }

  /**
   * Calculates totals for the entire invoice
   */
  static calculateInvoiceTotal(items: CalculatedItem[]) {
    return items.reduce((acc, item) => ({
      totalTaxable: new Decimal(acc.totalTaxable).plus(item.taxableAmount).toNumber(),
      totalCGST: new Decimal(acc.totalCGST).plus(item.cgstAmount).toNumber(),
      totalSGST: new Decimal(acc.totalSGST).plus(item.sgstAmount).toNumber(),
      totalIGST: new Decimal(acc.totalIGST).plus(item.igstAmount).toNumber(),
      totalCess: new Decimal(acc.totalCess).plus(item.cessAmount).toNumber(),
      grandTotal: new Decimal(acc.grandTotal).plus(item.totalAmount).toNumber()
    }), {
      totalTaxable: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCess: 0,
      grandTotal: 0
    });
  }

  static suggestGSTState(companyStateCode: string, partyStateCode?: string): GSTState {
    if (!partyStateCode) return 'INTRA_STATE'; // Cash sales commonly assume intra-state if unregistered
    return (companyStateCode === partyStateCode) ? 'INTRA_STATE' : 'INTER_STATE';
  }
}
