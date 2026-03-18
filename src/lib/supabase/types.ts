export interface User {
  id: string;
  email: string;
  business_name: string | null;
  business_type: string | null;
  country: string;
  currency: string;
  tax_id: string | null;
  plan: "free" | "starter" | "pro" | "enterprise";
  fiscal_year_start: number;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  code: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parent_id: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  description: string;
  reference_number: string | null;
  source: "receipt_scan" | "manual" | "bank_import" | "chat";
  status: "draft" | "confirmed" | "reconciled";
  currency: string;
  exchange_rate: number;
  created_at: string;
}

export interface TransactionLine {
  id: string;
  transaction_id: string;
  account_id: string;
  debit: number;
  credit: number;
  tax_code: string | null;
  tax_amount: number;
  description: string | null;
  account?: Account;
}

export interface Receipt {
  id: string;
  user_id: string;
  image_url: string;
  raw_ocr_data: Record<string, unknown> | null;
  extracted_vendor: string | null;
  extracted_amount: number | null;
  extracted_date: string | null;
  extracted_category: string | null;
  extracted_line_items: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }> | null;
  extracted_tax_info: Record<string, unknown> | null;
  hsn_codes: string[] | null;
  transaction_id: string | null;
  status: "pending" | "reviewed" | "linked";
  created_at: string;
}

export interface TaxRule {
  id: string;
  country: string;
  tax_type: string;
  tax_name: string;
  rate: number;
  hsn_sac_code: string | null;
  state_province: string | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  invoice_number: string;
  date: string;
  due_date: string;
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue";
  line_items: InvoiceLineItem[];
  transaction_id: string | null;
  created_at: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_code: string | null;
  tax_amount: number;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: "user" | "assistant";
  message: string;
  action_taken: Record<string, unknown> | null;
  created_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  platform: "tally" | "quickbooks" | "sage" | "zoho" | "wave" | "sap";
  last_sync_at: string | null;
  sync_status: string;
  config: Record<string, unknown>;
  created_at: string;
}

export type CountryCode = "IN" | "US" | "UK" | "AU" | "NZ" | "DE" | "FR" | "NL" | "ES" | "IT";
export type CurrencyCode = "INR" | "USD" | "GBP" | "AUD" | "NZD" | "EUR";

export const COUNTRY_CONFIG: Record<
  CountryCode,
  { name: string; currency: CurrencyCode; currencySymbol: string; fiscalYearStart: number; taxType: string; taxRates: { label: string; rate: number }[]; defaultTaxRate: number }
> = {
  IN: { name: "India", currency: "INR", currencySymbol: "₹", fiscalYearStart: 4, taxType: "GST", defaultTaxRate: 18, taxRates: [
    { label: "No Tax", rate: 0 }, { label: "GST 5%", rate: 5 }, { label: "GST 12%", rate: 12 }, { label: "GST 18%", rate: 18 }, { label: "GST 28%", rate: 28 },
  ]},
  US: { name: "United States", currency: "USD", currencySymbol: "$", fiscalYearStart: 1, taxType: "Sales Tax", defaultTaxRate: 0, taxRates: [
    { label: "No Tax", rate: 0 }, { label: "Sales Tax 5%", rate: 5 }, { label: "Sales Tax 7%", rate: 7 }, { label: "Sales Tax 8.25%", rate: 8.25 }, { label: "Sales Tax 10%", rate: 10 },
  ]},
  UK: { name: "United Kingdom", currency: "GBP", currencySymbol: "£", fiscalYearStart: 4, taxType: "VAT", defaultTaxRate: 20, taxRates: [
    { label: "No VAT", rate: 0 }, { label: "Reduced VAT 5%", rate: 5 }, { label: "Standard VAT 20%", rate: 20 },
  ]},
  AU: { name: "Australia", currency: "AUD", currencySymbol: "A$", fiscalYearStart: 7, taxType: "GST", defaultTaxRate: 10, taxRates: [
    { label: "No GST", rate: 0 }, { label: "GST 10%", rate: 10 },
  ]},
  NZ: { name: "New Zealand", currency: "NZD", currencySymbol: "NZ$", fiscalYearStart: 4, taxType: "GST", defaultTaxRate: 15, taxRates: [
    { label: "No GST", rate: 0 }, { label: "GST 15%", rate: 15 },
  ]},
  DE: { name: "Germany", currency: "EUR", currencySymbol: "€", fiscalYearStart: 1, taxType: "VAT", defaultTaxRate: 19, taxRates: [
    { label: "No VAT", rate: 0 }, { label: "Reduced VAT 7%", rate: 7 }, { label: "Standard VAT 19%", rate: 19 },
  ]},
  FR: { name: "France", currency: "EUR", currencySymbol: "€", fiscalYearStart: 1, taxType: "VAT", defaultTaxRate: 20, taxRates: [
    { label: "No VAT", rate: 0 }, { label: "Reduced VAT 5.5%", rate: 5.5 }, { label: "Intermediate VAT 10%", rate: 10 }, { label: "Standard VAT 20%", rate: 20 },
  ]},
  NL: { name: "Netherlands", currency: "EUR", currencySymbol: "€", fiscalYearStart: 1, taxType: "VAT", defaultTaxRate: 21, taxRates: [
    { label: "No VAT", rate: 0 }, { label: "Reduced VAT 9%", rate: 9 }, { label: "Standard VAT 21%", rate: 21 },
  ]},
  ES: { name: "Spain", currency: "EUR", currencySymbol: "€", fiscalYearStart: 1, taxType: "VAT", defaultTaxRate: 21, taxRates: [
    { label: "No IVA", rate: 0 }, { label: "Reduced IVA 10%", rate: 10 }, { label: "Standard IVA 21%", rate: 21 },
  ]},
  IT: { name: "Italy", currency: "EUR", currencySymbol: "€", fiscalYearStart: 1, taxType: "VAT", defaultTaxRate: 22, taxRates: [
    { label: "No IVA", rate: 0 }, { label: "Reduced IVA 10%", rate: 10 }, { label: "Standard IVA 22%", rate: 22 },
  ]},
};
