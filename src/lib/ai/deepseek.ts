// ---------------------------------------------------------------------------
// DeepSeek AI Provider Implementation
// ---------------------------------------------------------------------------

import type {
  AIProvider,
  ChatMessage,
  ChatMessagePart,
  ChatOptions,
  ChatResponse,
  OCRResult,
} from "./provider";

// ── Helpers ----------------------------------------------------------------

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/** Errors thrown by the DeepSeek provider. */
export class DeepSeekError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "DeepSeekError";
  }
}

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new DeepSeekError(
      "DEEPSEEK_API_KEY is not set. Please add it to your environment variables.",
    );
  }
  return key;
}

/** Returns true for status codes that are safe to retry. */
function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Pause execution for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Types for the DeepSeek API request / response --------------------------

interface DeepSeekRequestBody {
  model: string;
  messages: Array<{
    role: string;
    content: string | ChatMessagePart[];
  }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

interface DeepSeekResponseBody {
  id: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ── Provider ---------------------------------------------------------------

export class DeepSeekProvider implements AIProvider {
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? getApiKey();
  }

  // -- chat -----------------------------------------------------------------

  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<ChatResponse> {
    const body: DeepSeekRequestBody = {
      model: DEFAULT_MODEL,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.maxTokens !== undefined && { max_tokens: options.maxTokens }),
      ...(options.jsonMode && { response_format: { type: "json_object" as const } }),
    };

    const data = await this.request<DeepSeekResponseBody>(
      "/chat/completions",
      body,
      options.signal,
    );

    const choice = data.choices[0];
    if (!choice) {
      throw new DeepSeekError("DeepSeek returned an empty choices array.");
    }

    return {
      content: choice.message.content,
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  // -- ocr ------------------------------------------------------------------

  async ocr(imageBase64: string): Promise<OCRResult> {
    const mimeType = this.inferMimeType(imageBase64);
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: [
          "You are an expert receipt / invoice OCR engine.",
          "Analyse the provided image and return a JSON object with exactly these fields:",
          "  vendor (string) – the merchant or business name",
          '  amount (number) – total amount paid, e.g. 42.99 (no currency symbol)',
          '  date (string) – date of the transaction in ISO-8601 format (YYYY-MM-DD)',
          '  category (string) – one of: "Food & Dining", "Transportation", "Office Supplies",',
          '    "Utilities", "Entertainment", "Healthcare", "Travel", "Software & Subscriptions",',
          '    "Professional Services", "Other"',
          "  lineItems (array) – each item: { description, quantity, unitPrice, total }",
          "  taxInfo (array) – each tax: { type, rate, amount }  (type e.g. GST/VAT/Sales Tax)",
          "  currency (string) – ISO 4217 currency code, e.g. USD, INR, EUR",
          '  rawText (string) – full OCR\'d text of the receipt',
          "",
          "Return ONLY the JSON object, no markdown fences, no commentary.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          { type: "text", text: "Extract all data from this receipt image." },
        ],
      },
    ];

    const response = await this.chat(messages, {
      temperature: 0,
      maxTokens: 4096,
      jsonMode: true,
    });

    return this.parseOCRResponse(response.content);
  }

  // -- internal helpers -----------------------------------------------------

  private async request<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        await sleep(backoff);
      }

      let res: Response;
      try {
        res = await fetch(`${DEEPSEEK_BASE_URL}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          signal,
        });
      } catch (err) {
        // Network-level error (DNS failure, timeout, etc.)
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (isRetryable(res.status) && attempt < MAX_RETRIES - 1) {
          lastError = new DeepSeekError(
            `DeepSeek API ${res.status}: ${text}`,
            res.status,
            text,
          );
          continue;
        }
        throw new DeepSeekError(
          `DeepSeek API request failed (${res.status}): ${text}`,
          res.status,
          text,
        );
      }

      return (await res.json()) as T;
    }

    throw lastError ?? new DeepSeekError("Request failed after retries.");
  }

  private mapFinishReason(
    reason: string,
  ): ChatResponse["finishReason"] {
    switch (reason) {
      case "stop":
        return "stop";
      case "length":
        return "length";
      case "content_filter":
        return "content_filter";
      default:
        return "error";
    }
  }

  private inferMimeType(base64: string): string {
    // Check the first few bytes (magic numbers) of the decoded data.
    if (base64.startsWith("/9j/")) return "image/jpeg";
    if (base64.startsWith("iVBOR")) return "image/png";
    if (base64.startsWith("R0lG")) return "image/gif";
    if (base64.startsWith("UklG")) return "image/webp";
    return "image/png"; // safe default
  }

  private parseOCRResponse(raw: string): OCRResult {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new DeepSeekError(
        "Failed to parse OCR JSON response from DeepSeek.",
      );
    }

    // Validate & coerce required fields
    const vendor = String(parsed.vendor ?? "Unknown");
    const amount = Number(parsed.amount ?? 0);
    const date = String(parsed.date ?? new Date().toISOString().slice(0, 10));
    const category = String(parsed.category ?? "Other");
    const currency = String(parsed.currency ?? "USD");
    const rawText = String(parsed.rawText ?? "");

    const lineItems = Array.isArray(parsed.lineItems)
      ? parsed.lineItems.map((item: Record<string, unknown>) => ({
          description: String(item.description ?? ""),
          quantity: Number(item.quantity ?? 1),
          unitPrice: Number(item.unitPrice ?? 0),
          total: Number(item.total ?? 0),
        }))
      : [];

    const taxInfo = Array.isArray(parsed.taxInfo)
      ? parsed.taxInfo.map((tax: Record<string, unknown>) => ({
          type: String(tax.type ?? "Tax"),
          rate: tax.rate != null ? Number(tax.rate) : null,
          amount: Number(tax.amount ?? 0),
        }))
      : [];

    return { vendor, amount, date, category, lineItems, taxInfo, currency, rawText };
  }
}
