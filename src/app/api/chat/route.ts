import { NextRequest, NextResponse } from "next/server";
import {
  initSchema,
  saveChatMessage,
  getTransactions,
  getBalanceSheet,
  getProfitLoss,
  getAccountBalances,
  getDashboardStats,
  getUserById,
} from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

function buildSystemPrompt(financialContext: string) {
  return `You are the AI assistant for Numba, an AI accounting assistant for small businesses and freelancers.

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
- You have FULL ACCESS to the user's financial data below. Use it to answer questions accurately.
- NEVER say you don't have access to data. You DO have it — it's provided below.

=== USER'S FINANCIAL DATA ===
${financialContext}
=== END FINANCIAL DATA ===

Use the above data to answer all questions about the user's finances. Respond naturally and helpfully.`;
}

async function getFinancialContext(userId: string): Promise<string> {
  try {
    const [user, stats, balances, recentTxns, balanceSheet, profitLoss] = await Promise.all([
      getUserById(userId),
      getDashboardStats(userId),
      getAccountBalances(userId),
      getTransactions(userId, { limit: 20 }),
      getBalanceSheet(userId),
      getProfitLoss(userId),
    ]);

    const currency = user?.currency || "INR";
    const fmt = (n: number) => `${currency} ${Number(n || 0).toLocaleString("en-IN")}`;

    let ctx = `Business: ${user?.business_name || "N/A"} | Country: ${user?.country || "N/A"} | Currency: ${currency}\n\n`;

    // Dashboard summary
    ctx += `--- SUMMARY ---\n`;
    ctx += `Total Revenue: ${fmt(stats.revenue)}\n`;
    ctx += `Total Expenses: ${fmt(stats.expenses)}\n`;
    ctx += `Net Profit: ${fmt(stats.netProfit)}\n`;
    ctx += `Pending Receipts: ${stats.pendingReceipts}\n`;
    ctx += `Total Transactions: ${stats.totalTransactions}\n\n`;

    // Account balances
    const nonZeroBalances = balances.filter((a: any) => Number(a.balance) !== 0);
    if (nonZeroBalances.length > 0) {
      ctx += `--- ACCOUNT BALANCES ---\n`;
      for (const a of nonZeroBalances) {
        ctx += `${a.code} ${a.name} (${a.type}): ${fmt(a.balance)}\n`;
      }
      ctx += `\n`;
    }

    // Balance Sheet
    ctx += `--- BALANCE SHEET ---\n`;
    ctx += `Total Assets: ${fmt(balanceSheet.totalAssets)}\n`;
    for (const a of balanceSheet.assets.items) {
      ctx += `  ${a.name}: ${fmt(a.balance)}\n`;
    }
    ctx += `Total Liabilities: ${fmt(balanceSheet.liabilities.total)}\n`;
    for (const a of balanceSheet.liabilities.items) {
      ctx += `  ${a.name}: ${fmt(a.balance)}\n`;
    }
    ctx += `Total Equity: ${fmt(balanceSheet.equity.total)}\n`;
    for (const a of balanceSheet.equity.items) {
      ctx += `  ${a.name}: ${fmt(a.balance)}\n`;
    }
    ctx += `Net Income: ${fmt(balanceSheet.equity.netIncome)}\n`;
    ctx += `Balanced: ${balanceSheet.isBalanced ? "Yes" : "No"}\n\n`;

    // P&L
    ctx += `--- PROFIT & LOSS ---\n`;
    ctx += `Revenue: ${fmt(profitLoss.revenue.total)}\n`;
    for (const r of profitLoss.revenue.items) {
      ctx += `  ${r.name}: ${fmt(r.balance)}\n`;
    }
    ctx += `Expenses: ${fmt(profitLoss.expenses.total)}\n`;
    for (const e of profitLoss.expenses.items) {
      ctx += `  ${e.name}: ${fmt(e.balance)}\n`;
    }
    ctx += `Net Profit: ${fmt(profitLoss.netProfit)} (${profitLoss.profitMargin.toFixed(1)}% margin)\n\n`;

    // Recent transactions
    if (recentTxns.length > 0) {
      ctx += `--- RECENT TRANSACTIONS (last 20) ---\n`;
      for (const t of recentTxns) {
        const type = t.type === "income" ? "INCOME" : "EXPENSE";
        ctx += `${t.date} | ${t.description} | ${type} | ${fmt(t.amount)} | ${t.status}\n`;
      }
      ctx += `\n`;

      // Expense breakdown by category
      const expenseByCategory: Record<string, number> = {};
      for (const t of recentTxns) {
        if (t.type === "expense" && t.lines) {
          const expLine = t.lines.find((l: any) => l.account_type === "expense");
          const cat = expLine?.account_name || "Other";
          expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(t.amount || 0);
        }
      }
      if (Object.keys(expenseByCategory).length > 0) {
        ctx += `--- EXPENSE BREAKDOWN (recent) ---\n`;
        for (const [cat, amt] of Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])) {
          ctx += `${cat}: ${fmt(amt)}\n`;
        }
      }
    }

    return ctx;
  } catch (err) {
    console.error("Failed to build financial context:", err);
    return "No financial data available yet. The user may need to add transactions first.";
  }
}

export async function POST(request: NextRequest) {
  try {
    await initSchema();

    const userId = request.headers.get("x-user-id");
    const { message, history = [], sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const chatSessionId = sessionId || uuidv4();

    // Persist user message
    if (userId) {
      await saveChatMessage(userId, chatSessionId, "user", message);
    }

    // Fetch real financial data
    const financialContext = userId ? await getFinancialContext(userId) : "No user logged in.";

    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.startsWith("placeholder")) {
      // Smart fallback using real data
      const response = buildFallbackResponse(message, financialContext);

      if (userId) {
        await saveChatMessage(userId, chatSessionId, "assistant", response);
      }

      return NextResponse.json({ response, sessionId: chatSessionId });
    }

    const messages = [
      { role: "system" as const, content: buildSystemPrompt(financialContext) },
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

    if (userId) {
      await saveChatMessage(userId, chatSessionId, "assistant", content);
    }

    return NextResponse.json({ response: content, sessionId: chatSessionId });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({
      response: "Sorry, something went wrong. Please try again.",
    });
  }
}

function buildFallbackResponse(message: string, context: string): string {
  const lower = message.toLowerCase();

  // Parse context lines for data
  const lines = context.split("\n");
  const getValue = (prefix: string) => {
    const line = lines.find(l => l.startsWith(prefix));
    return line ? line.split(":").slice(1).join(":").trim() : null;
  };

  const totalRevenue = getValue("Total Revenue");
  const totalExpenses = getValue("Total Expenses");
  const netProfit = getValue("Net Profit");
  const totalTxns = getValue("Total Transactions");
  const pendingReceipts = getValue("Pending Receipts");
  const businessLine = lines[0] || "";

  if (lower.includes("balance sheet")) {
    // Extract balance sheet section
    const bsStart = context.indexOf("--- BALANCE SHEET ---");
    const bsEnd = context.indexOf("--- PROFIT", bsStart);
    if (bsStart !== -1) {
      const bsSection = context.slice(bsStart + 22, bsEnd !== -1 ? bsEnd : undefined).trim();
      const bsLines = bsSection.split("\n").filter(l => l.trim());
      let response = `**Balance Sheet**\n\n`;
      for (const line of bsLines) {
        if (line.startsWith("Total") || line.startsWith("Net") || line.startsWith("Balanced")) {
          response += `**${line}**\n`;
        } else if (line.startsWith("  ")) {
          response += `- ${line.trim()}\n`;
        } else {
          response += `\n**${line}**\n`;
        }
      }
      return response;
    }
    return `No balance sheet data available yet. Add some transactions first!`;
  }

  if (lower.includes("profit") || lower.includes("loss") || lower.includes("p&l")) {
    const plStart = context.indexOf("--- PROFIT & LOSS ---");
    const plEnd = context.indexOf("--- RECENT", plStart);
    if (plStart !== -1) {
      const plSection = context.slice(plStart + 22, plEnd !== -1 ? plEnd : undefined).trim();
      const plLines = plSection.split("\n").filter(l => l.trim());
      let response = `**Profit & Loss Statement**\n\n`;
      for (const line of plLines) {
        if (line.startsWith("Revenue:") || line.startsWith("Expenses:") || line.startsWith("Net Profit:")) {
          response += `**${line}**\n`;
        } else if (line.startsWith("  ")) {
          response += `- ${line.trim()}\n`;
        }
      }
      return response;
    }
    return `No P&L data available yet. Add some transactions first!`;
  }

  if (lower.includes("spend") || lower.includes("expense")) {
    const ebStart = context.indexOf("--- EXPENSE BREAKDOWN");
    if (ebStart !== -1) {
      const ebSection = context.slice(ebStart + 35).trim();
      const ebLines = ebSection.split("\n").filter(l => l.trim());
      let response = `**Your Expense Breakdown (recent):**\n\n| Category | Amount |\n|----------|--------|\n`;
      for (const line of ebLines) {
        const [cat, amt] = line.split(":").map(s => s.trim());
        if (cat && amt) response += `| ${cat} | ${amt} |\n`;
      }
      response += `\n**Total Expenses:** ${totalExpenses || "N/A"}`;
      return response;
    }
    return totalExpenses ? `Your total expenses so far: **${totalExpenses}**. Add more transactions for a detailed breakdown.` : `No expenses recorded yet.`;
  }

  if (lower.includes("revenue") || lower.includes("income") || lower.includes("earning")) {
    return totalRevenue ? `**Total Revenue:** ${totalRevenue}\n**Net Profit:** ${netProfit || "N/A"}` : `No revenue recorded yet.`;
  }

  if (lower.includes("transaction")) {
    const txStart = context.indexOf("--- RECENT TRANSACTIONS");
    if (txStart !== -1) {
      const txEnd = context.indexOf("--- EXPENSE", txStart);
      const txSection = context.slice(txStart + 40, txEnd !== -1 ? txEnd : undefined).trim();
      const txLines = txSection.split("\n").filter(l => l.trim()).slice(0, 10);
      let response = `**Recent Transactions:**\n\n| Date | Description | Type | Amount |\n|------|-------------|------|--------|\n`;
      for (const line of txLines) {
        const parts = line.split(" | ");
        if (parts.length >= 4) {
          response += `| ${parts[0]} | ${parts[1]} | ${parts[2]} | ${parts[3]} |\n`;
        }
      }
      response += `\n**Total Transactions:** ${totalTxns || "0"}`;
      return response;
    }
    return `No transactions recorded yet. Create your first transaction to get started!`;
  }

  if (lower.includes("summary") || lower.includes("overview") || lower.includes("dashboard") || lower.includes("how am i") || lower.includes("how's my")) {
    return `**Financial Summary**\n\n${businessLine}\n\n- **Revenue:** ${totalRevenue || "₹0"}\n- **Expenses:** ${totalExpenses || "₹0"}\n- **Net Profit:** ${netProfit || "₹0"}\n- **Total Transactions:** ${totalTxns || "0"}\n- **Pending Receipts:** ${pendingReceipts || "0"}\n\nAsk me for a detailed balance sheet, P&L, or expense breakdown!`;
  }

  if (lower.includes("gst") || lower.includes("tax")) {
    return `To provide accurate tax/GST information, I need to analyze your transactions with tax codes. Currently your summary shows:\n\n- **Revenue:** ${totalRevenue || "₹0"}\n- **Expenses:** ${totalExpenses || "₹0"}\n\nMake sure your transactions have tax codes attached for accurate GST calculations.`;
  }

  // Default
  return `I have access to your financial data. Here's a quick summary:\n\n- **Revenue:** ${totalRevenue || "₹0"}\n- **Expenses:** ${totalExpenses || "₹0"}\n- **Net Profit:** ${netProfit || "₹0"}\n- **Transactions:** ${totalTxns || "0"}\n\nI can help you with:\n- **"Show my balance sheet"** — full asset/liability breakdown\n- **"Show P&L"** — profit & loss statement\n- **"What did I spend?"** — expense breakdown by category\n- **"Recent transactions"** — your latest entries\n- **"Financial summary"** — overview dashboard\n\nWhat would you like to know?`;
}
