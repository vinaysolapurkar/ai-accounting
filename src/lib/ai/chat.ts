// ---------------------------------------------------------------------------
// Chat Engine – Accounting Assistant
// ---------------------------------------------------------------------------

import type { ChatMessage, ChatOptions } from "./provider";
import { DeepSeekProvider } from "./deepseek";

// ── Public types -----------------------------------------------------------

export interface ChatContext {
  country: string;
  currency: string;
  recentTransactions: TransactionSummary[];
}

export interface TransactionSummary {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
}

export type Intent = "QUERY" | "ACTION" | "REPORT" | "GENERAL";

/** Base fields shared by every response. */
interface BaseResponse {
  intent: Intent;
  message: string;
}

/** QUERY – the user is asking for data. */
export interface QueryResponse extends BaseResponse {
  intent: "QUERY";
  queryIntent: QueryIntentDescriptor;
}

export interface QueryIntentDescriptor {
  entity: string;
  filters: Record<string, unknown>;
  dateRange?: { from: string; to: string };
  aggregation?: string;
  groupBy?: string;
}

/** ACTION – the user wants to modify data. */
export interface ActionResponse extends BaseResponse {
  intent: "ACTION";
  action: ActionDescriptor;
}

export interface ActionDescriptor {
  type: string;
  params: Record<string, unknown>;
  confirmationPrompt: string;
}

/** REPORT – the user wants a report generated. */
export interface ReportResponse extends BaseResponse {
  intent: "REPORT";
  report: ReportDescriptor;
}

export interface ReportDescriptor {
  type: string;
  params: Record<string, unknown>;
}

/** GENERAL – freeform accounting help. */
export interface GeneralResponse extends BaseResponse {
  intent: "GENERAL";
}

export type ChatEngineResponse =
  | QueryResponse
  | ActionResponse
  | ReportResponse
  | GeneralResponse;

// ── System prompt ----------------------------------------------------------

function buildSystemPrompt(ctx: ChatContext): string {
  const txSummary =
    ctx.recentTransactions.length > 0
      ? ctx.recentTransactions
          .slice(0, 10)
          .map(
            (t) =>
              `  ${t.date} | ${t.type} | ${t.category} | ${t.amount} ${ctx.currency} | ${t.description}`,
          )
          .join("\n")
      : "  (no recent transactions)";

  return [
    "You are LedgerAI, a professional AI accounting assistant.",
    "",
    `The user is located in ${ctx.country} and uses ${ctx.currency} as their primary currency.`,
    "",
    "Recent transactions:",
    txSummary,
    "",
    "Your job is to classify the user's message into one of four intents and respond with a JSON object.",
    "",
    "Intents:",
    '  QUERY   – The user wants to look up or search financial data (e.g. "Show me expenses last month").',
    '  ACTION  – The user wants to create, update, or delete data (e.g. "Record a payment of $50 to AWS").',
    '  REPORT  – The user wants a financial report (e.g. "Generate a P&L for Q1").',
    '  GENERAL – General accounting question or small talk (e.g. "What is depreciation?").',
    "",
    "Response format – always return valid JSON matching ONE of these shapes:",
    "",
    "For QUERY:",
    '{',
    '  "intent": "QUERY",',
    '  "message": "<natural language summary for the user>",',
    '  "queryIntent": {',
    '    "entity": "<transactions | accounts | invoices | ...>",',
    '    "filters": { "<field>": "<value>", ... },',
    '    "dateRange": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },',
    '    "aggregation": "<sum | count | avg | null>",',
    '    "groupBy": "<field | null>"',
    '  }',
    '}',
    "",
    "For ACTION:",
    '{',
    '  "intent": "ACTION",',
    '  "message": "<natural language summary>",',
    '  "action": {',
    '    "type": "<create_transaction | update_transaction | delete_transaction | create_invoice | ...>",',
    '    "params": { ... },',
    '    "confirmationPrompt": "<question to confirm with the user>"',
    '  }',
    '}',
    "",
    "For REPORT:",
    '{',
    '  "intent": "REPORT",',
    '  "message": "<natural language summary>",',
    '  "report": {',
    '    "type": "<profit_loss | balance_sheet | cash_flow | expense_summary | tax_report | ...>",',
    '    "params": { "from": "...", "to": "...", ... }',
    '  }',
    '}',
    "",
    "For GENERAL:",
    '{',
    '  "intent": "GENERAL",',
    '  "message": "<helpful accounting answer>"',
    '}',
    "",
    "Rules:",
    "- NEVER include raw SQL in your response.",
    "- Dates should be ISO-8601 (YYYY-MM-DD).",
    "- Monetary values should be plain numbers, no currency symbols.",
    "- Be concise and professional.",
    "- Return ONLY the JSON object, no markdown fences or commentary.",
  ].join("\n");
}

// ── Engine -----------------------------------------------------------------

/**
 * Process a user message and return a structured response with intent
 * classification and the appropriate payload.
 */
export async function processMessage(
  userId: string,
  message: string,
  context: ChatContext,
): Promise<ChatEngineResponse> {
  if (!message || message.trim().length === 0) {
    return {
      intent: "GENERAL",
      message: "It looks like your message was empty. How can I help you with your accounting?",
    };
  }

  const provider = new DeepSeekProvider();

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(context) },
    { role: "user", content: message },
  ];

  const options: ChatOptions = {
    temperature: 0.1,
    maxTokens: 2048,
    jsonMode: true,
  };

  const response = await provider.chat(messages, options);
  return parseEngineResponse(response.content);
}

// ── Response parsing -------------------------------------------------------

function parseEngineResponse(raw: string): ChatEngineResponse {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // If the model returned something unparseable, wrap it as GENERAL.
    return {
      intent: "GENERAL",
      message: raw,
    };
  }

  const intent = String(parsed.intent ?? "GENERAL").toUpperCase() as Intent;
  const message = String(parsed.message ?? "");

  switch (intent) {
    case "QUERY":
      return {
        intent: "QUERY",
        message,
        queryIntent: normaliseQueryIntent(parsed.queryIntent),
      };
    case "ACTION":
      return {
        intent: "ACTION",
        message,
        action: normaliseAction(parsed.action),
      };
    case "REPORT":
      return {
        intent: "REPORT",
        message,
        report: normaliseReport(parsed.report),
      };
    case "GENERAL":
    default:
      return { intent: "GENERAL", message };
  }
}

function normaliseQueryIntent(raw: unknown): QueryIntentDescriptor {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    entity: String(obj.entity ?? "transactions"),
    filters: (typeof obj.filters === "object" && obj.filters !== null
      ? obj.filters
      : {}) as Record<string, unknown>,
    dateRange: normaliseDateRange(obj.dateRange),
    aggregation: obj.aggregation != null ? String(obj.aggregation) : undefined,
    groupBy: obj.groupBy != null ? String(obj.groupBy) : undefined,
  };
}

function normaliseDateRange(
  raw: unknown,
): { from: string; to: string } | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  if (obj.from && obj.to) {
    return { from: String(obj.from), to: String(obj.to) };
  }
  return undefined;
}

function normaliseAction(raw: unknown): ActionDescriptor {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    type: String(obj.type ?? "unknown"),
    params: (typeof obj.params === "object" && obj.params !== null
      ? obj.params
      : {}) as Record<string, unknown>,
    confirmationPrompt: String(
      obj.confirmationPrompt ?? "Please confirm this action.",
    ),
  };
}

function normaliseReport(raw: unknown): ReportDescriptor {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    type: String(obj.type ?? "expense_summary"),
    params: (typeof obj.params === "object" && obj.params !== null
      ? obj.params
      : {}) as Record<string, unknown>,
  };
}
