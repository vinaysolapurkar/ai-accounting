import type { Account, TransactionLine, Transaction } from "@/lib/supabase/types";
import { _getStore } from "./transactions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LedgerEntry {
  transactionId: string;
  transactionDate: string;
  description: string;
  referenceNumber: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
  status: Transaction["status"];
}

export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountCode: string;
  accountType: Account["type"];
  debitTotal: number;
  creditTotal: number;
  /** Net balance using normal-balance convention:
   *  Assets & Expenses → debit - credit
   *  Liabilities, Equity & Revenue → credit - debit */
  balance: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Accounts with a "debit-normal" balance (balance increases with debits). */
const DEBIT_NORMAL_TYPES: Set<Account["type"]> = new Set(["asset", "expense"]);

function computeBalance(
  type: Account["type"],
  totalDebit: number,
  totalCredit: number
): number {
  if (DEBIT_NORMAL_TYPES.has(type)) {
    return Math.round((totalDebit - totalCredit) * 100) / 100;
  }
  return Math.round((totalCredit - totalDebit) * 100) / 100;
}

/**
 * Resolves an account from the store by id.
 * Falls back to a synthetic account derived from the id when the store has
 * no matching account record (common during early dev).
 */
function resolveAccount(accountId: string): Account {
  const store = _getStore();
  const found = store.accounts.find((a) => a.id === accountId);
  if (found) return found;

  // Derive from deterministic id pattern: "{userId}__acct__{code}"
  const codePart = accountId.split("__acct__")[1] ?? "0000";
  return {
    id: accountId,
    user_id: "",
    name: `Account ${codePart}`,
    code: codePart,
    type: "asset",
    parent_id: null,
    is_system: false,
    created_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the balance of a single account as of the given date (inclusive).
 * Only confirmed and reconciled transactions are included.
 */
export async function getAccountBalance(
  accountId: string,
  asOfDate: string
): Promise<AccountBalance> {
  const store = _getStore();
  const account = resolveAccount(accountId);

  // Gather confirmed / reconciled transactions on or before asOfDate
  const eligibleTxnIds = new Set(
    store.transactions
      .filter(
        (t) =>
          t.date <= asOfDate &&
          (t.status === "confirmed" || t.status === "reconciled")
      )
      .map((t) => t.id)
  );

  let debitTotal = 0;
  let creditTotal = 0;

  for (const line of store.lines) {
    if (line.account_id === accountId && eligibleTxnIds.has(line.transaction_id)) {
      debitTotal += line.debit;
      creditTotal += line.credit;
    }
  }

  debitTotal = Math.round(debitTotal * 100) / 100;
  creditTotal = Math.round(creditTotal * 100) / 100;

  return {
    accountId: account.id,
    accountName: account.name,
    accountCode: account.code,
    accountType: account.type,
    debitTotal,
    creditTotal,
    balance: computeBalance(account.type, debitTotal, creditTotal),
  };
}

/**
 * Returns all ledger entries for an account within the given date range,
 * together with a running balance column.
 *
 * The running balance starts from the opening balance (all entries before
 * startDate) and accumulates through each entry in chronological order.
 */
export async function getAccountLedger(
  accountId: string,
  dateRange: DateRange
): Promise<{ account: Account; openingBalance: number; entries: LedgerEntry[] }> {
  const store = _getStore();
  const account = resolveAccount(accountId);
  const isDebitNormal = DEBIT_NORMAL_TYPES.has(account.type);

  // Build transaction lookup
  const txnMap = new Map<string, Transaction>();
  for (const t of store.transactions) {
    if (t.status === "confirmed" || t.status === "reconciled") {
      txnMap.set(t.id, t);
    }
  }

  // Gather all lines for this account with confirmed / reconciled transactions
  const accountLines: { line: TransactionLine; txn: Transaction }[] = [];
  for (const line of store.lines) {
    if (line.account_id !== accountId) continue;
    const txn = txnMap.get(line.transaction_id);
    if (!txn) continue;
    accountLines.push({ line, txn });
  }

  // Sort chronologically
  accountLines.sort((a, b) => a.txn.date.localeCompare(b.txn.date));

  // Compute opening balance (before startDate)
  let openingDebit = 0;
  let openingCredit = 0;
  const inRange: typeof accountLines = [];

  for (const entry of accountLines) {
    if (entry.txn.date < dateRange.startDate) {
      openingDebit += entry.line.debit;
      openingCredit += entry.line.credit;
    } else if (entry.txn.date <= dateRange.endDate) {
      inRange.push(entry);
    }
  }

  const openingBalance = computeBalance(account.type, openingDebit, openingCredit);

  // Build entries with running balance
  let running = openingBalance;
  const entries: LedgerEntry[] = inRange.map(({ line, txn }) => {
    const delta = isDebitNormal
      ? line.debit - line.credit
      : line.credit - line.debit;
    running = Math.round((running + delta) * 100) / 100;

    return {
      transactionId: txn.id,
      transactionDate: txn.date,
      description: line.description ?? txn.description,
      referenceNumber: txn.reference_number,
      debit: line.debit,
      credit: line.credit,
      runningBalance: running,
      status: txn.status,
    };
  });

  return { account, openingBalance, entries };
}

/**
 * Returns balances for every account that the user has at least one
 * transaction line for, as of the given date.
 */
export async function getAllBalances(
  userId: string,
  asOfDate: string
): Promise<AccountBalance[]> {
  const store = _getStore();

  // Eligible transactions
  const eligibleTxns = store.transactions.filter(
    (t) =>
      t.user_id === userId &&
      t.date <= asOfDate &&
      (t.status === "confirmed" || t.status === "reconciled")
  );
  const eligibleTxnIds = new Set(eligibleTxns.map((t) => t.id));

  // Accumulate per account
  const accum = new Map<string, { debit: number; credit: number }>();
  for (const line of store.lines) {
    if (!eligibleTxnIds.has(line.transaction_id)) continue;
    const cur = accum.get(line.account_id) ?? { debit: 0, credit: 0 };
    cur.debit += line.debit;
    cur.credit += line.credit;
    accum.set(line.account_id, cur);
  }

  // Convert to AccountBalance[]
  const balances: AccountBalance[] = [];
  for (const [accountId, totals] of accum) {
    const account = resolveAccount(accountId);
    const debitTotal = Math.round(totals.debit * 100) / 100;
    const creditTotal = Math.round(totals.credit * 100) / 100;
    balances.push({
      accountId: account.id,
      accountName: account.name,
      accountCode: account.code,
      accountType: account.type,
      debitTotal,
      creditTotal,
      balance: computeBalance(account.type, debitTotal, creditTotal),
    });
  }

  // Sort by account code
  balances.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  return balances;
}
