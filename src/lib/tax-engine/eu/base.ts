/**
 * LedgerAI Tax Engine - EU VAT base.
 *
 * Provides a reusable abstract class for EU member states. Each country
 * supplies its own rate table; the common calculation, reporting and COA
 * logic lives here.
 *
 * Key EU VAT concepts modelled:
 *   - Standard / reduced / super-reduced / parking / zero rates
 *   - Reverse charge flag (for B2B cross-border)
 *   - VAT identification number format hint
 */

import {
  TaxEngine,
  TaxRate,
  TaxResult,
  TaxLineItem,
  TaxReport,
  COAEntry,
  TaxCategory,
  CountryCode,
  CurrencyCode,
  roundMoney,
  buildTaxResult,
} from "../base";

// ---------------------------------------------------------------------------
// EU-specific types
// ---------------------------------------------------------------------------

export interface EUVATRateEntry {
  label: string;
  category: TaxCategory;
  rate: number;
}

export interface EUVATConfig {
  countryCode: CountryCode;
  currency: CurrencyCode;
  displayName: string;
  /** Regex pattern for the country's VAT identification number (without the country prefix). */
  vatNumberPattern?: RegExp;
  rates: EUVATRateEntry[];
}

// ---------------------------------------------------------------------------
// Abstract base engine
// ---------------------------------------------------------------------------

export abstract class EUVATBaseEngine implements TaxEngine {
  readonly countryCode: CountryCode;
  readonly currency: CurrencyCode;
  readonly displayName: string;

  protected readonly rates: EUVATRateEntry[];
  protected readonly rateMap: Map<TaxCategory, EUVATRateEntry>;
  protected readonly vatNumberPattern: RegExp | undefined;

  constructor(config: EUVATConfig) {
    this.countryCode = config.countryCode;
    this.currency = config.currency;
    this.displayName = config.displayName;
    this.rates = config.rates;
    this.vatNumberPattern = config.vatNumberPattern;
    this.rateMap = new Map(config.rates.map((r) => [r.category, r]));
  }

  // -- Tax calculation ------------------------------------------------------

  calculateTax(amount: number, category: TaxCategory, _stateProvince?: string): TaxResult {
    const entry = this.rateMap.get(category) ?? this.rateMap.get("standard");
    if (!entry) {
      return buildTaxResult(amount, [], category, this.currency);
    }

    const lineItems: TaxLineItem[] = [];
    if (entry.rate > 0) {
      lineItems.push({
        label: `${entry.label}`,
        rate: entry.rate,
        amount: roundMoney(amount * entry.rate / 100),
      });
    }

    return buildTaxResult(amount, lineItems, category, this.currency);
  }

  /**
   * Calculate tax under the EU reverse-charge mechanism.
   * The buyer self-assesses VAT; the seller charges 0 %.
   */
  calculateReverseCharge(amount: number): TaxResult {
    return buildTaxResult(amount, [], "reverse-charge", this.currency);
  }

  // -- Rate listing ---------------------------------------------------------

  getTaxRates(): TaxRate[] {
    return this.rates.map((r) => ({
      label: r.label,
      category: r.category,
      rate: r.rate,
    }));
  }

  // -- VAT number validation ------------------------------------------------

  validateVATNumber(vatNumber: string): boolean {
    if (!this.vatNumberPattern) return true; // no pattern → assume valid
    const stripped = vatNumber.replace(/^[A-Z]{2}/, "").replace(/\s/g, "");
    return this.vatNumberPattern.test(stripped);
  }

  // -- Default EU COA -------------------------------------------------------

  getDefaultCOA(): COAEntry[] {
    return [
      { code: "1000", name: "Bank", type: "asset" },
      { code: "1100", name: "Trade Receivables", type: "asset" },
      { code: "1200", name: "Inventory", type: "asset" },
      { code: "1300", name: "Prepayments", type: "asset" },
      { code: "1500", name: "Tangible Fixed Assets", type: "asset" },
      { code: "1510", name: "Accumulated Depreciation", type: "asset" },
      { code: "2000", name: "Trade Payables", type: "liability" },
      { code: "2100", name: "VAT Output (Payable)", type: "liability", description: "VAT collected on sales" },
      { code: "2101", name: "VAT Input (Deductible)", type: "asset", description: "VAT paid on purchases" },
      { code: "2102", name: "Intra-Community VAT Payable", type: "liability" },
      { code: "2200", name: "Payroll Liabilities", type: "liability" },
      { code: "2300", name: "Corporate Tax Payable", type: "liability" },
      { code: "3000", name: "Share Capital", type: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity" },
      { code: "4000", name: "Revenue", type: "revenue" },
      { code: "4100", name: "Other Operating Income", type: "revenue" },
      { code: "5000", name: "Cost of Goods Sold", type: "expense" },
      { code: "5100", name: "Personnel Costs", type: "expense" },
      { code: "5200", name: "Rent and Premises", type: "expense" },
      { code: "5300", name: "Utilities", type: "expense" },
      { code: "5400", name: "Depreciation", type: "expense" },
      { code: "5500", name: "Professional Fees", type: "expense" },
      { code: "5600", name: "Insurance", type: "expense" },
      { code: "5700", name: "Office Supplies", type: "expense" },
    ];
  }

  // -- Report ---------------------------------------------------------------

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
      title: `${this.displayName} VAT Summary`,
      country: this.countryCode,
      currency: this.currency,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          heading: "Overview",
          rows: [
            { label: "Total Transactions", value: results.length },
            { label: "Total Net Amount", value: roundMoney(totalNet) },
            { label: "Total VAT", value: roundMoney(totalVAT) },
            { label: "Total Gross Amount", value: roundMoney(totalNet + totalVAT) },
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
