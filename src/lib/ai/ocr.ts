// ---------------------------------------------------------------------------
// Receipt OCR Pipeline
// ---------------------------------------------------------------------------

import type { OCRResult, LineItem, TaxInfo } from "./provider";
import { DeepSeekProvider } from "./deepseek";

// ── Public types -----------------------------------------------------------

export interface ReceiptData {
  vendor: string;
  amount: number;
  date: string;
  category: ReceiptCategory;
  lineItems: LineItem[];
  taxInfo: TaxInfo[];
  currency: string;
  rawText: string;
  confidence: "high" | "medium" | "low";
}

export type ReceiptCategory =
  | "Food & Dining"
  | "Transportation"
  | "Office Supplies"
  | "Utilities"
  | "Entertainment"
  | "Healthcare"
  | "Travel"
  | "Software & Subscriptions"
  | "Professional Services"
  | "Other";

const VALID_CATEGORIES: ReadonlySet<string> = new Set<ReceiptCategory>([
  "Food & Dining",
  "Transportation",
  "Office Supplies",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Travel",
  "Software & Subscriptions",
  "Professional Services",
  "Other",
]);

// ── Helpers ----------------------------------------------------------------

/**
 * Estimate a rough confidence score based on how complete the extracted
 * data looks.
 */
function estimateConfidence(result: OCRResult): "high" | "medium" | "low" {
  let score = 0;

  if (result.vendor && result.vendor !== "Unknown") score++;
  if (result.amount > 0) score++;
  if (/^\d{4}-\d{2}-\d{2}$/.test(result.date)) score++;
  if (result.lineItems.length > 0) score++;
  if (result.taxInfo.length > 0) score++;
  if (result.rawText.length > 20) score++;

  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function normaliseCategory(raw: string): ReceiptCategory {
  if (VALID_CATEGORIES.has(raw)) return raw as ReceiptCategory;
  return "Other";
}

/**
 * Basic sanity checks – e.g. line item totals should roughly equal the
 * receipt total.  We don't throw; we just log a warning so the caller
 * can decide what to do.
 */
function validateReceipt(data: ReceiptData): string[] {
  const warnings: string[] = [];

  if (data.amount <= 0) {
    warnings.push("Total amount is zero or negative.");
  }

  if (data.lineItems.length > 0) {
    const itemsTotal = data.lineItems.reduce((sum, li) => sum + li.total, 0);
    const taxTotal = data.taxInfo.reduce((sum, t) => sum + t.amount, 0);
    const expectedTotal = itemsTotal + taxTotal;

    // Allow a small floating-point tolerance (0.02)
    if (Math.abs(expectedTotal - data.amount) > 0.02 * data.amount + 0.02) {
      warnings.push(
        `Line-item total (${itemsTotal.toFixed(2)}) + tax (${taxTotal.toFixed(2)}) ` +
          `does not match receipt total (${data.amount.toFixed(2)}).`,
      );
    }
  }

  const dateObj = new Date(data.date);
  if (Number.isNaN(dateObj.getTime())) {
    warnings.push(`Parsed date "${data.date}" is not a valid date.`);
  }

  return warnings;
}

// ── Main pipeline ----------------------------------------------------------

/**
 * Process a receipt image and return structured, validated data.
 *
 * @param imageBase64 - The receipt image encoded as a base-64 string
 *                      (without the `data:` prefix).
 * @returns Structured receipt data with a confidence estimate.
 */
export async function processReceipt(
  imageBase64: string,
): Promise<{ data: ReceiptData; warnings: string[] }> {
  if (!imageBase64 || imageBase64.trim().length === 0) {
    throw new Error("imageBase64 must be a non-empty string.");
  }

  const provider = new DeepSeekProvider();
  const ocrResult = await provider.ocr(imageBase64);

  const data: ReceiptData = {
    vendor: ocrResult.vendor,
    amount: ocrResult.amount,
    date: ocrResult.date,
    category: normaliseCategory(ocrResult.category),
    lineItems: ocrResult.lineItems,
    taxInfo: ocrResult.taxInfo,
    currency: ocrResult.currency,
    rawText: ocrResult.rawText,
    confidence: estimateConfidence(ocrResult),
  };

  const warnings = validateReceipt(data);

  return { data, warnings };
}
