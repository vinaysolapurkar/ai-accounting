/**
 * LedgerAI Tax Engine - United Kingdom (VAT).
 *
 * VAT rates:
 *   Standard  – 20 %
 *   Reduced   –  5 %  (e.g. domestic fuel, child car seats)
 *   Zero-rated – 0 %  (e.g. most food, children's clothing, books)
 */

import {
  TaxEngine,
  TaxRate,
  TaxResult,
  TaxLineItem,
  TaxReport,
  COAEntry,
  TaxCategory,
  roundMoney,
  buildTaxResult,
} from "./base";

// ---------------------------------------------------------------------------
// Rate definitions
// ---------------------------------------------------------------------------

const VAT_RATES: Record<string, { label: string; rate: number }> = {
  standard: { label: "Standard Rate VAT", rate: 20 },
  reduced: { label: "Reduced Rate VAT", rate: 5 },
  zero: { label: "Zero-Rated VAT", rate: 0 },
  exempt: { label: "VAT Exempt", rate: 0 },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class UnitedKingdomTaxEngine implements TaxEngine {
  readonly countryCode = "GB";
  readonly currency = "GBP";
  readonly displayName = "United Kingdom";

  calculateTax(amount: number, category: TaxCategory, _stateProvince?: string): TaxResult {
    const info = VAT_RATES[category] ?? VAT_RATES.standard;
    const lineItems: TaxLineItem[] = [];

    if (info.rate > 0) {
      lineItems.push({
        label: info.label,
        rate: info.rate,
        amount: roundMoney(amount * info.rate / 100),
      });
    }

    return buildTaxResult(amount, lineItems, category, this.currency);
  }

  getTaxRates(): TaxRate[] {
    return Object.entries(VAT_RATES).map(([key, info]) => ({
      label: info.label,
      category: key,
      rate: info.rate,
    }));
  }

  getDefaultCOA(): COAEntry[] {
    return [
      { code: "1000", name: "Cash at Bank", type: "asset" },
      { code: "1001", name: "Petty Cash", type: "asset" },
      { code: "1100", name: "Trade Debtors", type: "asset" },
      { code: "1200", name: "Stock", type: "asset" },
      { code: "1300", name: "Prepayments", type: "asset" },
      { code: "1500", name: "Tangible Fixed Assets", type: "asset" },
      { code: "2000", name: "Trade Creditors", type: "liability" },
      { code: "2100", name: "VAT Output (Payable)", type: "liability", description: "VAT collected on sales" },
      { code: "2101", name: "VAT Input (Reclaimable)", type: "asset", description: "VAT paid on purchases" },
      { code: "2200", name: "PAYE / NI Payable", type: "liability" },
      { code: "2300", name: "Corporation Tax Payable", type: "liability" },
      { code: "2400", name: "Accruals", type: "liability" },
      { code: "3000", name: "Share Capital", type: "equity" },
      { code: "3100", name: "Retained Profits", type: "equity" },
      { code: "4000", name: "Sales", type: "revenue" },
      { code: "4100", name: "Other Income", type: "revenue" },
      { code: "5000", name: "Cost of Sales", type: "expense" },
      { code: "5100", name: "Wages and Salaries", type: "expense" },
      { code: "5200", name: "Employer's NI Contributions", type: "expense" },
      { code: "5300", name: "Rent", type: "expense" },
      { code: "5400", name: "Rates", type: "expense" },
      { code: "5500", name: "Light and Heat", type: "expense" },
      { code: "5600", name: "Insurance", type: "expense" },
      { code: "5700", name: "Depreciation", type: "expense" },
      { code: "5800", name: "Professional Fees", type: "expense" },
      { code: "5900", name: "Stationery and Printing", type: "expense" },
    ];
  }

  formatTaxReport(results: TaxResult[]): TaxReport {
    let totalNet = 0;
    let totalVAT = 0;
    const byRate: Record<string, number> = {};

    for (const r of results) {
      totalNet += r.netAmount;
      totalVAT += r.taxAmount;
      for (const li of r.lineItems) {
        const key = `${li.rate} %`;
        byRate[key] = (byRate[key] ?? 0) + li.amount;
      }
    }

    return {
      title: "UK VAT Summary",
      country: this.countryCode,
      currency: this.currency,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          heading: "Overview",
          rows: [
            { label: "Total Transactions", value: results.length },
            { label: "Total Net Sales", value: roundMoney(totalNet) },
            { label: "Total VAT", value: roundMoney(totalVAT) },
            { label: "Total Gross", value: roundMoney(totalNet + totalVAT) },
          ],
        },
        {
          heading: "VAT by Rate",
          rows: Object.entries(byRate).map(([label, value]) => ({
            label,
            value: roundMoney(value),
          })),
        },
      ],
    };
  }
}
