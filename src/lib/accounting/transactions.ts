import type {
  Transaction,
  TransactionLine,
  Account,
} from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransactionLineInput {
  accountId: string;
  debit: number;
  credit: number;
  taxCode?: string | null;
  taxAmount?: number;
  description?: string | null;
}

export interface CreateTransactionInput {
  date: string;
  description: string;
  referenceNumber?: string | null;
  source?: Transaction["source"];
  currency?: string;
  exchangeRate?: number;
  lines: TransactionLineInput[];
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  status?: Transaction["status"];
  source?: Transaction["source"];
  accountId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionWithLines extends Transaction {
  lines: TransactionLine[];
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export class TransactionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionValidationError";
  }
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateLines(lines: TransactionLineInput[]): void {
  if (!lines || lines.length < 2) {
    throw new TransactionValidationError(
      "A transaction must have at least two lines (double-entry)."
    );
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    if (line.debit < 0 || line.credit < 0) {
      throw new TransactionValidationError(
        "Debit and credit amounts must be non-negative."
      );
    }
    if (line.debit > 0 && line.credit > 0) {
      throw new TransactionValidationError(
        "A single line cannot have both a debit and a credit."
      );
    }
    if (line.debit === 0 && line.credit === 0) {
      throw new TransactionValidationError(
        "Each line must have either a debit or a credit amount."
      );
    }
    totalDebit += line.debit;
    totalCredit += line.credit;
  }

  if (roundCents(totalDebit) !== roundCents(totalCredit)) {
    throw new TransactionValidationError(
      `Debits (${roundCents(totalDebit)}) must equal credits (${roundCents(totalCredit)}).`
    );
  }
}

// ---------------------------------------------------------------------------
// In-memory store (swap for Supabase later)
// ---------------------------------------------------------------------------

interface Store {
  transactions: Transaction[];
  lines: TransactionLine[];
  accounts: Account[];
}

const store: Store = {
  transactions: [],
  lines: [],
  accounts: [],
};

function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateLineId(): string {
  return `ln_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a new transaction with the given journal-entry lines.
 * Validates that total debits === total credits (double-entry accounting).
 *
 * Returns the created transaction together with its lines.
 */
export async function createTransaction(
  userId: string,
  data: CreateTransactionInput
): Promise<TransactionWithLines> {
  // 1. Validate
  validateLines(data.lines);

  // 2. Build the transaction header
  const now = new Date().toISOString();
  const txn: Transaction = {
    id: generateId(),
    user_id: userId,
    date: data.date,
    description: data.description,
    reference_number: data.referenceNumber ?? null,
    source: data.source ?? "manual",
    status: "draft",
    currency: data.currency ?? "USD",
    exchange_rate: data.exchangeRate ?? 1,
    created_at: now,
  };

  // 3. Build lines
  const txnLines: TransactionLine[] = data.lines.map((l) => ({
    id: generateLineId(),
    transaction_id: txn.id,
    account_id: l.accountId,
    debit: roundCents(l.debit),
    credit: roundCents(l.credit),
    tax_code: l.taxCode ?? null,
    tax_amount: l.taxAmount ?? 0,
    description: l.description ?? null,
  }));

  // 4. Persist to in-memory store
  store.transactions.push(txn);
  store.lines.push(...txnLines);

  return { ...txn, lines: txnLines };
}

/**
 * Retrieves transactions for a user with optional filters.
 * Supports date range, status, source, account, and text search filtering.
 */
export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionWithLines[]> {
  let results = store.transactions.filter((t) => t.user_id === userId);

  // Date range
  if (filters.startDate) {
    results = results.filter((t) => t.date >= filters.startDate!);
  }
  if (filters.endDate) {
    results = results.filter((t) => t.date <= filters.endDate!);
  }

  // Status
  if (filters.status) {
    results = results.filter((t) => t.status === filters.status);
  }

  // Source
  if (filters.source) {
    results = results.filter((t) => t.source === filters.source);
  }

  // Account – include transactions that have at least one line for the account
  if (filters.accountId) {
    const txnIdsWithAccount = new Set(
      store.lines
        .filter((l) => l.account_id === filters.accountId)
        .map((l) => l.transaction_id)
    );
    results = results.filter((t) => txnIdsWithAccount.has(t.id));
  }

  // Text search on description / reference
  if (filters.search) {
    const query = filters.search.toLowerCase();
    results = results.filter(
      (t) =>
        t.description.toLowerCase().includes(query) ||
        (t.reference_number && t.reference_number.toLowerCase().includes(query))
    );
  }

  // Sort newest first
  results.sort((a, b) => b.date.localeCompare(a.date));

  // Pagination
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;
  results = results.slice(offset, offset + limit);

  // Attach lines
  return results.map((t) => ({
    ...t,
    lines: store.lines.filter((l) => l.transaction_id === t.id),
  }));
}

/**
 * Retrieves a single transaction by id, or null if not found.
 */
export async function getTransactionById(
  transactionId: string
): Promise<TransactionWithLines | null> {
  const txn = store.transactions.find((t) => t.id === transactionId);
  if (!txn) return null;

  return {
    ...txn,
    lines: store.lines.filter((l) => l.transaction_id === txn.id),
  };
}

/**
 * Confirms a draft transaction, changing its status from "draft" to "confirmed".
 * Only draft transactions can be confirmed.
 */
export async function confirmTransaction(
  transactionId: string
): Promise<TransactionWithLines> {
  const txn = store.transactions.find((t) => t.id === transactionId);
  if (!txn) {
    throw new Error(`Transaction ${transactionId} not found.`);
  }
  if (txn.status !== "draft") {
    throw new Error(
      `Transaction ${transactionId} cannot be confirmed — current status is "${txn.status}".`
    );
  }

  txn.status = "confirmed";

  return {
    ...txn,
    lines: store.lines.filter((l) => l.transaction_id === txn.id),
  };
}

/**
 * Deletes a draft transaction. Only drafts can be deleted.
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  const idx = store.transactions.findIndex((t) => t.id === transactionId);
  if (idx === -1) {
    throw new Error(`Transaction ${transactionId} not found.`);
  }
  if (store.transactions[idx].status !== "draft") {
    throw new Error("Only draft transactions can be deleted.");
  }

  store.transactions.splice(idx, 1);
  // Remove associated lines
  for (let i = store.lines.length - 1; i >= 0; i--) {
    if (store.lines[i].transaction_id === transactionId) {
      store.lines.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Store helpers (for testing / seeding)
// ---------------------------------------------------------------------------

/** Returns a direct reference to the in-memory store. For tests only. */
export function _getStore(): Store {
  return store;
}

/** Clears all in-memory data. For tests only. */
export function _resetStore(): void {
  store.transactions.length = 0;
  store.lines.length = 0;
  store.accounts.length = 0;
}
