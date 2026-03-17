/**
 * LedgerAI Tax Engine - United States (Sales Tax).
 *
 * The US has no federal sales tax. Tax is levied at the state level (and
 * sometimes at county / city level — not modelled here). Five states have
 * no state-level sales tax: AK, DE, MT, NH, OR.
 *
 * Nexus awareness: the engine records which states the business has nexus in,
 * and only collects tax for those states.
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
// State sales-tax rates (effective general state rate — does not include
// local additions). Source: Tax Foundation 2024 data.
// ---------------------------------------------------------------------------

export const STATE_RATES: Record<string, { name: string; rate: number }> = {
  AL: { name: "Alabama", rate: 4.0 },
  AK: { name: "Alaska", rate: 0.0 },
  AZ: { name: "Arizona", rate: 5.6 },
  AR: { name: "Arkansas", rate: 6.5 },
  CA: { name: "California", rate: 7.25 },
  CO: { name: "Colorado", rate: 2.9 },
  CT: { name: "Connecticut", rate: 6.35 },
  DE: { name: "Delaware", rate: 0.0 },
  FL: { name: "Florida", rate: 6.0 },
  GA: { name: "Georgia", rate: 4.0 },
  HI: { name: "Hawaii", rate: 4.0 },
  ID: { name: "Idaho", rate: 6.0 },
  IL: { name: "Illinois", rate: 6.25 },
  IN: { name: "Indiana", rate: 7.0 },
  IA: { name: "Iowa", rate: 6.0 },
  KS: { name: "Kansas", rate: 6.5 },
  KY: { name: "Kentucky", rate: 6.0 },
  LA: { name: "Louisiana", rate: 4.45 },
  ME: { name: "Maine", rate: 5.5 },
  MD: { name: "Maryland", rate: 6.0 },
  MA: { name: "Massachusetts", rate: 6.25 },
  MI: { name: "Michigan", rate: 6.0 },
  MN: { name: "Minnesota", rate: 6.875 },
  MS: { name: "Mississippi", rate: 7.0 },
  MO: { name: "Missouri", rate: 4.225 },
  MT: { name: "Montana", rate: 0.0 },
  NE: { name: "Nebraska", rate: 5.5 },
  NV: { name: "Nevada", rate: 6.85 },
  NH: { name: "New Hampshire", rate: 0.0 },
  NJ: { name: "New Jersey", rate: 6.625 },
  NM: { name: "New Mexico", rate: 4.875 },
  NY: { name: "New York", rate: 4.0 },
  NC: { name: "North Carolina", rate: 4.75 },
  ND: { name: "North Dakota", rate: 5.0 },
  OH: { name: "Ohio", rate: 5.75 },
  OK: { name: "Oklahoma", rate: 4.5 },
  OR: { name: "Oregon", rate: 0.0 },
  PA: { name: "Pennsylvania", rate: 6.0 },
  RI: { name: "Rhode Island", rate: 7.0 },
  SC: { name: "South Carolina", rate: 6.0 },
  SD: { name: "South Dakota", rate: 4.5 },
  TN: { name: "Tennessee", rate: 7.0 },
  TX: { name: "Texas", rate: 6.25 },
  UT: { name: "Utah", rate: 6.1 },
  VT: { name: "Vermont", rate: 6.0 },
  VA: { name: "Virginia", rate: 5.3 },
  WA: { name: "Washington", rate: 6.5 },
  WV: { name: "West Virginia", rate: 6.0 },
  WI: { name: "Wisconsin", rate: 5.0 },
  WY: { name: "Wyoming", rate: 4.0 },
  DC: { name: "District of Columbia", rate: 6.0 },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class UnitedStatesTaxEngine implements TaxEngine {
  readonly countryCode = "US";
  readonly currency = "USD";
  readonly displayName = "United States";

  /**
   * Set of state codes where the business has established nexus.
   * When empty, tax is calculated for any requested state.
   * When populated, tax is only collected for nexus states.
   */
  private nexusStates: Set<string>;

  constructor(nexusStates?: string[]) {
    this.nexusStates = new Set((nexusStates ?? []).map((s) => s.toUpperCase()));
  }

  /** Register a nexus state at runtime. */
  addNexus(stateCode: string): void {
    this.nexusStates.add(stateCode.toUpperCase());
  }

  /** Remove a nexus state. */
  removeNexus(stateCode: string): void {
    this.nexusStates.delete(stateCode.toUpperCase());
  }

  /** Check whether the business has nexus in a given state. */
  hasNexus(stateCode: string): boolean {
    if (this.nexusStates.size === 0) return true; // nexus not configured — assume yes
    return this.nexusStates.has(stateCode.toUpperCase());
  }

  calculateTax(amount: number, category: TaxCategory, stateProvince?: string): TaxResult {
    // "exempt" category → zero tax regardless of state
    if (category === "exempt") {
      return buildTaxResult(amount, [], "exempt", this.currency);
    }

    const stateCode = (stateProvince ?? "").toUpperCase();
    const stateInfo = STATE_RATES[stateCode];

    if (!stateInfo) {
      // Unknown state — return zero tax with a warning label
      return buildTaxResult(amount, [], category, this.currency);
    }

    // Nexus check
    if (!this.hasNexus(stateCode)) {
      return buildTaxResult(amount, [], category, this.currency);
    }

    const lineItems: TaxLineItem[] = [];
    if (stateInfo.rate > 0) {
      lineItems.push({
        label: `${stateInfo.name} Sales Tax`,
        rate: stateInfo.rate,
        amount: roundMoney(amount * stateInfo.rate / 100),
      });
    }

    return buildTaxResult(amount, lineItems, category, this.currency);
  }

  getTaxRates(): TaxRate[] {
    return Object.entries(STATE_RATES).map(([code, info]) => ({
      label: `${info.name} (${code})`,
      category: code,
      rate: info.rate,
    }));
  }

  getDefaultCOA(): COAEntry[] {
    return [
      { code: "1000", name: "Cash and Cash Equivalents", type: "asset" },
      { code: "1100", name: "Accounts Receivable", type: "asset" },
      { code: "1200", name: "Inventory", type: "asset" },
      { code: "1300", name: "Prepaid Expenses", type: "asset" },
      { code: "1500", name: "Fixed Assets", type: "asset" },
      { code: "1600", name: "Accumulated Depreciation", type: "asset" },
      { code: "2000", name: "Accounts Payable", type: "liability" },
      { code: "2100", name: "Sales Tax Payable", type: "liability" },
      { code: "2200", name: "Accrued Liabilities", type: "liability" },
      { code: "2300", name: "Payroll Liabilities", type: "liability" },
      { code: "3000", name: "Owner's Equity", type: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity" },
      { code: "4000", name: "Sales Revenue", type: "revenue" },
      { code: "4100", name: "Service Revenue", type: "revenue" },
      { code: "4200", name: "Interest Income", type: "revenue" },
      { code: "5000", name: "Cost of Goods Sold", type: "expense" },
      { code: "5100", name: "Salaries and Wages", type: "expense" },
      { code: "5200", name: "Rent Expense", type: "expense" },
      { code: "5300", name: "Utilities", type: "expense" },
      { code: "5400", name: "Insurance", type: "expense" },
      { code: "5500", name: "Depreciation Expense", type: "expense" },
      { code: "5600", name: "Office Supplies", type: "expense" },
      { code: "5700", name: "Marketing and Advertising", type: "expense" },
      { code: "5800", name: "Professional Fees", type: "expense" },
    ];
  }

  formatTaxReport(results: TaxResult[]): TaxReport {
    let totalNet = 0;
    let totalTax = 0;
    const byState: Record<string, number> = {};

    for (const r of results) {
      totalNet += r.netAmount;
      totalTax += r.taxAmount;
      for (const li of r.lineItems) {
        byState[li.label] = (byState[li.label] ?? 0) + li.amount;
      }
    }

    const stateRows = Object.entries(byState).map(([label, value]) => ({
      label,
      value: roundMoney(value),
    }));

    return {
      title: "US Sales Tax Summary",
      country: this.countryCode,
      currency: this.currency,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          heading: "Overview",
          rows: [
            { label: "Total Transactions", value: results.length },
            { label: "Total Net Sales", value: roundMoney(totalNet) },
            { label: "Total Sales Tax Collected", value: roundMoney(totalTax) },
          ],
        },
        { heading: "Tax by State", rows: stateRows },
      ],
    };
  }
}
