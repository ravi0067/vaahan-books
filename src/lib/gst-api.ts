export interface GSPResponse {
  success: boolean;
  data?: any;
  error?: string;
  irn?: string;
  signedQrCode?: string;
  ackNo?: string;
  ackDate?: string;
}

/**
 * GST API Wrapper handling GSP integration (ClearTax / MastersIndia)
 * Using a mock system for development since direct NIC API needs approval.
 */
export class GSTApi {
  private static MOCK_MODE = true; // Use mock mode for Phase 4 testing
  private static API_KEY = process.env.VITE_GSP_API_KEY || 'test_key';

  /**
   * Generates E-Invoice via GSP
   */
  static async generateEInvoice(invoiceData: any): Promise<GSPResponse> {
    if (this.MOCK_MODE) {
      console.log('Mocking E-Invoice Generation via ClearTax GSP...', invoiceData);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        success: true,
        irn: 'e0d7c71e2efde0c2dc4b1b3b1abefb6d9be70de0fac72b83eb1de18f8d672809',
        signedQrCode: 'eyJhbGciOiJSUzI1NiJ9.eyJkYXRhIjoiTU9DS19RUl9DT0RFIiwiZXhwIjoxNjkxMjM0NTY3fQ.signature...',
        ackNo: '182312345678',
        ackDate: new Date().toISOString()
      };
    }
    
    // Real Integration logic
    try {
      const response = await fetch('https://api.cleartax.in/e-invoice/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'gstin': invoiceData.companyGstin
        },
        body: JSON.stringify(invoiceData)
      });
      return await response.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Pushes GSTR-1 Data to GSP
   */
  static async pushGSTR1(month: string, year: string, b2bInvoices: any[], b2cInvoices: any[], hsnSummary: any[]): Promise<GSPResponse> {
    const payload = {
      period: `${month}${year}`,
      b2b: b2bInvoices,
      b2cs: b2cInvoices,
      hsn: hsnSummary
    };

    if (this.MOCK_MODE) {
      console.log('Mocking GSTR-1 Upload...', payload);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        success: true,
        data: {
          referenceId: 'REF-GSTR1-998877',
          message: 'GSTR-1 JSON successfully validated and saved at GSTN.'
        }
      };
    }

    return { success: false, error: 'Production GSP not configured' };
  }

  /**
   * Generates E-Way Bill
   */
  static async generateEWayBill(transportData: any, irn?: string): Promise<GSPResponse> {
    if (this.MOCK_MODE) {
      console.log('Mocking E-Way Bill Generation...', transportData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        data: {
          ewayBillNo: '191028374655',
          validUpto: new Date(Date.now() + 86400000).toISOString()
        }
      };
    }
    return { success: false, error: 'Production GSP not configured' };
  }
}
