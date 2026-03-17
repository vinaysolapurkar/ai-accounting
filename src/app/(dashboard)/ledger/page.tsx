"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

const accounts = [
  { code: "1000", name: "Cash", type: "asset", balance: 245000 },
  { code: "1010", name: "Bank Account", type: "asset", balance: 580000 },
  { code: "1100", name: "Accounts Receivable", type: "asset", balance: 150000 },
  { code: "1500", name: "Fixed Assets", type: "asset", balance: 300000 },
  { code: "2000", name: "Accounts Payable", type: "liability", balance: 85000 },
  { code: "2100", name: "GST Payable", type: "liability", balance: 12000 },
  { code: "3000", name: "Owner's Equity", type: "equity", balance: 500000 },
  { code: "3100", name: "Retained Earnings", type: "equity", balance: 98000 },
  { code: "4000", name: "Service Revenue", type: "revenue", balance: 485000 },
  { code: "4100", name: "Product Revenue", type: "revenue", balance: 120000 },
  { code: "5000", name: "Cost of Services", type: "expense", balance: 95000 },
  { code: "6000", name: "Rent Expense", type: "expense", balance: 45000 },
  { code: "6100", name: "Utilities", type: "expense", balance: 12500 },
  { code: "6200", name: "Office Supplies", type: "expense", balance: 8700 },
  { code: "6300", name: "Travel & Transport", type: "expense", balance: 15800 },
  { code: "6400", name: "Food & Dining", type: "expense", balance: 7200 },
  { code: "6500", name: "Software & Subscriptions", type: "expense", balance: 22400 },
  { code: "6600", name: "Marketing", type: "expense", balance: 18000 },
  { code: "7000", name: "GST Input Credit", type: "asset", balance: 28000 },
];

const ledgerEntries = [
  { date: "2026-03-17", description: "Amazon Office Supplies", debit: 2340, credit: 0, balance: 8700 },
  { date: "2026-03-15", description: "Opening Balance", debit: 6360, credit: 0, balance: 6360 },
];

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

  const filtered = accounts.filter(a => typeFilter === "all" || a.type === typeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> General Ledger
        </h1>
        <p className="text-muted-foreground text-sm">Chart of accounts with balances</p>
      </div>

      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="asset">Assets</SelectItem>
            <SelectItem value="liability">Liabilities</SelectItem>
            <SelectItem value="equity">Equity</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Chart of Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                      <Badge className={`${typeColors[a.type]} text-xs`} variant="secondary">{a.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">₹{a.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedAccount ? accounts.find(a => a.code === selectedAccount)?.name : "Select an account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAccount ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">₹{accounts.find(a => a.code === selectedAccount)?.balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Recent Entries</p>
                  {ledgerEntries.map((entry, i) => (
                    <div key={i} className="flex justify-between py-2 border-b last:border-0 text-sm">
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">{entry.date}</p>
                      </div>
                      <div className="text-right">
                        {entry.debit > 0 && <p className="text-red-500">Dr ₹{entry.debit.toLocaleString()}</p>}
                        {entry.credit > 0 && <p className="text-green-600">Cr ₹{entry.credit.toLocaleString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click an account to view its ledger entries</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
