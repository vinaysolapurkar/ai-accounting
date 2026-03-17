/**
 * LedgerAI Tax Engine - India (GST + TDS).
 *
 * Goods and Services Tax in India is levied as:
 *   - Intra-state supply  : CGST (Central) + SGST (State), each at half the headline rate.
 *   - Inter-state supply  : IGST (Integrated), equal to the full headline rate.
 *
 * Standard GST slab rates: 0 %, 5 %, 12 %, 18 %, 28 %.
 *
 * HSN (Harmonised System of Nomenclature) codes map goods to the correct slab.
 * A simplified lookup is provided; production systems should use a full HSN database.
 *
 * TDS (Tax Deducted at Source) basics are included for common sections.
 */

import {
  TaxEngine,
  TaxRate,
  TaxRateComponent,
  TaxResult,
  TaxLineItem,
  TaxReport,
  COAEntry,
  TaxCategory,
  roundMoney,
  buildTaxResult,
} from "./base";

// ---------------------------------------------------------------------------
// GST slab definitions
// ---------------------------------------------------------------------------

const GST_SLABS: Record<string, number> = {
  exempt: 0,
  "5": 5,
  "12": 12,
  "18": 18,
  "28": 28,
};

/** Default slab when category is "standard". */
const DEFAULT_SLAB = 18;

// ---------------------------------------------------------------------------
// HSN-to-slab mapping (representative subset)
// ---------------------------------------------------------------------------

export interface HSNEntry {
  hsn: string;
  description: string;
  gstRate: number;
}

const HSN_TABLE: HSNEntry[] = [
  { hsn: "0401", description: "Milk and cream, not concentrated", gstRate: 0 },
  { hsn: "0713", description: "Dried leguminous vegetables", gstRate: 0 },
  { hsn: "1006", description: "Rice", gstRate: 5 },
  { hsn: "1905", description: "Bread, pastry, cakes", gstRate: 5 },
  { hsn: "3004", description: "Medicaments (packaged)", gstRate: 12 },
  { hsn: "3923", description: "Plastic articles for packing", gstRate: 18 },
  { hsn: "6109", description: "T-shirts, singlets, tank tops", gstRate: 5 },
  { hsn: "8471", description: "Computers and peripherals", gstRate: 18 },
  { hsn: "8703", description: "Motor cars", gstRate: 28 },
  { hsn: "8528", description: "Televisions", gstRate: 28 },
  { hsn: "9954", description: "Construction services", gstRate: 18 },
  { hsn: "9971", description: "Financial services", gstRate: 18 },
  { hsn: "9973", description: "Leasing / rental services", gstRate: 18 },
  { hsn: "9983", description: "Professional / technical services", gstRate: 18 },
  { hsn: "9984", description: "Telecom services", gstRate: 18 },
  { hsn: "9985", description: "Transport of passengers", gstRate: 5 },
  { hsn: "9986", description: "Transport of goods", gstRate: 5 },
  { hsn: "9987", description: "Maintenance and repair services", gstRate: 18 },
  { hsn: "9988", description: "Manufacturing services", gstRate: 18 },
  { hsn: "9992", description: "Education services", gstRate: 0 },
  { hsn: "9993", description: "Healthcare services", gstRate: 0 },
];

// ---------------------------------------------------------------------------
// TDS section definitions
// ---------------------------------------------------------------------------

export interface TDSSection {
  section: string;
  description: string;
  /** Rate for payment to resident (%). */
  residentRate: number;
  /** Threshold below which TDS is not applicable (INR). */
  threshold: number;
}

const TDS_SECTIONS: TDSSection[] = [
  { section: "194A", description: "Interest (other than on securities)", residentRate: 10, threshold: 40_000 },
  { section: "194C", description: "Payment to contractors", residentRate: 1, threshold: 30_000 },
  { section: "194H", description: "Commission or brokerage", residentRate: 5, threshold: 15_000 },
  { section: "194I(a)", description: "Rent - Plant / machinery", residentRate: 2, threshold: 240_000 },
  { section: "194I(b)", description: "Rent - Land / building / furniture", residentRate: 10, threshold: 240_000 },
  { section: "194J", description: "Professional / technical fees", residentRate: 10, threshold: 30_000 },
  { section: "194Q", description: "Purchase of goods", residentRate: 0.1, threshold: 5_000_000 },
];

// ---------------------------------------------------------------------------
// Supply type
// ---------------------------------------------------------------------------

export type SupplyType = "intra-state" | "inter-state";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSlabRate(category: TaxCategory): number {
  if (category === "standard") return DEFAULT_SLAB;
  if (category in GST_SLABS) return GST_SLABS[category];
  const numeric = Number(category);
  if (!Number.isNaN(numeric) && Object.values(GST_SLABS).includes(numeric)) return numeric;
  return DEFAULT_SLAB;
}

function inferSupplyType(stateProvince?: string): { type: SupplyType; state: string } {
  if (!stateProvince) return { type: "intra-state", state: "MH" };
  const parts = stateProvince.split("->");
  if (parts.length === 2) {
    const from = parts[0].trim().toUpperCase();
    const to = parts[1].trim().toUpperCase();
    return { type: from === to ? "intra-state" : "inter-state", state: to };
  }
  return { type: "intra-state", state: stateProvince.trim().toUpperCase() };
}

// ---------------------------------------------------------------------------
// Engine implementation
// ---------------------------------------------------------------------------

export class IndiaTaxEngine implements TaxEngine {
  readonly countryCode = "IN";
  readonly currency = "INR";
  readonly displayName = "India";

  calculateTax(amount: number, category: TaxCategory, stateProvince?: string): TaxResult {
    const slabRate = resolveSlabRate(category);
    const { type } = inferSupplyType(stateProvince);

    const lineItems: TaxLineItem[] = [];

    if (slabRate === 0) {
      // exempt — no tax
    } else if (type === "inter-state") {
      lineItems.push({
        label: "IGST",
        rate: slabRate,
        amount: roundMoney(amount * slabRate / 100),
      });
    } else {
      const halfRate = slabRate / 2;
      lineItems.push(
        { label: "CGST", rate: halfRate, amount: roundMoney(amount * halfRate / 100) },
        { label: "SGST", rate: halfRate, amount: roundMoney(amount * halfRate / 100) },
      );
    }

    return buildTaxResult(amount, lineItems, category, this.currency);
  }

  getTaxRates(): TaxRate[] {
    return Object.entries(GST_SLABS).map(([key, rate]) => {
      const components: TaxRateComponent[] | undefined =
        rate === 0
          ? undefined
          : [
              { label: "CGST", rate: rate / 2 },
              { label: "SGST", rate: rate / 2 },
            ];
      return {
        label: rate === 0 ? "GST Exempt" : `GST ${rate} %`,
        category: key,
        rate,
        components,
      };
    });
  }

  // -- HSN helpers ----------------------------------------------------------

  lookupHSN(hsn: string): HSNEntry | undefined {
    return HSN_TABLE.find((e) => hsn.startsWith(e.hsn));
  }

  calculateTaxByHSN(amount: number, hsn: string, stateProvince?: string): TaxResult {
    const entry = this.lookupHSN(hsn);
    const category = entry ? String(entry.gstRate) : "18";
    return this.calculateTax(amount, category === "0" ? "exempt" : category, stateProvince);
  }

  // -- TDS helpers ----------------------------------------------------------

  getTDSSections(): TDSSection[] {
    return [...TDS_SECTIONS];
  }

  calculateTDS(amount: number, section: string): { tdsAmount: number; netPayable: number; section: string } | null {
    const entry = TDS_SECTIONS.find((s) => s.section === section);
    if (!entry) return null;
    if (amount < entry.threshold) return { tdsAmount: 0, netPayable: amount, section };
    const tds = roundMoney(amount * entry.residentRate / 100);
    return { tdsAmount: tds, netPayable: roundMoney(amount - tds), section };
  }

  // -- COA ------------------------------------------------------------------

  getDefaultCOA(): COAEntry[] {
    return [
      { code: "1000", name: "Cash and Cash Equivalents", type: "asset" },
      { code: "1100", name: "Accounts Receivable", type: "asset" },
      { code: "1200", name: "Inventory", type: "asset" },
      { code: "1300", name: "Prepaid Expenses", type: "asset" },
      { code: "1500", name: "Fixed Assets", type: "asset" },
      { code: "2000", name: "Accounts Payable", type: "liability" },
      { code: "2100", name: "CGST Payable", type: "liability", description: "Central GST collected on sales" },
      { code: "2101", name: "SGST Payable", type: "liability", description: "State GST collected on sales" },
      { code: "2102", name: "IGST Payable", type: "liability", description: "Integrated GST collected on sales" },
      { code: "2110", name: "CGST Input Credit", type: "asset", description: "Central GST paid on purchases" },
      { code: "2111", name: "SGST Input Credit", type: "asset", description: "State GST paid on purchases" },
      { code: "2112", name: "IGST Input Credit", type: "asset", description: "Integrated GST paid on purchases" },
      { code: "2200", name: "TDS Payable", type: "liability" },
      { code: "3000", name: "Owner's Equity / Capital", type: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity" },
      { code: "4000", name: "Sales Revenue", type: "revenue" },
      { code: "4100", name: "Service Revenue", type: "revenue" },
      { code: "5000", name: "Cost of Goods Sold", type: "expense" },
      { code: "5100", name: "Salaries and Wages", type: "expense" },
      { code: "5200", name: "Rent Expense", type: "expense" },
      { code: "5300", name: "Utilities", type: "expense" },
      { code: "5400", name: "Professional Fees", type: "expense" },
      { code: "5500", name: "Depreciation", type: "expense" },
      { code: "5600", name: "Office Supplies", type: "expense" },
    ];
  }

  // -- Report ---------------------------------------------------------------

  formatTaxReport(results: TaxResult[]): TaxReport {
    let totalNet = 0;
    let totalTax = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    for (const r of results) {
      totalNet += r.netAmount;
      totalTax += r.taxAmount;
      for (const li of r.lineItems) {
        if (li.label === "CGST") totalCGST += li.amount;
        else if (li.label === "SGST") totalSGST += li.amount;
        else if (li.label === "IGST") totalIGST += li.amount;
      }
    }

    return {
      title: "GST Summary Report",
      country: this.countryCode,
      currency: this.currency,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          heading: "Overview",
          rows: [
            { label: "Total Transactions", value: results.length },
            { label: "Total Net Amount", value: roundMoney(totalNet) },
            { label: "Total Tax Collected", value: roundMoney(totalTax) },
            { label: "Total Gross Amount", value: roundMoney(totalNet + totalTax) },
          ],
        },
        {
          heading: "Tax Component Breakdown",
          rows: [
            { label: "CGST", value: roundMoney(totalCGST) },
            { label: "SGST", value: roundMoney(totalSGST) },
            { label: "IGST", value: roundMoney(totalIGST) },
          ],
        },
      ],
    };
  }
}
