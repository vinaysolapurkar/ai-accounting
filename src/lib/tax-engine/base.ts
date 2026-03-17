/**
 * LedgerAI Tax Engine - Base types and interfaces.
 *
 * Every country-specific engine implements the TaxEngine interface so that
 * the rest of the application can work with taxes in a country-agnostic way.
 */

// ---------------------------------------------------------------------------
// Core value types
// ---------------------------------------------------------------------------

/** ISO 3166-1 alpha-2 country code (e.g. "IN", "US", "GB"). */
export type CountryCode = string;

/** ISO 4217 currency code (e.g. "INR", "USD", "GBP"). */
export type CurrencyCode = string;

/** A tax category key understood by a specific engine (e.g. "standard", "reduced", "zero"). */
export type TaxCategory = string;

// ---------------------------------------------------------------------------
// Tax rate descriptor
// ---------------------------------------------------------------------------

export interface TaxRate {
  /** Human-readable label, e.g. "Standard GST" or "Reduced VAT". */
  label: string;

  /** Category key used when calling calculateTax. */
  category: TaxCategory;

  /** Effective percentage rate (e.g. 18 means 18 %). */
  rate: number;

  /**
   * Optional sub-components that make up this rate.
   * For example Indian intra-state GST is split into CGST + SGST.
   */
  components?: TaxRateComponent[];
}

export interface TaxRateComponent {
  label: string;
  rate: number;
}

// ---------------------------------------------------------------------------
// Tax calculation result
// ---------------------------------------------------------------------------

export interface TaxLineItem {
  label: string;
  rate: number;
  amount: number;
}

export interface TaxResult {
  /** The original amount before tax. */
  netAmount: number;

  /** Total tax amount (sum of all line items). */
  taxAmount: number;

  /** Net + tax. */
  grossAmount: number;

  /** Breakdown of individual tax components. */
  lineItems: TaxLineItem[];

  /** The category that was applied. */
  appliedCategory: TaxCategory;

  /** ISO 4217 currency code. */
  currency: CurrencyCode;
}

// ---------------------------------------------------------------------------
// Chart of Accounts entry
// ---------------------------------------------------------------------------

export interface COAEntry {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  description?: string;
}

// ---------------------------------------------------------------------------
// Tax report section
// ---------------------------------------------------------------------------

export interface TaxReportSection {
  heading: string;
  rows: Array<{ label: string; value: string | number }>;
}

export interface TaxReport {
  title: string;
  country: CountryCode;
  currency: CurrencyCode;
  generatedAt: string;
  sections: TaxReportSection[];
}

// ---------------------------------------------------------------------------
// Main engine interface
// ---------------------------------------------------------------------------

export interface TaxEngine {
  /** ISO 3166-1 alpha-2 code this engine handles. */
  readonly countryCode: CountryCode;

  /** ISO 4217 currency used by this engine. */
  readonly currency: CurrencyCode;

  /** Human-readable country / jurisdiction name. */
  readonly displayName: string;

  /**
   * Calculate tax on a given amount.
   *
   * @param amount        - Pre-tax amount in the engine's currency.
   * @param category      - Tax category key (e.g. "standard", "zero").
   * @param stateProvince - Optional sub-jurisdiction (state, province, territory).
   */
  calculateTax(amount: number, category: TaxCategory, stateProvince?: string): TaxResult;

  /** Return all tax rates known to this engine. */
  getTaxRates(): TaxRate[];

  /** Return a default Chart of Accounts suitable for this jurisdiction. */
  getDefaultCOA(): COAEntry[];

  /** Produce a formatted tax report shell (for display / export). */
  formatTaxReport(results: TaxResult[]): TaxReport;
}

// ---------------------------------------------------------------------------
// Helpers shared by all engines
// ---------------------------------------------------------------------------

/** Round a monetary value to 2 decimal places using banker's rounding. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Build a TaxResult from basic inputs. */
export function buildTaxResult(
  netAmount: number,
  lineItems: TaxLineItem[],
  category: TaxCategory,
  currency: CurrencyCode,
): TaxResult {
  const taxAmount = roundMoney(lineItems.reduce((sum, li) => sum + li.amount, 0));
  return {
    netAmount: roundMoney(netAmount),
    taxAmount,
    grossAmount: roundMoney(netAmount + taxAmount),
    lineItems,
    appliedCategory: category,
    currency,
  };
}
