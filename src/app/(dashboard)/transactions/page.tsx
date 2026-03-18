"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Filter, Download, ArrowUpDown, Loader2, Trash2, CornerDownLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { NewAccountDialog } from "@/components/new-account-dialog";

function getUserId(): string {
  try {
    return JSON.parse(localStorage.getItem("ledgerai_user") || "{}").id || "";
  } catch { return ""; }
}

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  source: string;
  lines?: { account_name?: string; account_type?: string; debit: number; credit: number }[];
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline entry state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryDesc, setEntryDesc] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDebit, setEntryDebit] = useState("");
  const [entryCredit, setEntryCredit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const fetchTransactions = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/transactions?${params}`, {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchAccounts = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const res = await fetch("/api/accounts", {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // Auto-focus the description field on page load
  useEffect(() => {
    const timer = setTimeout(() => descRef.current?.focus(), 600);
    return () => clearTimeout(timer);
  }, []);

  // Auto-suggest accounts as user types description
  useEffect(() => {
    if (!entryDesc || accounts.length === 0) return;
    const desc = entryDesc.toLowerCase();

    const keywordMap: [string[], string][] = [
      [["food", "lunch", "dinner", "restaurant", "meal", "cafe", "swiggy", "zomato"], "food"],
      [["uber", "ola", "cab", "taxi", "travel", "flight", "hotel", "fuel", "gas"], "travel"],
      [["office", "supplies", "stationery", "amazon"], "office"],
      [["aws", "azure", "hosting", "cloud", "software", "adobe", "subscription", "saas"], "software"],
      [["electric", "water", "internet", "phone", "utility", "bill"], "utilit"],
      [["rent", "lease", "wework", "coworking"], "rent"],
      [["marketing", "ads", "advertising", "google ads"], "market"],
      [["salary", "wages", "payroll"], "salary"],
      [["client", "payment", "invoice", "consulting", "fee", "project"], "revenue"],
    ];

    let matchedType = "";
    for (const [keywords, type] of keywordMap) {
      if (keywords.some(k => desc.includes(k))) { matchedType = type; break; }
    }

    if (matchedType === "revenue") {
      const bank = accounts.find(a => a.code === "1010" || (a.type === "asset" && a.name.toLowerCase().includes("bank")));
      const cash = accounts.find(a => a.code === "1000" || (a.type === "asset" && a.name.toLowerCase().includes("cash")));
      const rev = accounts.find(a => a.type === "revenue");
      if (!entryDebit && (bank || cash)) setEntryDebit((bank || cash)!.id);
      if (!entryCredit && rev) setEntryCredit(rev.id);
    } else if (matchedType) {
      const expense = accounts.find(a =>
        a.type === "expense" && a.name.toLowerCase().includes(matchedType)
      ) || accounts.find(a => a.type === "expense");
      const bank = accounts.find(a => a.code === "1010" || (a.type === "asset" && a.name.toLowerCase().includes("bank")));
      const cash = accounts.find(a => a.code === "1000" || (a.type === "asset" && a.name.toLowerCase().includes("cash")));
      if (!entryDebit && expense) setEntryDebit(expense.id);
      if (!entryCredit && (bank || cash)) setEntryCredit((bank || cash)!.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryDesc, accounts]);

  const filtered = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  });

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const canSubmit = entryDesc.trim() && entryAmount && parseFloat(entryAmount) > 0 && entryDebit && entryCredit;

  const handleQuickAdd = async () => {
    const userId = getUserId();
    if (!userId) { toast.error("Not logged in"); return; }
    if (!canSubmit) return;

    const amount = parseFloat(entryAmount);
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          date: entryDate,
          description: entryDesc,
          source: "manual",
          lines: [
            { account_id: entryDebit, debit: amount, credit: 0 },
            { account_id: entryCredit, debit: 0, credit: amount },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create transaction");
      }
      toast.success("Transaction added!");
      // Reset form
      setEntryDesc("");
      setEntryAmount("");
      setEntryDebit("");
      setEntryCredit("");
      setEntryDate(new Date().toISOString().split("T")[0]);
      descRef.current?.focus();
      setLoading(true);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEntryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit && !submitting) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const userId = getUserId();
    if (!userId) return;

    // Verify password
    try {
      const user = JSON.parse(localStorage.getItem("ledgerai_user") || "{}");
      const authRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: user.email, password: deletePassword }),
      });
      if (!authRes.ok) {
        toast.error("Incorrect password");
        return;
      }
    } catch {
      toast.error("Password verification failed");
      return;
    }

    try {
      const res = await fetch(`/api/transactions?id=${deleteId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Transaction deleted");
      setTransactions((prev) => prev.filter((t) => t.id !== deleteId));
    } catch {
      toast.error("Failed to delete transaction");
    } finally {
      setDeleteId(null);
      setDeletePassword("");
    }
  };

  const getCategory = (t: Transaction) => {
    if (!t.lines?.length) return "Uncategorized";
    const expenseLine = t.lines.find(l => l.account_type === "expense");
    const revenueLine = t.lines.find(l => l.account_type === "revenue");
    return expenseLine?.account_name || revenueLine?.account_name || t.lines[0]?.account_name || "Uncategorized";
  };

  const getAccountLabel = (id: string) => {
    const a = accounts.find(x => x.id === id);
    return a ? `${a.code} - ${a.name}` : undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm">Manage all your financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <NewAccountDialog userId={getUserId()} onCreated={fetchAccounts} trigger={
            <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> New Account</Button>
          } />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-xl font-bold text-red-500">₹{totalExpense.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Net</p>
            <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-500"}`}>
              ₹{(totalIncome - totalExpense).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Entry Bar */}
      <Card className="border-primary/30 bg-primary/[0.04] shadow-sm animate-slide-down animate-entry-glow rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-bold" style={{fontFamily: 'var(--font-display)'}}>Add New Transaction</p>
            <span className="text-xs text-muted-foreground hidden sm:inline">Type and press Enter</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap" onKeyDown={handleEntryKeyDown}>
            <Input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full sm:w-[130px] h-9 text-sm"
            />
            <Input
              ref={descRef}
              placeholder="Description — e.g. Lunch at cafe"
              value={entryDesc}
              onChange={(e) => { setEntryDesc(e.target.value); if (!e.target.value) { setEntryDebit(""); setEntryCredit(""); } }}
              className="w-full sm:flex-1 sm:min-w-[180px] h-9 text-sm"
            />
            <Input
              type="number"
              placeholder="Amount"
              value={entryAmount}
              onChange={(e) => setEntryAmount(e.target.value)}
              className="w-full sm:w-[100px] h-9 text-sm"
            />
            <Select value={entryDebit} onValueChange={(v) => setEntryDebit(v || "")}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                <SelectValue placeholder="Debit A/c">
                  {getAccountLabel(entryDebit)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entryCredit} onValueChange={(v) => setEntryCredit(v || "")}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                <SelectValue placeholder="Credit A/c">
                  {getAccountLabel(entryCredit)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="w-full sm:w-auto h-9 px-3 shrink-0"
              disabled={!canSubmit || submitting}
              onClick={handleQuickAdd}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>Add <CornerDownLeft className="w-3 h-3 ml-1 opacity-50" /></>
              )}
            </Button>
          </div>
          {entryDebit && entryCredit && entryDesc && (
            <p className="text-xs text-muted-foreground mt-2 ml-1">
              Dr. <span className="font-medium text-foreground">{getAccountLabel(entryDebit)}</span>
              {" → "}
              Cr. <span className="font-medium text-foreground">{getAccountLabel(entryCredit)}</span>
              {entryAmount && <> — <span className="font-medium text-foreground">₹{parseFloat(entryAmount || "0").toLocaleString()}</span></>}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-[140px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="reconciled">Reconciled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading transactions...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transactions found. Use the quick entry bar above to add your first one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer"><div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div></TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="text-sm">{t.date}</TableCell>
                    <TableCell className="font-medium text-sm">{t.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{getCategory(t)}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{(t.source || "manual").replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "reconciled" ? "default" : t.status === "confirmed" ? "secondary" : "outline"} className="text-xs">
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold text-sm ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}₹{(Number(t.amount) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) { setDeleteId(null); setDeletePassword(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Enter your password to delete this transaction. This action cannot be undone.</p>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && deletePassword) confirmDelete(); }}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setDeleteId(null); setDeletePassword(""); }}>Cancel</Button>
            <Button variant="destructive" disabled={!deletePassword} onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
