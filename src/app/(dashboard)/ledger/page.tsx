"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2 } from "lucide-react";
import { NewAccountDialog } from "@/components/new-account-dialog";

function getUserId(): string {
  try {
    return JSON.parse(localStorage.getItem("ledgerai_user") || "{}").id || "";
  } catch { return ""; }
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  total_debit: number;
  total_credit: number;
}

const typeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-700",
  liability: "bg-red-100 text-red-700",
  equity: "bg-purple-100 text-purple-700",
  revenue: "bg-green-100 text-green-700",
  expense: "bg-orange-100 text-orange-700",
};

export default function LedgerPage() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    try {
      const res = await fetch("/api/reports?type=trial-balance", {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      // trial-balance returns { entries, totalDebits, totalCredits, isBalanced }
      // entries have: id, code, name, type, balance, total_debit, total_credit, debit, credit
      if (data.entries) {
        setAccounts(data.entries.map((e: any) => ({
          id: e.id,
          code: e.code,
          name: e.name,
          type: e.type,
          balance: Number(e.balance) || 0,
          total_debit: Number(e.total_debit) || 0,
          total_credit: Number(e.total_credit) || 0,
        })));
      }
    } catch {
      // Fallback: try the accounts endpoint
      try {
        const res = await fetch("/api/accounts", {
          headers: { "x-user-id": getUserId() },
        });
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.map((a: any) => ({
            ...a,
            balance: 0,
            total_debit: 0,
            total_credit: 0,
          })));
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filtered = accounts.filter(a => typeFilter === "all" || a.type === typeFilter);
  const selectedAccountData = accounts.find(a => a.code === selectedAccount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> General Ledger
        </h1>
        <p className="text-muted-foreground text-sm">Chart of accounts with balances</p>
      </div>

      <div className="flex gap-3 items-center justify-between">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="asset">Assets</SelectItem>
            <SelectItem value="liability">Liabilities</SelectItem>
            <SelectItem value="equity">Equity</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
          </SelectContent>
        </Select>
        <NewAccountDialog userId={getUserId()} onCreated={fetchAccounts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Chart of Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading accounts...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No accounts found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow
                      key={a.code}
                      className={`cursor-pointer ${selectedAccount === a.code ? "bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => setSelectedAccount(a.code)}
                    >
                      <TableCell className="font-mono text-sm">{a.code}</TableCell>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        <Badge className={`${typeColors[a.type] || ""} text-xs`} variant="secondary">{a.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">₹{(Number(a.balance) || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedAccountData ? selectedAccountData.name : "Select an account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAccountData ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">₹{(Number(selectedAccountData.balance) || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Debits</span>
                    <span className="font-medium text-red-500">₹{(Number(selectedAccountData.total_debit) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Credits</span>
                    <span className="font-medium text-green-600">₹{(Number(selectedAccountData.total_credit) || 0).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Detailed ledger entries will be available in a future update.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click an account to view its details</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
