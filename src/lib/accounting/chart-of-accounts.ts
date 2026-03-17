import type { Account } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AccountType = Account["type"];

export interface COAEntry {
  code: string;
  name: string;
  type: AccountType;
  /** Code of the parent account, or null for top-level accounts. */
  parentCode: string | null;
}

// ---------------------------------------------------------------------------
// Shared base accounts present in every template
// ---------------------------------------------------------------------------

const BASE_ACCOUNTS: COAEntry[] = [
  // ── Assets ──────────────────────────────────────────────────────────────
  { code: "1000", name: "Assets",                  type: "asset",    parentCode: null   },
  { code: "1010", name: "Cash",                    type: "asset",    parentCode: "1000" },
  { code: "1020", name: "Petty Cash",              type: "asset",    parentCode: "1000" },
  { code: "1100", name: "Bank Account",            type: "asset",    parentCode: "1000" },
  { code: "1200", name: "Accounts Receivable",     type: "asset",    parentCode: "1000" },
  { code: "1300", name: "Prepaid Expenses",        type: "asset",    parentCode: "1000" },
  { code: "1400", name: "Inventory",               type: "asset",    parentCode: "1000" },
  { code: "1500", name: "Fixed Assets",            type: "asset",    parentCode: "1000" },
  { code: "1510", name: "Office Equipment",        type: "asset",    parentCode: "1500" },
  { code: "1520", name: "Furniture & Fixtures",    type: "asset",    parentCode: "1500" },
  { code: "1530", name: "Computers & Electronics", type: "asset",    parentCode: "1500" },
  { code: "1540", name: "Vehicles",                type: "asset",    parentCode: "1500" },
  { code: "1600", name: "Accumulated Depreciation",type: "asset",    parentCode: "1000" },

  // ── Liabilities ─────────────────────────────────────────────────────────
  { code: "2000", name: "Liabilities",             type: "liability", parentCode: null   },
  { code: "2100", name: "Accounts Payable",        type: "liability", parentCode: "2000" },
  { code: "2200", name: "Accrued Liabilities",     type: "liability", parentCode: "2000" },
  { code: "2300", name: "Unearned Revenue",        type: "liability", parentCode: "2000" },
  { code: "2400", name: "Short-Term Loans",        type: "liability", parentCode: "2000" },
  { code: "2500", name: "Long-Term Loans",         type: "liability", parentCode: "2000" },
  { code: "2600", name: "Credit Card Payable",     type: "liability", parentCode: "2000" },

  // ── Equity ──────────────────────────────────────────────────────────────
  { code: "3000", name: "Equity",                  type: "equity",   parentCode: null   },
  { code: "3100", name: "Owner's Capital",         type: "equity",   parentCode: "3000" },
  { code: "3200", name: "Owner's Drawings",        type: "equity",   parentCode: "3000" },
  { code: "3300", name: "Retained Earnings",       type: "equity",   parentCode: "3000" },

  // ── Revenue ─────────────────────────────────────────────────────────────
  { code: "4000", name: "Revenue",                 type: "revenue",  parentCode: null   },
  { code: "4100", name: "Sales Revenue",           type: "revenue",  parentCode: "4000" },
  { code: "4200", name: "Service Revenue",         type: "revenue",  parentCode: "4000" },
  { code: "4300", name: "Interest Income",         type: "revenue",  parentCode: "4000" },
  { code: "4400", name: "Other Income",            type: "revenue",  parentCode: "4000" },
  { code: "4500", name: "Discounts Received",      type: "revenue",  parentCode: "4000" },

  // ── Cost of Goods Sold ──────────────────────────────────────────────────
  { code: "5000", name: "Cost of Goods Sold",      type: "expense",  parentCode: null   },
  { code: "5100", name: "Direct Materials",        type: "expense",  parentCode: "5000" },
  { code: "5200", name: "Direct Labour",           type: "expense",  parentCode: "5000" },
  { code: "5300", name: "Manufacturing Overheads", type: "expense",  parentCode: "5000" },
  { code: "5400", name: "Freight & Shipping",      type: "expense",  parentCode: "5000" },

  // ── Operating Expenses ──────────────────────────────────────────────────
  { code: "6000", name: "Operating Expenses",      type: "expense",  parentCode: null   },
  { code: "6100", name: "Rent",                    type: "expense",  parentCode: "6000" },
  { code: "6110", name: "Utilities",               type: "expense",  parentCode: "6000" },
  { code: "6120", name: "Insurance",               type: "expense",  parentCode: "6000" },
  { code: "6130", name: "Office Supplies",         type: "expense",  parentCode: "6000" },
  { code: "6140", name: "Telephone & Internet",    type: "expense",  parentCode: "6000" },
  { code: "6150", name: "Postage & Courier",       type: "expense",  parentCode: "6000" },
  { code: "6160", name: "Printing & Stationery",   type: "expense",  parentCode: "6000" },
  { code: "6200", name: "Salaries & Wages",        type: "expense",  parentCode: "6000" },
  { code: "6210", name: "Employee Benefits",       type: "expense",  parentCode: "6000" },
  { code: "6220", name: "Payroll Taxes",           type: "expense",  parentCode: "6000" },
  { code: "6300", name: "Travel",                  type: "expense",  parentCode: "6000" },
  { code: "6310", name: "Meals & Entertainment",   type: "expense",  parentCode: "6000" },
  { code: "6320", name: "Food & Beverages",        type: "expense",  parentCode: "6000" },
  { code: "6330", name: "Accommodation",           type: "expense",  parentCode: "6000" },
  { code: "6400", name: "Marketing & Advertising", type: "expense",  parentCode: "6000" },
  { code: "6500", name: "Professional Fees",       type: "expense",  parentCode: "6000" },
  { code: "6510", name: "Legal Fees",              type: "expense",  parentCode: "6000" },
  { code: "6520", name: "Accounting Fees",         type: "expense",  parentCode: "6000" },
  { code: "6600", name: "Repairs & Maintenance",   type: "expense",  parentCode: "6000" },
  { code: "6700", name: "Depreciation Expense",    type: "expense",  parentCode: "6000" },
  { code: "6800", name: "Bank Charges & Fees",     type: "expense",  parentCode: "6000" },
  { code: "6900", name: "Miscellaneous Expenses",  type: "expense",  parentCode: "6000" },
  { code: "6910", name: "Software & Subscriptions",type: "expense",  parentCode: "6000" },
  { code: "6920", name: "Training & Education",    type: "expense",  parentCode: "6000" },
];

// ---------------------------------------------------------------------------
// Country-specific add-on accounts
// ---------------------------------------------------------------------------

const INDIA_ACCOUNTS: COAEntry[] = [
  // GST accounts (liability/asset)
  { code: "1700", name: "GST Input Credit",        type: "asset",     parentCode: "1000" },
  { code: "1710", name: "CGST Input",              type: "asset",     parentCode: "1700" },
  { code: "1720", name: "SGST Input",              type: "asset",     parentCode: "1700" },
  { code: "1730", name: "IGST Input",              type: "asset",     parentCode: "1700" },

  { code: "2700", name: "GST Output Liability",    type: "liability", parentCode: "2000" },
  { code: "2710", name: "CGST Output",             type: "liability", parentCode: "2700" },
  { code: "2720", name: "SGST Output",             type: "liability", parentCode: "2700" },
  { code: "2730", name: "IGST Output",             type: "liability", parentCode: "2700" },

  // TDS
  { code: "1740", name: "TDS Receivable",          type: "asset",     parentCode: "1000" },
  { code: "2740", name: "TDS Payable",             type: "liability", parentCode: "2000" },

  // India-specific
  { code: "2750", name: "Provident Fund Payable",  type: "liability", parentCode: "2000" },
  { code: "2760", name: "ESI Payable",             type: "liability", parentCode: "2000" },
  { code: "2770", name: "Professional Tax Payable", type: "liability", parentCode: "2000" },
];

const US_ACCOUNTS: COAEntry[] = [
  // Sales tax
  { code: "2700", name: "Sales Tax Payable",       type: "liability", parentCode: "2000" },

  // Payroll specific
  { code: "2710", name: "Federal Tax Withholding",  type: "liability", parentCode: "2000" },
  { code: "2720", name: "State Tax Withholding",    type: "liability", parentCode: "2000" },
  { code: "2730", name: "FICA Payable",             type: "liability", parentCode: "2000" },
  { code: "2740", name: "Federal Unemployment Tax",type: "liability", parentCode: "2000" },
  { code: "2750", name: "State Unemployment Tax",  type: "liability", parentCode: "2000" },

  // US equity
  { code: "3400", name: "Common Stock",            type: "equity",    parentCode: "3000" },
  { code: "3500", name: "Additional Paid-in Capital", type: "equity", parentCode: "3000" },
  { code: "3600", name: "Treasury Stock",          type: "equity",    parentCode: "3000" },

  // 401(k)
  { code: "2760", name: "401(k) Payable",          type: "liability", parentCode: "2000" },
];

const UK_ACCOUNTS: COAEntry[] = [
  // VAT
  { code: "1700", name: "VAT Receivable",          type: "asset",     parentCode: "1000" },
  { code: "2700", name: "VAT Liability",           type: "liability", parentCode: "2000" },
  { code: "2710", name: "VAT Output (Standard 20%)", type: "liability", parentCode: "2700" },
  { code: "2720", name: "VAT Output (Reduced 5%)", type: "liability", parentCode: "2700" },
  { code: "2730", name: "VAT Output (Zero-Rated)", type: "liability", parentCode: "2700" },

  // PAYE / NI
  { code: "2740", name: "PAYE Payable",            type: "liability", parentCode: "2000" },
  { code: "2750", name: "National Insurance Payable", type: "liability", parentCode: "2000" },
  { code: "2760", name: "Pension Payable",         type: "liability", parentCode: "2000" },

  // Corporation tax
  { code: "2770", name: "Corporation Tax Payable", type: "liability", parentCode: "2000" },
];

const AU_NZ_ACCOUNTS: COAEntry[] = [
  // GST
  { code: "1700", name: "GST Receivable",          type: "asset",     parentCode: "1000" },
  { code: "2700", name: "GST Payable",             type: "liability", parentCode: "2000" },
  { code: "2710", name: "GST Collected",           type: "liability", parentCode: "2700" },
  { code: "2720", name: "GST Paid",                type: "liability", parentCode: "2700" },

  // PAYG (AU) / PAYE (NZ)
  { code: "2730", name: "PAYG/PAYE Withholding",   type: "liability", parentCode: "2000" },
  { code: "2740", name: "Superannuation Payable",  type: "liability", parentCode: "2000" },
];

const EU_ACCOUNTS: COAEntry[] = [
  // VAT – EU reverse-charge and intra-community
  { code: "1700", name: "VAT Receivable (Input)",      type: "asset",     parentCode: "1000" },
  { code: "2700", name: "VAT Payable (Output)",        type: "liability", parentCode: "2000" },
  { code: "2710", name: "VAT – Standard Rate",         type: "liability", parentCode: "2700" },
  { code: "2720", name: "VAT – Reduced Rate",          type: "liability", parentCode: "2700" },
  { code: "2730", name: "VAT – Intra-Community",       type: "liability", parentCode: "2700" },
  { code: "2740", name: "VAT – Reverse Charge",        type: "liability", parentCode: "2700" },
  { code: "2750", name: "Withholding Tax Payable",     type: "liability", parentCode: "2000" },
  { code: "2760", name: "Social Security Contributions", type: "liability", parentCode: "2000" },
];

// ---------------------------------------------------------------------------
// Country → add-on mapping
// ---------------------------------------------------------------------------

const COUNTRY_ADDONS: Record<string, COAEntry[]> = {
  IN: INDIA_ACCOUNTS,
  US: US_ACCOUNTS,
  UK: UK_ACCOUNTS,
  AU: AU_NZ_ACCOUNTS,
  NZ: AU_NZ_ACCOUNTS,
  DE: EU_ACCOUNTS,
  FR: EU_ACCOUNTS,
  NL: EU_ACCOUNTS,
  ES: EU_ACCOUNTS,
  IT: EU_ACCOUNTS,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the default Chart of Accounts template for the given country code.
 * The base set of accounts is always included; country-specific tax / payroll
 * accounts are merged in when a matching template exists.
 *
 * @param country  ISO-3166-1 alpha-2 country code (e.g. "IN", "US", "UK").
 * @returns        Flat array of COAEntry objects sorted by account code.
 */
export function getDefaultCOA(country: string): COAEntry[] {
  const normalised = country.toUpperCase().trim();
  const addons = COUNTRY_ADDONS[normalised] ?? [];

  // Merge base + country-specific, ensuring no duplicate codes
  const merged = new Map<string, COAEntry>();
  for (const entry of BASE_ACCOUNTS) {
    merged.set(entry.code, entry);
  }
  for (const entry of addons) {
    merged.set(entry.code, entry);
  }

  return Array.from(merged.values()).sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Converts a flat COAEntry list into Account rows ready for database insertion.
 * Generates deterministic UUIDs based on userId + account code so they can be
 * referenced before actual DB ids exist.
 */
export function coaToAccounts(userId: string, entries: COAEntry[]): Omit<Account, "created_at">[] {
  // Build a code → id lookup so we can resolve parent references
  const idLookup = new Map<string, string>();
  for (const entry of entries) {
    idLookup.set(entry.code, `${userId}__acct__${entry.code}`);
  }

  return entries.map((entry) => ({
    id: idLookup.get(entry.code)!,
    user_id: userId,
    name: entry.name,
    code: entry.code,
    type: entry.type,
    parent_id: entry.parentCode ? (idLookup.get(entry.parentCode) ?? null) : null,
    is_system: true,
  }));
}

/**
 * Returns only the supported country codes that have explicit COA templates.
 */
export function getSupportedCountries(): string[] {
  return Object.keys(COUNTRY_ADDONS);
}
