/**
 * LedgerAI Tax Engine - New Zealand (GST).
 *
 * New Zealand GST is a flat 15 % on most goods and services.
 * Some supplies are zero-rated (exports, sale of a going concern) or
 * exempt (financial services, residential rent).
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
  standard: { label: "GST", rate: 15 },
  zero: { label: "Zero-Rated", rate: 0 },
  exempt: { label: "GST Exempt", rate: 0 },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class NewZealandTaxEngine implements TaxEngine {
  readonly countryCode = "NZ";
  readonly currency = "NZD";
  readonly displayName = "New Zealand";

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
      { code: "1000", name: "Bank Account", type: "asset" },
      { code: "1100", name: "Accounts Receivable", type: "asset" },
      { code: "1200", name: "Inventory", type: "asset" },
      { code: "1300", name: "Prepayments", type: "asset" },
      { code: "1500", name: "Fixed Assets", type: "asset" },
      { code: "1510", name: "Accumulated Depreciation", type: "asset" },
      { code: "2000", name: "Accounts Payable", type: "liability" },
      { code: "2100", name: "GST Output", type: "liability", description: "GST collected on sales" },
      { code: "2101", name: "GST Input", type: "asset", description: "GST paid on purchases" },
      { code: "2200", name: "PAYE Payable", type: "liability" },
      { code: "2300", name: "KiwiSaver Payable", type: "liability" },
      { code: "2400", name: "Provision for Income Tax", type: "liability" },
      { code: "3000", name: "Owner's Equity", type: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity" },
      { code: "4000", name: "Sales", type: "revenue" },
      { code: "4100", name: "Service Revenue", type: "revenue" },
      { code: "4200", name: "Interest Income", type: "revenue" },
      { code: "5000", name: "Cost of Goods Sold", type: "expense" },
      { code: "5100", name: "Wages and Salaries", type: "expense" },
      { code: "5200", name: "KiwiSaver Employer Contribution", type: "expense" },
      { code: "5300", name: "Rent", type: "expense" },
      { code: "5400", name: "Utilities", type: "expense" },
      { code: "5500", name: "Depreciation", type: "expense" },
      { code: "5600", name: "Insurance", type: "expense" },
      { code: "5700", name: "ACC Levies", type: "expense" },
      { code: "5800", name: "Accounting and Legal Fees", type: "expense" },
    ];
  }

  formatTaxReport(results: TaxResult[]): TaxReport {
    let totalNet = 0;
    let totalGST = 0;

    for (const r of results) {
      totalNet += r.netAmount;
      totalGST += r.taxAmount;
    }

    return {
      title: "New Zealand GST Return Summary",
      country: this.countryCode,
      currency: this.currency,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          heading: "Overview",
          rows: [
            { label: "Total Transactions", value: results.length },
            { label: "Total Sales (excl. GST)", value: roundMoney(totalNet) },
            { label: "Total GST Collected", value: roundMoney(totalGST) },
            { label: "Total Sales (incl. GST)", value: roundMoney(totalNet + totalGST) },
          ],
        },
      ],
    };
  }
}
