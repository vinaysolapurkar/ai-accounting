import type { Account } from "@/lib/supabase/types";
import { getAllBalances, type AccountBalance } from "./ledger";
import { _getStore } from "./transactions";

// ---------------------------------------------------------------------------
// Report data types
// ---------------------------------------------------------------------------

export interface ReportLineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
}

export interface ReportSection {
  title: string;
  items: ReportLineItem[];
  total: number;
}

// ── Balance Sheet ─────────────────────────────────────────────────────────

export interface BalanceSheetReport {
  reportName: "Balance Sheet";
  asOfDate: string;
  generatedAt: string;
  assets: ReportSection;
  liabilities: ReportSection;
  equity: ReportSection;
  /** Should be zero if the books are balanced. */
  checkFigure: number;
}

// ── Profit & Loss ─────────────────────────────────────────────────────────

export interface ProfitLossReport {
  reportName: "Profit & Loss";
  startDate: string;
  endDate: string;
  generatedAt: string;
  revenue: ReportSection;
  costOfGoodsSold: ReportSection;
  grossProfit: number;
  operatingExpenses: ReportSection;
  operatingIncome: number;
  otherIncome: ReportSection;
  otherExpenses: ReportSection;
  netIncome: number;
}

// ── Trial Balance ─────────────────────────────────────────────────────────

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: Account["type"];
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  reportName: "Trial Balance";
  asOfDate: string;
  generatedAt: string;
  rows: TrialBalanceRow[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

// ── Cash Flow ─────────────────────────────────────────────────────────────

export interface CashFlowReport {
  reportName: "Cash Flow Statement";
  startDate: string;
  endDate: string;
  generatedAt: string;
  operating: ReportSection;
  investing: ReportSection;
  financing: ReportSection;
  netCashChange: number;
  openingCashBalance: number;
  closingCashBalance: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toLineItem(b: AccountBalance): ReportLineItem {
  return {
    accountId: b.accountId,
    accountCode: b.accountCode,
    accountName: b.accountName,
    balance: b.balance,
  };
}

function buildSection(title: string, items: ReportLineItem[]): ReportSection {
  return {
    title,
    items,
    total: round2(items.reduce((sum, i) => sum + i.balance, 0)),
  };
}

/**
 * Collect balances scoped to a date range by only considering transactions
 * whose date falls within [startDate, endDate].
 */
function getBalancesForPeriod(
  userId: string,
  startDate: string,
  endDate: string
): AccountBalance[] {
  const store = _getStore();

  const eligibleTxns = store.transactions.filter(
    (t) =>
      t.user_id === userId &&
      t.date >= startDate &&
      t.date <= endDate &&
      (t.status === "confirmed" || t.status === "reconciled")
  );
  const eligibleTxnIds = new Set(eligibleTxns.map((t) => t.id));

  const accum = new Map<string, { debit: number; credit: number }>();
  for (const line of store.lines) {
    if (!eligibleTxnIds.has(line.transaction_id)) continue;
    const cur = accum.get(line.account_id) ?? { debit: 0, credit: 0 };
    cur.debit += line.debit;
    cur.credit += line.credit;
    accum.set(line.account_id, cur);
  }

  const DEBIT_NORMAL: Set<Account["type"]> = new Set(["asset", "expense"]);

  const resolveAccount = (accountId: string) => {
    const found = store.accounts.find((a) => a.id === accountId);
    if (found) return found;
    const codePart = accountId.split("__acct__")[1] ?? "0000";
    return {
      id: accountId,
      user_id: "",
      name: `Account ${codePart}`,
      code: codePart,
      type: "asset" as Account["type"],
      parent_id: null,
      is_system: false,
      created_at: new Date().toISOString(),
    };
  };

  const balances: AccountBalance[] = [];
  for (const [accountId, totals] of accum) {
    const account = resolveAccount(accountId);
    const dt = round2(totals.debit);
    const ct = round2(totals.credit);
    balances.push({
      accountId: account.id,
      accountName: account.name,
      accountCode: account.code,
      accountType: account.type,
      debitTotal: dt,
      creditTotal: ct,
      balance: DEBIT_NORMAL.has(account.type) ? round2(dt - ct) : round2(ct - dt),
    });
  }

  balances.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  return balances;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a Balance Sheet as of the given date.
 * Assets = Liabilities + Equity
 */
export async function generateBalanceSheet(
  userId: string,
  asOfDate: string
): Promise<BalanceSheetReport> {
  const balances = await getAllBalances(userId, asOfDate);

  const assets = buildSection(
    "Assets",
    balances.filter((b) => b.accountType === "asset").map(toLineItem)
  );

  const liabilities = buildSection(
    "Liabilities",
    balances.filter((b) => b.accountType === "liability").map(toLineItem)
  );

  // For the balance sheet, net income (Revenue - Expenses) flows into equity
  const revenueTotal = round2(
    balances
      .filter((b) => b.accountType === "revenue")
      .reduce((s, b) => s + b.balance, 0)
  );
  const expenseTotal = round2(
    balances
      .filter((b) => b.accountType === "expense")
      .reduce((s, b) => s + b.balance, 0)
  );
  const netIncome = round2(revenueTotal - expenseTotal);

  const equityItems = balances
    .filter((b) => b.accountType === "equity")
    .map(toLineItem);

  // Append computed net income as a virtual line item
  equityItems.push({
    accountId: "__net_income__",
    accountCode: "3999",
    accountName: "Net Income (Current Period)",
    balance: netIncome,
  });

  const equity = buildSection("Equity", equityItems);

  const checkFigure = round2(assets.total - liabilities.total - equity.total);

  return {
    reportName: "Balance Sheet",
    asOfDate,
    generatedAt: new Date().toISOString(),
    assets,
    liabilities,
    equity,
    checkFigure,
  };
}

/**
 * Generates a Profit & Loss (Income Statement) for the given period.
 * Net Income = Revenue - COGS - Operating Expenses +/- Other Income/Expenses
 */
export async function generateProfitLoss(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ProfitLossReport> {
  const balances = getBalancesForPeriod(userId, startDate, endDate);

  const revenueItems = balances
    .filter(
      (b) =>
        b.accountType === "revenue" &&
        !b.accountCode.startsWith("4300") &&
        !b.accountCode.startsWith("4400") &&
        !b.accountCode.startsWith("4500")
    )
    .map(toLineItem);

  const cogsItems = balances
    .filter((b) => b.accountCode.startsWith("5"))
    .map(toLineItem);

  const opexItems = balances
    .filter((b) => b.accountCode.startsWith("6"))
    .map(toLineItem);

  const otherIncomeItems = balances
    .filter(
      (b) =>
        b.accountType === "revenue" &&
        (b.accountCode.startsWith("4300") ||
          b.accountCode.startsWith("4400") ||
          b.accountCode.startsWith("4500"))
    )
    .map(toLineItem);

  const otherExpenseItems = balances
    .filter(
      (b) =>
        b.accountType === "expense" &&
        !b.accountCode.startsWith("5") &&
        !b.accountCode.startsWith("6")
    )
    .map(toLineItem);

  const revenue = buildSection("Revenue", revenueItems);
  const costOfGoodsSold = buildSection("Cost of Goods Sold", cogsItems);
  const operatingExpenses = buildSection("Operating Expenses", opexItems);
  const otherIncome = buildSection("Other Income", otherIncomeItems);
  const otherExpenses = buildSection("Other Expenses", otherExpenseItems);

  const grossProfit = round2(revenue.total - costOfGoodsSold.total);
  const operatingIncome = round2(grossProfit - operatingExpenses.total);
  const netIncome = round2(
    operatingIncome + otherIncome.total - otherExpenses.total
  );

  return {
    reportName: "Profit & Loss",
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    revenue,
    costOfGoodsSold,
    grossProfit,
    operatingExpenses,
    operatingIncome,
    otherIncome,
    otherExpenses,
    netIncome,
  };
}

/**
 * Generates a Trial Balance as of the given date.
 * Lists every account with its debit or credit balance and verifies that
 * total debits equal total credits.
 */
export async function generateTrialBalance(
  userId: string,
  asOfDate: string
): Promise<TrialBalanceReport> {
  const balances = await getAllBalances(userId, asOfDate);

  const DEBIT_NORMAL: Set<Account["type"]> = new Set(["asset", "expense"]);

  const rows: TrialBalanceRow[] = balances.map((b) => {
    const isDebitNormal = DEBIT_NORMAL.has(b.accountType);
    // Show positive balances in their normal column
    let debit = 0;
    let credit = 0;

    if (isDebitNormal) {
      if (b.balance >= 0) {
        debit = b.balance;
      } else {
        credit = Math.abs(b.balance);
      }
    } else {
      if (b.balance >= 0) {
        credit = b.balance;
      } else {
        debit = Math.abs(b.balance);
      }
    }

    return {
      accountId: b.accountId,
      accountCode: b.accountCode,
      accountName: b.accountName,
      accountType: b.accountType,
      debit,
      credit,
    };
  });

  const totalDebits = round2(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredits = round2(rows.reduce((s, r) => s + r.credit, 0));

  return {
    reportName: "Trial Balance",
    asOfDate,
    generatedAt: new Date().toISOString(),
    rows,
    totalDebits,
    totalCredits,
    isBalanced: totalDebits === totalCredits,
  };
}

/**
 * Generates a Cash Flow Statement using the indirect method for the operating
 * section, and direct categorisation for investing / financing.
 *
 * Classification heuristic (based on account codes):
 *   - Operating: revenue (4xxx), COGS (5xxx), opex (6xxx), current assets/liabilities
 *   - Investing: fixed assets (15xx), accumulated depreciation (16xx)
 *   - Financing: loans (24xx, 25xx), equity (3xxx)
 */
export async function generateCashFlow(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CashFlowReport> {
  const periodBalances = getBalancesForPeriod(userId, startDate, endDate);

  // Cash accounts for opening / closing
  const allBefore = await getAllBalances(userId, startDate);
  const allEnd = await getAllBalances(userId, endDate);

  const cashCodes = new Set(["1010", "1020", "1100"]);

  const openingCashBalance = round2(
    allBefore
      .filter((b) => cashCodes.has(b.accountCode))
      .reduce((s, b) => s + b.balance, 0)
  );

  const closingCashBalance = round2(
    allEnd
      .filter((b) => cashCodes.has(b.accountCode))
      .reduce((s, b) => s + b.balance, 0)
  );

  // Classify period movements
  const operatingItems: ReportLineItem[] = [];
  const investingItems: ReportLineItem[] = [];
  const financingItems: ReportLineItem[] = [];

  for (const b of periodBalances) {
    const code = b.accountCode;
    const item = toLineItem(b);

    // Skip cash accounts themselves (they're the result, not a driver)
    if (cashCodes.has(code)) continue;

    if (
      code.startsWith("4") || // revenue
      code.startsWith("5") || // COGS
      code.startsWith("6") || // opex
      code.startsWith("12") || // receivables
      code.startsWith("13") || // prepaid
      code.startsWith("14") || // inventory
      code.startsWith("17") || // tax receivables
      code.startsWith("21") || // payables
      code.startsWith("22") || // accrued
      code.startsWith("23") || // unearned
      code.startsWith("26") || // credit cards
      code.startsWith("27")    // tax payables
    ) {
      // For revenue/liability increases -> cash inflow; for expense/asset increases -> cash outflow
      // Flip the sign for asset & expense items so the section reads as cash impact
      if (b.accountType === "asset" || b.accountType === "expense") {
        item.balance = -item.balance;
      }
      operatingItems.push(item);
    } else if (
      code.startsWith("15") || // fixed assets
      code.startsWith("16")    // accumulated depreciation
    ) {
      if (b.accountType === "asset") {
        item.balance = -item.balance;
      }
      investingItems.push(item);
    } else if (
      code.startsWith("24") || // short-term loans
      code.startsWith("25") || // long-term loans
      code.startsWith("3")     // equity
    ) {
      if (b.accountType === "equity" && code === "3200") {
        // Drawings are a cash outflow
        item.balance = -item.balance;
      }
      financingItems.push(item);
    } else {
      // Default: operating
      if (b.accountType === "asset" || b.accountType === "expense") {
        item.balance = -item.balance;
      }
      operatingItems.push(item);
    }
  }

  const operating = buildSection("Operating Activities", operatingItems);
  const investing = buildSection("Investing Activities", investingItems);
  const financing = buildSection("Financing Activities", financingItems);

  const netCashChange = round2(
    operating.total + investing.total + financing.total
  );

  return {
    reportName: "Cash Flow Statement",
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    operating,
    investing,
    financing,
    netCashChange,
    openingCashBalance,
    closingCashBalance,
  };
}
