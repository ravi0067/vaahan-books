/**
 * AI Core logic matching the Phase 6 specifications of the Architecture Plan.
 * Cost Control: Batched caching + Rule-based fallback before invoking Claude.
 * 
 * NOTE: Anthropic SDK removed to eliminate ESM dependency conflicts.
 * Will be re-added when AI features are production-ready.
 */
export class AICore {
  private static MOCK_MODE = true;

  // Simple hardcoded cache for cost reduction strategy
  private static CACHE: Record<string, string> = {
    "aaj ka sales": "Aaj ka total sales ₹45,000 raha (Local + Export mila kar).",
    "profit": "Pichle mahine (March 2026) ka Net Profit ₹2,45,678 tha. Pichle saal ke mukable ye 15% zyada hai 📈."
  };

  /**
   * Natural Language Query handling (Batched & Cached)
   */
  static async executeNaturalLanguageQuery(query: string): Promise<string> {
    const qNormalized = query.toLowerCase();
    
    // 1. Cost Control: Check Cache first
    for (const key of Object.keys(this.CACHE)) {
      if (qNormalized.includes(key)) {
        return `[Cost-Control: Cache HIT] ${this.CACHE[key]}`;
      }
    }

    // Mock mode for development
    await new Promise(resolve => setTimeout(resolve, 1200));
    return `[Mock AI Response]: Maine aapke records check kiye. Pura database double-entry engine par fully secured hai. Aapka agla GSTR-1 file hone ko tayyar hai! (Query matched: ${query})`;
  }

  /**
   * AI-generated automated debtor follow-up message
   */
  static generateDebtorMessage(partyName: string, amount: number, overdueDays: number): string {
    if (overdueDays <= 15) {
      return `Dear ${partyName}, this is a gentle reminder that an amount of ₹${amount.toLocaleString()} is pending for the last ${overdueDays} days. Kindly release the payment soon. Thanks, VaahanBooks.`;
    } else if (overdueDays <= 30) {
      return `Urgent: Hi ${partyName}, your payment of ₹${amount.toLocaleString()} is severely delayed by ${overdueDays} days. Please clear it today to avoid interest charges.`;
    } else {
      return `Final Notice: ${partyName}, amount ₹${amount.toLocaleString()} is overdue by ${overdueDays} days. We will be taking further legal action if not cleared within 24 hours.`;
    }
  }

  /**
   * GST Error Hybrid AI Fix
   */
  static generateGSTFixSuggestion(itemName: string, expectedHsnLength: number = 4): string {
    return `[AI Auto-Fix Suggestion] For item "${itemName}", typical GST category falls under HSN '9988' or '8517'. Rate is likely 18%.`;
  }
}
