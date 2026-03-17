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
  { name: string; currency: CurrencyCode; fiscalYearStart: number; taxType: string }
> = {
  IN: { name: "India", currency: "INR", fiscalYearStart: 4, taxType: "GST" },
  US: { name: "United States", currency: "USD", fiscalYearStart: 1, taxType: "Sales Tax" },
  UK: { name: "United Kingdom", currency: "GBP", fiscalYearStart: 4, taxType: "VAT" },
  AU: { name: "Australia", currency: "AUD", fiscalYearStart: 7, taxType: "GST" },
  NZ: { name: "New Zealand", currency: "NZD", fiscalYearStart: 4, taxType: "GST" },
  DE: { name: "Germany", currency: "EUR", fiscalYearStart: 1, taxType: "VAT" },
  FR: { name: "France", currency: "EUR", fiscalYearStart: 1, taxType: "VAT" },
  NL: { name: "Netherlands", currency: "EUR", fiscalYearStart: 1, taxType: "VAT" },
  ES: { name: "Spain", currency: "EUR", fiscalYearStart: 1, taxType: "VAT" },
  IT: { name: "Italy", currency: "EUR", fiscalYearStart: 1, taxType: "VAT" },
};
