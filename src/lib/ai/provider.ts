// ---------------------------------------------------------------------------
// AI Provider Abstraction
// ---------------------------------------------------------------------------

/** A single message in a chat conversation. */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ChatMessagePart[];
}

/** Multi-modal message part (text or image). */
export type ChatMessagePart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };

/** Options forwarded to the underlying model. */
export interface ChatOptions {
  /** Model temperature (0-2). */
  temperature?: number;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Optional JSON mode – instruct the model to return valid JSON. */
  jsonMode?: boolean;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

/** The provider's chat completion response. */
export interface ChatResponse {
  content: string;
  finishReason: "stop" | "length" | "content_filter" | "error";
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** A single line item extracted from a receipt. */
export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/** Tax breakdown extracted from a receipt. */
export interface TaxInfo {
  /** e.g. "GST", "VAT", "Sales Tax" */
  type: string;
  rate: number | null;
  amount: number;
}

/** Structured data returned by OCR processing. */
export interface OCRResult {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  lineItems: LineItem[];
  taxInfo: TaxInfo[];
  currency: string;
  rawText: string;
}

/**
 * Abstract interface every AI provider must implement.
 *
 * This allows swapping DeepSeek for OpenAI, Anthropic, or any other provider
 * without changing calling code.
 */
export interface AIProvider {
  /** Run a chat completion. */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  /** Extract structured receipt data from a base-64 encoded image. */
  ocr(imageBase64: string): Promise<OCRResult>;
}
