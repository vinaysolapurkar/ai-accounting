import { createClient, type Client } from "@libsql/client/web";
import { v4 as uuidv4 } from "uuid";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    let url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not set. Please configure it in your environment variables.");
    }
    // On serverless (Vercel), use HTTPS instead of libsql:// WebSocket protocol
    if (url.startsWith("libsql://")) {
      url = url.replace("libsql://", "https://");
    }
    client = createClient({
      url,
      authToken: authToken || undefined,
    });
  }
  return client;
}

export async function initSchema() {
  const c = getClient();
  await c.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      business_name TEXT,
      business_type TEXT,
      country TEXT NOT NULL DEFAULT 'IN',
      currency TEXT NOT NULL DEFAULT 'INR',
      tax_id TEXT,
      plan TEXT NOT NULL DEFAULT 'free',
      fiscal_year_start INTEGER NOT NULL DEFAULT 4,
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      is_system INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      reference_number TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'draft',
      currency TEXT NOT NULL DEFAULT 'INR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transaction_lines (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      tax_code TEXT,
      tax_amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      FOREIGN KEY(transaction_id) REFERENCES transactions(id),
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image_url TEXT,
      raw_ocr_data TEXT,
      extracted_vendor TEXT,
      extracted_amount REAL,
      extracted_date TEXT,
      extracted_category TEXT,
      extracted_line_items TEXT,
      extracted_tax_info TEXT,
      transaction_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT,
      client_tax_id TEXT,
      invoice_number TEXT NOT NULL,
      date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_total REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'draft',
      line_items TEXT NOT NULL DEFAULT '[]',
      transaction_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      action_taken TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// Helper to convert libsql row to plain object
function rowToObj(row: any): any {
  if (!row) return null;
  const obj: any = {};
  for (const key of Object.keys(row)) {
    obj[key] = row[key];
  }
  return obj;
}

function rowsToArr(rows: any[]): any[] {
  return rows.map(rowToObj);
}

// ============ USER OPERATIONS ============

export async function createUser(email: string, password: string, businessName?: string) {
  const c = getClient();
  const id = uuidv4();
  await c.execute({
    sql: `INSERT INTO users (id, email, password_hash, business_name) VALUES (?, ?, ?, ?)`,
    args: [id, email, password, businessName || null],
  });
  return getUserById(id);
}

export async function getUserByEmail(email: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM users WHERE email = ?`, args: [email] });
  return result.rows[0] ? rowToObj(result.rows[0]) : null;
}

export async function getUserById(id: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM users WHERE id = ?`, args: [id] });
  return result.rows[0] ? rowToObj(result.rows[0]) : null;
}

export async function updateUser(id: string, data: Record<string, any>) {
  const c = getClient();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  await c.execute({
    sql: `UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
    args: [...values, id],
  });
  return getUserById(id);
}

// ============ ACCOUNT OPERATIONS ============

export async function seedAccounts(userId: string, country: string) {
  const c = getClient();
  const existing = await c.execute({ sql: `SELECT COUNT(*) as count FROM accounts WHERE user_id = ?`, args: [userId] });
  if ((existing.rows[0] as any).count > 0) return;

  const { getDefaultCOA } = await import("./accounting/chart-of-accounts");
  const accounts = getDefaultCOA(country);

  const batch = accounts.map((acc: any) => ({
    sql: `INSERT INTO accounts (id, user_id, name, code, type, parent_id, is_system) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    args: [uuidv4(), userId, acc.name, acc.code, acc.type, acc.parentCode || null],
  }));

  // Execute in chunks of 20
  for (let i = 0; i < batch.length; i += 20) {
    await c.batch(batch.slice(i, i + 20));
  }
}

export async function getAccounts(userId: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM accounts WHERE user_id = ? ORDER BY code`, args: [userId] });
  return rowsToArr(result.rows);
}

export async function getAccountByCode(userId: string, code: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM accounts WHERE user_id = ? AND code = ?`, args: [userId, code] });
  return result.rows[0] ? rowToObj(result.rows[0]) : null;
}

export async function getAccountById(id: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM accounts WHERE id = ?`, args: [id] });
  return result.rows[0] ? rowToObj(result.rows[0]) : null;
}

export async function createAccount(userId: string, data: { name: string; code: string; type: string; parent_id?: string }) {
  const c = getClient();
  const existing = await c.execute({ sql: `SELECT id FROM accounts WHERE user_id = ? AND code = ?`, args: [userId, data.code] });
  if (existing.rows.length > 0) throw new Error(`Account code ${data.code} already exists`);
  const id = uuidv4();
  await c.execute({
    sql: `INSERT INTO accounts (id, user_id, name, code, type, parent_id, is_system) VALUES (?, ?, ?, ?, ?, ?, 0)`,
    args: [id, userId, data.name, data.code, data.type, data.parent_id || null],
  });
  return getAccountById(id);
}

// ============ TRANSACTION OPERATIONS ============

export async function createTransaction(
  userId: string,
  data: {
    date: string;
    description: string;
    source?: string;
    status?: string;
    currency?: string;
    reference_number?: string;
    lines: { account_id: string; debit: number; credit: number; tax_code?: string; tax_amount?: number; description?: string }[];
  }
) {
  const c = getClient();
  const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Debits (${totalDebit}) must equal credits (${totalCredit})`);
  }

  const txnId = uuidv4();
  const statements = [
    {
      sql: `INSERT INTO transactions (id, user_id, date, description, reference_number, source, status, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [txnId, userId, data.date, data.description, data.reference_number || null,
        data.source || "manual", data.status || "confirmed", data.currency || "INR"],
    },
    ...data.lines.map(line => ({
      sql: `INSERT INTO transaction_lines (id, transaction_id, account_id, debit, credit, tax_code, tax_amount, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), txnId, line.account_id, line.debit, line.credit,
        line.tax_code || null, line.tax_amount || 0, line.description || null],
    })),
    {
      sql: `INSERT INTO audit_log (id, user_id, entity_type, entity_id, action, new_values, source)
            VALUES (?, ?, 'transaction', ?, 'create', ?, ?)`,
      args: [uuidv4(), userId, txnId, JSON.stringify(data), data.source || "manual"],
    },
  ];

  await c.batch(statements);
  return getTransactionById(txnId);
}

export async function getTransactions(userId: string, filters?: {
  search?: string; status?: string; startDate?: string; endDate?: string; limit?: number;
}) {
  const c = getClient();
  let sql = `
    SELECT t.*,
      COALESCE(SUM(tl.debit), 0) as total_debit,
      COALESCE(SUM(tl.credit), 0) as total_credit
    FROM transactions t
    LEFT JOIN transaction_lines tl ON tl.transaction_id = t.id
    WHERE t.user_id = ?
  `;
  const args: any[] = [userId];

  if (filters?.search) { sql += ` AND t.description LIKE ?`; args.push(`%${filters.search}%`); }
  if (filters?.status && filters.status !== "all") { sql += ` AND t.status = ?`; args.push(filters.status); }
  if (filters?.startDate) { sql += ` AND t.date >= ?`; args.push(filters.startDate); }
  if (filters?.endDate) { sql += ` AND t.date <= ?`; args.push(filters.endDate); }

  sql += ` GROUP BY t.id ORDER BY t.date DESC, t.created_at DESC`;
  if (filters?.limit) { sql += ` LIMIT ?`; args.push(filters.limit); }

  const result = await c.execute({ sql, args });
  const transactions = rowsToArr(result.rows);

  // Get lines for each and determine type
  for (const t of transactions) {
    const linesResult = await c.execute({
      sql: `SELECT tl.*, a.name as account_name, a.type as account_type, a.code as account_code
            FROM transaction_lines tl JOIN accounts a ON a.id = tl.account_id WHERE tl.transaction_id = ?`,
      args: [t.id],
    });
    t.lines = rowsToArr(linesResult.rows);
    t.type = t.lines.some((l: any) => l.account_type === "revenue") ? "income" : "expense";
    t.amount = Math.max(t.total_debit, t.total_credit);
  }

  return transactions;
}

export async function getTransactionById(id: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM transactions WHERE id = ?`, args: [id] });
  if (!result.rows[0]) return null;
  const txn = rowToObj(result.rows[0]);
  const linesResult = await c.execute({
    sql: `SELECT tl.*, a.name as account_name, a.type as account_type FROM transaction_lines tl
          JOIN accounts a ON a.id = tl.account_id WHERE tl.transaction_id = ?`,
    args: [id],
  });
  txn.lines = rowsToArr(linesResult.rows);
  return txn;
}

export async function deleteTransaction(id: string) {
  const c = getClient();
  await c.batch([
    { sql: `DELETE FROM transaction_lines WHERE transaction_id = ?`, args: [id] },
    { sql: `DELETE FROM transactions WHERE id = ?`, args: [id] },
  ]);
}

// ============ RECEIPT OPERATIONS ============

export async function createReceipt(userId: string, data: {
  image_url?: string; raw_ocr_data?: any; extracted_vendor?: string; extracted_amount?: number;
  extracted_date?: string; extracted_category?: string; extracted_line_items?: any[]; extracted_tax_info?: any;
}) {
  const c = getClient();
  const id = uuidv4();
  await c.execute({
    sql: `INSERT INTO receipts (id, user_id, image_url, raw_ocr_data, extracted_vendor, extracted_amount, extracted_date, extracted_category, extracted_line_items, extracted_tax_info)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, data.image_url || null, data.raw_ocr_data ? JSON.stringify(data.raw_ocr_data) : null,
      data.extracted_vendor || null, data.extracted_amount || null, data.extracted_date || null,
      data.extracted_category || null, data.extracted_line_items ? JSON.stringify(data.extracted_line_items) : null,
      data.extracted_tax_info ? JSON.stringify(data.extracted_tax_info) : null],
  });
  return getReceiptById(id);
}

export async function getReceipts(userId: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC`, args: [userId] });
  return rowsToArr(result.rows).map(r => ({
    ...r,
    extracted_line_items: r.extracted_line_items ? JSON.parse(r.extracted_line_items) : null,
    extracted_tax_info: r.extracted_tax_info ? JSON.parse(r.extracted_tax_info) : null,
  }));
}

export async function getReceiptById(id: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM receipts WHERE id = ?`, args: [id] });
  if (!result.rows[0]) return null;
  const r = rowToObj(result.rows[0]);
  r.extracted_line_items = r.extracted_line_items ? JSON.parse(r.extracted_line_items) : null;
  r.extracted_tax_info = r.extracted_tax_info ? JSON.parse(r.extracted_tax_info) : null;
  return r;
}

export async function linkReceiptToTransaction(receiptId: string, transactionId: string) {
  const c = getClient();
  await c.execute({ sql: `UPDATE receipts SET transaction_id = ?, status = 'linked' WHERE id = ?`, args: [transactionId, receiptId] });
}

// ============ INVOICE OPERATIONS ============

export async function createInvoice(userId: string, data: {
  client_name: string; client_email?: string; client_tax_id?: string; invoice_number: string;
  date: string; due_date: string; subtotal: number; tax_total: number; total: number;
  currency?: string; line_items: any[];
}) {
  const c = getClient();
  const id = uuidv4();
  await c.execute({
    sql: `INSERT INTO invoices (id, user_id, client_name, client_email, client_tax_id, invoice_number, date, due_date, subtotal, tax_total, total, currency, line_items)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, data.client_name, data.client_email || null, data.client_tax_id || null,
      data.invoice_number, data.date, data.due_date, data.subtotal, data.tax_total, data.total,
      data.currency || "INR", JSON.stringify(data.line_items)],
  });
  return getInvoiceById(id);
}

export async function getInvoices(userId: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC`, args: [userId] });
  return rowsToArr(result.rows).map(i => ({ ...i, line_items: JSON.parse(i.line_items) }));
}

export async function getInvoiceById(id: string) {
  const c = getClient();
  const result = await c.execute({ sql: `SELECT * FROM invoices WHERE id = ?`, args: [id] });
  if (!result.rows[0]) return null;
  const i = rowToObj(result.rows[0]);
  i.line_items = JSON.parse(i.line_items);
  return i;
}

export async function updateInvoiceStatus(id: string, status: string) {
  const c = getClient();
  await c.execute({ sql: `UPDATE invoices SET status = ? WHERE id = ?`, args: [status, id] });
}

// ============ CHAT OPERATIONS ============

export async function saveChatMessage(userId: string, sessionId: string, role: string, message: string, actionTaken?: any) {
  const c = getClient();
  const id = uuidv4();
  await c.execute({
    sql: `INSERT INTO chat_history (id, user_id, session_id, role, message, action_taken) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, userId, sessionId, role, message, actionTaken ? JSON.stringify(actionTaken) : null],
  });
  return id;
}

export async function getChatHistory(userId: string, sessionId?: string, limit = 50) {
  const c = getClient();
  if (sessionId) {
    const r = await c.execute({ sql: `SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC LIMIT ?`, args: [userId, sessionId, limit] });
    return rowsToArr(r.rows);
  }
  const r = await c.execute({ sql: `SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`, args: [userId, limit] });
  return rowsToArr(r.rows);
}

// ============ LEDGER & REPORTS ============

export async function getAccountBalances(userId: string) {
  const c = getClient();
  const result = await c.execute({
    sql: `SELECT a.id, a.name, a.code, a.type,
      COALESCE(SUM(tl.debit), 0) as total_debit,
      COALESCE(SUM(tl.credit), 0) as total_credit,
      CASE WHEN a.type IN ('asset','expense')
        THEN COALESCE(SUM(tl.debit), 0) - COALESCE(SUM(tl.credit), 0)
        ELSE COALESCE(SUM(tl.credit), 0) - COALESCE(SUM(tl.debit), 0)
      END as balance
    FROM accounts a
    LEFT JOIN transaction_lines tl ON tl.account_id = a.id
    LEFT JOIN transactions t ON t.id = tl.transaction_id AND t.status IN ('confirmed','reconciled')
    WHERE a.user_id = ?
    GROUP BY a.id ORDER BY a.code`,
    args: [userId],
  });
  return rowsToArr(result.rows);
}

export async function getAccountLedger(accountId: string) {
  const c = getClient();
  const result = await c.execute({
    sql: `SELECT tl.*, t.date, t.description as txn_description, t.status
          FROM transaction_lines tl JOIN transactions t ON t.id = tl.transaction_id
          WHERE tl.account_id = ? AND t.status IN ('confirmed','reconciled')
          ORDER BY t.date DESC`,
    args: [accountId],
  });
  return rowsToArr(result.rows);
}

export async function getBalanceSheet(userId: string) {
  const balances = await getAccountBalances(userId);
  const assets = balances.filter((a: any) => a.type === "asset");
  const liabilities = balances.filter((a: any) => a.type === "liability");
  const equity = balances.filter((a: any) => a.type === "equity");
  const revenue = balances.filter((a: any) => a.type === "revenue");
  const expenses = balances.filter((a: any) => a.type === "expense");

  const totalAssets = assets.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0);
  const totalLiabilities = liabilities.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0);
  const totalEquity = equity.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0);
  const totalRevenue = revenue.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0);
  const totalExpenses = expenses.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  return {
    assets: { items: assets.filter((a: any) => Number(a.balance) !== 0), total: totalAssets },
    liabilities: { items: liabilities.filter((a: any) => Number(a.balance) !== 0), total: totalLiabilities },
    equity: { items: equity.filter((a: any) => Number(a.balance) !== 0), total: totalEquity, netIncome },
    totalAssets,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity + netIncome,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + netIncome)) < 0.01,
  };
}

export async function getProfitLoss(userId: string) {
  const balances = await getAccountBalances(userId);
  const revenue = balances.filter((a: any) => a.type === "revenue" && Number(a.balance) !== 0);
  const expenses = balances.filter((a: any) => a.type === "expense" && Number(a.balance) !== 0);
  const totalRevenue = revenue.reduce((s: number, r: any) => s + (Number(r.balance) || 0), 0);
  const totalExpenses = expenses.reduce((s: number, r: any) => s + (Number(r.balance) || 0), 0);

  return {
    revenue: { items: revenue, total: totalRevenue },
    expenses: { items: expenses, total: totalExpenses },
    netProfit: totalRevenue - totalExpenses,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0,
  };
}

export async function getTrialBalance(userId: string) {
  const balances = await getAccountBalances(userId);
  const entries = balances.filter((a: any) => Number(a.total_debit) > 0 || Number(a.total_credit) > 0).map((a: any) => ({
    ...a,
    debit: (a.type === "asset" || a.type === "expense") ? Number(a.balance) || 0 : 0,
    credit: (a.type === "liability" || a.type === "equity" || a.type === "revenue") ? Number(a.balance) || 0 : 0,
  }));
  const totalDebits = entries.reduce((s: number, e: any) => s + e.debit, 0);
  const totalCredits = entries.reduce((s: number, e: any) => s + e.credit, 0);
  return { entries, totalDebits, totalCredits, isBalanced: Math.abs(totalDebits - totalCredits) < 0.01 };
}

// ============ DASHBOARD STATS ============

export async function getDashboardStats(userId: string) {
  const c = getClient();
  const rev = await c.execute({
    sql: `SELECT COALESCE(SUM(tl.credit), 0) - COALESCE(SUM(tl.debit), 0) as total
          FROM transaction_lines tl JOIN accounts a ON a.id = tl.account_id AND a.type = 'revenue'
          JOIN transactions t ON t.id = tl.transaction_id AND t.user_id = ? AND t.status IN ('confirmed','reconciled')`,
    args: [userId],
  });
  const exp = await c.execute({
    sql: `SELECT COALESCE(SUM(tl.debit), 0) - COALESCE(SUM(tl.credit), 0) as total
          FROM transaction_lines tl JOIN accounts a ON a.id = tl.account_id AND a.type = 'expense'
          JOIN transactions t ON t.id = tl.transaction_id AND t.user_id = ? AND t.status IN ('confirmed','reconciled')`,
    args: [userId],
  });
  const pending = await c.execute({
    sql: `SELECT COUNT(*) as count FROM receipts WHERE user_id = ? AND status = 'pending'`, args: [userId],
  });
  const total = await c.execute({
    sql: `SELECT COUNT(*) as count FROM transactions WHERE user_id = ?`, args: [userId],
  });

  const revenue = Number((rev.rows[0] as any)?.total) || 0;
  const expenses = Number((exp.rows[0] as any)?.total) || 0;

  return {
    revenue, expenses, netProfit: revenue - expenses,
    pendingReceipts: Number((pending.rows[0] as any)?.count) || 0,
    totalTransactions: Number((total.rows[0] as any)?.count) || 0,
  };
}

// ============ SEED DEMO DATA ============

export async function seedDemoData(userId: string) {
  const c = getClient();
  const existing = await c.execute({ sql: `SELECT COUNT(*) as count FROM transactions WHERE user_id = ?`, args: [userId] });
  if (Number((existing.rows[0] as any).count) > 0) return;

  const accounts = await getAccounts(userId);
  const getAccId = (code: string) => accounts.find((a: any) => a.code === code)?.id;

  const cashId = getAccId("1000");
  const bankId = getAccId("1010") || cashId;
  const revenueId = getAccId("4000");
  const officeId = getAccId("6200") || getAccId("6000");
  const utilitiesId = getAccId("6100") || getAccId("6000");
  const softwareId = getAccId("6500") || getAccId("6000");
  const travelId = getAccId("6300") || getAccId("6000");
  const foodId = getAccId("6400") || getAccId("6000");
  const rentId = getAccId("6000");
  const marketingId = getAccId("6600") || officeId;

  if (!cashId || !revenueId) return;

  const txns = [
    { date: "2026-03-17", desc: "Office Supplies - Amazon", dAcc: officeId, cAcc: bankId, amt: 2340, src: "receipt_scan" },
    { date: "2026-03-16", desc: "Client Payment - Acme Corp", dAcc: bankId, cAcc: revenueId, amt: 15000, src: "manual" },
    { date: "2026-03-15", desc: "Electricity Bill - MSEB", dAcc: utilitiesId, cAcc: bankId, amt: 1850, src: "receipt_scan" },
    { date: "2026-03-14", desc: "Adobe Creative Cloud", dAcc: softwareId, cAcc: bankId, amt: 1500, src: "chat" },
    { date: "2026-03-13", desc: "Consulting Fee - Client B", dAcc: bankId, cAcc: revenueId, amt: 8500, src: "bank_import" },
    { date: "2026-03-12", desc: "Uber Rides", dAcc: travelId, cAcc: cashId, amt: 450, src: "receipt_scan" },
    { date: "2026-03-11", desc: "AWS Hosting", dAcc: softwareId, cAcc: bankId, amt: 3200, src: "receipt_scan" },
    { date: "2026-03-10", desc: "Client Payment - XYZ Ltd", dAcc: bankId, cAcc: revenueId, amt: 25000, src: "bank_import" },
    { date: "2026-03-09", desc: "Team Lunch", dAcc: foodId, cAcc: cashId, amt: 2100, src: "receipt_scan" },
    { date: "2026-03-08", desc: "WeWork Rent", dAcc: rentId, cAcc: bankId, amt: 15000, src: "manual" },
    { date: "2026-03-05", desc: "Client Payment - Design Co", dAcc: bankId, cAcc: revenueId, amt: 45000, src: "manual" },
    { date: "2026-03-03", desc: "Marketing - Google Ads", dAcc: marketingId, cAcc: bankId, amt: 8000, src: "manual" },
  ];

  for (const t of txns) {
    if (!t.dAcc || !t.cAcc) continue;
    try {
      await createTransaction(userId, {
        date: t.date, description: t.desc, source: t.src, status: "confirmed",
        lines: [
          { account_id: t.dAcc, debit: t.amt, credit: 0 },
          { account_id: t.cAcc, debit: 0, credit: t.amt },
        ],
      });
    } catch { /* skip */ }
  }
}

// ============ NEXT INVOICE NUMBER ============

export async function getNextInvoiceNumber(userId: string) {
  const c = getClient();
  const result = await c.execute({
    sql: `SELECT COUNT(*) as count FROM invoices WHERE user_id = ?`, args: [userId],
  });
  const count = Number((result.rows[0] as any).count) || 0;
  return `INV-${String(count + 1).padStart(4, "0")}`;
}
