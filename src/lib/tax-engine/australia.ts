/**
 * LedgerAI Tax Engine - Australia (GST).
 *
 * Australia applies a flat 10 % Goods and Services Tax on most goods and
 * services. Certain items are GST-free (basic food, medical, education,
 * exports) or input-taxed (financial supplies, residential rent).
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

const GST_RATES: Record<string, { label: string; rate: number }> = {
  standard: { label: "GST", rate: 10 },
  "gst-free": { label: "GST-Free", rate: 0 },
  "input-taxed": { label: "Input Taxed", rate: 0 },
  exempt: { label: "GST Exempt", rate: 0 },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class AustraliaTaxEngine implements TaxEngine {
  readonly countryCode = "AU";
  readonly currency = "AUD";
  readonly displayName = "Australia";

  calculateTax(amount: number, category: TaxCategory, _stateProvince?: string): TaxResult {
    const info = GST_RATES[category] ?? GST_RATES.standard;
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
    return Object.entries(GST_RATES).map(([key, info]) => ({
      label: info.label,
      category: key,
      rate: info.rate,
    }));
  }

  getDefaultCOA(): COAEntry[] {
    return [
      { code: "1-1000", name: "Cash at Bank", type: "asset" },
      { code: "1-1001", name: "Petty Cash", type: "asset" },
      { code: "1-1100", name: "Trade Debtors", type: "asset" },
      { code: "1-1200", name: "Inventory", type: "asset" },
      { code: "1-1300", name: "Prepayments", type: "asset" },
      { code: "1-1500", name: "Plant and Equipment", type: "asset" },
      { code: "1-1510", name: "Accumulated Depreciation", type: "asset" },
      { code: "2-2000", name: "Trade Creditors", type: "liability" },
      { code: "2-2100", name: "GST Collected", type: "liability", description: "GST on sales" },
      { code: "2-2101", name: "GST Paid", type: "asset", description: "GST on purchases (input credits)" },
      { code: "2-2200", name: "PAYG Withholding Payable", type: "liability" },
      { code: "2-2300", name: "Superannuation Payable", type: "liability" },
      { code: "2-2400", name: "Provision for Income Tax", type: "liability" },
      { code: "3-3000", name: "Owners Equity", type: "equity" },
      { code: "3-3100", name: "Retained Earnings", type: "equity" },
      { code: "4-4000", name: "Sales", type: "revenue" },
      { code: "4-4100", name: "Service Revenue", type: "revenue" },
      { code: "4-4200", name: "Interest Received", type: "revenue" },
      { code: "5-5000", name: "Cost of Sales", type: "expense" },
      { code: "5-5100", name: "Wages and Salaries", type: "expense" },
      { code: "5-5200", name: "Superannuation", type: "expense" },
      { code: "5-5300", name: "Rent", type: "expense" },
      { code: "5-5400", name: "Utilities", type: "expense" },
      { code: "5-5500", name: "Depreciation", type: "expense" },
      { code: "5-5600", name: "Insurance", type: "expense" },
      { code: "5-5700", name: "Motor Vehicle Expenses", type: "expense" },
      { code: "5-5800", name: "Accounting and Legal Fees", type: "expense" },
    ];
  }

  formatTaxReport(results: TaxResult[]): TaxReport {
    let totalNet = 0;
    let totalGST = 0;

    for (const r of results) {
      totalNet += r.netAmount;
      totalGST += r.taxAmount;
    }

    const gstFreeCount = results.filter((r) => r.appliedCategory === "gst-free").length;
    const inputTaxedCount = results.filter((r) => r.appliedCategory === "input-taxed").length;

    return {
      title: "Australian GST Summary (BAS Helper)",
      country: this.countryCode,
      currency: this.currency,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          heading: "Overview",
          rows: [
            { label: "Total Transactions", value: results.length },
            { label: "Total Net Sales", value: roundMoney(totalNet) },
            { label: "Total GST Collected", value: roundMoney(totalGST) },
            { label: "Total Gross", value: roundMoney(totalNet + totalGST) },
          ],
        },
        {
          heading: "Category Breakdown",
          rows: [
            { label: "GST-Free Transactions", value: gstFreeCount },
            { label: "Input-Taxed Transactions", value: inputTaxedCount },
            { label: "Taxable Transactions", value: results.length - gstFreeCount - inputTaxedCount },
          ],
        },
      ],
    };
  }
}
