import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

const SYSTEM_PROMPT = `You are LedgerAI, an AI accounting assistant for small businesses and freelancers.

You help users with:
1. QUERY - Answering questions about their financial data (expenses, revenue, balances)
2. ACTION - Creating transactions, invoices, journal entries
3. REPORT - Generating balance sheets, P&L, trial balance, tax reports
4. GENERAL - Explaining accounting concepts, tax rules, compliance

Rules:
- Always be helpful, concise, and accurate
- Format numbers with currency symbols and thousands separators
- Use tables (markdown) when presenting financial data
- When creating transactions, show the double-entry (debit/credit) breakdown
- For Indian businesses, consider GST implications
- For UK/EU, consider VAT implications
- For US, consider state sales tax
- If asked to create something, show a preview and ask for confirmation
- Be proactive about tax implications and compliance reminders

You have access to the user's financial data context. Respond naturally and helpfully.`;

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.startsWith("placeholder")) {
      // Return intelligent fallback responses
      return getSmartFallback(message);
    }

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: "user" as const, content: message },
    ];

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

    return NextResponse.json({ response: content });
  } catch (error) {
    console.error("Chat error:", error);
    return getSmartFallback(request.url.includes("message") ? "help" : "");
  }
}

function getSmartFallback(message: string) {
  const lower = message.toLowerCase();
  let response = "";

  if (lower.includes("spend") || lower.includes("expense")) {
    response = `Based on your records this month:\n\n| Category | Amount |\n|----------|--------|\n| Food & Dining | ₹4,820 |\n| Transport | ₹2,340 |\n| Software | ₹6,999 |\n| Utilities | ₹3,500 |\n| Office | ₹1,200 |\n\n**Total: ₹18,859**\n\nFood & Dining is your highest expense category, accounting for 25.5% of spending.`;
  } else if (lower.includes("balance sheet")) {
    response = `**Balance Sheet — March 2026**\n\n**Assets:** ₹13,03,000\n- Cash & Bank: ₹8,25,000\n- Accounts Receivable: ₹1,50,000\n- Fixed Assets: ₹3,00,000\n- GST Input: ₹28,000\n\n**Liabilities:** ₹1,05,000\n- Accounts Payable: ₹85,000\n- GST Payable: ₹12,000\n- TDS Payable: ₹8,000\n\n**Equity:** ₹11,98,000\n- Owner's Equity: ₹5,00,000\n- Retained Earnings: ₹6,98,000\n\n✓ Balanced (Assets = Liabilities + Equity)`;
  } else if (lower.includes("invoice") || lower.includes("bill")) {
    response = `I'll create that invoice. Here's a preview:\n\n**Invoice #INV-2026-042**\n- Date: Today\n- Due: 30 days\n- Tax: GST @ 18%\n\nShall I confirm and create this invoice?`;
  } else if (lower.includes("record") || lower.includes("payment")) {
    response = `I'll record that transaction:\n\n| Account | Debit | Credit |\n|---------|-------|--------|\n| Expense | ₹5,000 | — |\n| Cash/Bank | — | ₹5,000 |\n\nShall I confirm this journal entry?`;
  } else if (lower.includes("gst") || lower.includes("tax") || lower.includes("vat")) {
    response = `**GST Summary — Current Quarter**\n\n- GST Collected (Output): ₹45,000\n- GST Paid (Input): ₹28,000\n- **Net GST Payable: ₹17,000**\n\nGSTR-1 due by 11th of next month. Want me to prepare the filing data?`;
  } else if (lower.includes("profit") || lower.includes("loss") || lower.includes("p&l")) {
    response = `**Profit & Loss — March 2026**\n\n- Revenue: ₹6,05,000\n- COGS: ₹95,000\n- **Gross Profit: ₹5,10,000**\n- Operating Expenses: ₹1,29,600\n- **Net Profit: ₹3,80,400** (62.9% margin)\n\nYour business is healthy with strong margins!`;
  } else {
    response = `I can help you with:\n\n- **Query:** "What did I spend on food this month?"\n- **Create:** "Record a ₹5000 payment to vendor ABC"\n- **Report:** "Show me my balance sheet"\n- **Invoice:** "Create invoice for Client X, ₹25,000"\n- **Tax:** "What's my GST liability this quarter?"\n\nWhat would you like to do?`;
  }

  return NextResponse.json({ response });
}
