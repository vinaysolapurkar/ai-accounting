"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TrialBalanceEntry {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  date: string;
  entries: TrialBalanceEntry[];
}

const fallbackEntries: TrialBalanceEntry[] = [
  { code: "1000", name: "Cash", debit: 245000, credit: 0 },
  { code: "1010", name: "Bank Account", debit: 580000, credit: 0 },
  { code: "1100", name: "Accounts Receivable", debit: 150000, credit: 0 },
  { code: "1500", name: "Fixed Assets", debit: 300000, credit: 0 },
  { code: "7000", name: "GST Input Credit", debit: 28000, credit: 0 },
  { code: "2000", name: "Accounts Payable", debit: 0, credit: 85000 },
  { code: "2100", name: "GST Payable", debit: 0, credit: 12000 },
  { code: "2200", name: "TDS Payable", debit: 0, credit: 8000 },
  { code: "3000", name: "Owner's Equity", debit: 0, credit: 500000 },
  { code: "3100", name: "Retained Earnings", debit: 0, credit: 698000 },
  { code: "5000", name: "COGS", debit: 95000, credit: 0 },
  { code: "6000", name: "Rent", debit: 45000, credit: 0 },
  { code: "6100", name: "Utilities", debit: 12500, credit: 0 },
  { code: "6200", name: "Office Supplies", debit: 8700, credit: 0 },
  { code: "6300", name: "Travel", debit: 15800, credit: 0 },
  { code: "6400", name: "Food & Dining", debit: 7200, credit: 0 },
  { code: "6500", name: "Software", debit: 22400, credit: 0 },
  { code: "6600", name: "Marketing", debit: 18000, credit: 0 },
  { code: "4000", name: "Service Revenue", debit: 0, credit: 485000 },
  { code: "4100", name: "Product Revenue", debit: 0, credit: 120000 },
];

const fallbackData: TrialBalanceData = {
  date: "March 18, 2026",
  entries: fallbackEntries,
};

function getUserId(): string | null {
  try {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) return JSON.parse(stored).id || null;
  } catch {}
  return null;
}

export default function TrialBalancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrialBalanceData>(fallbackData);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch("/api/reports?type=trial-balance", {
      headers: { "x-user-id": userId },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res) {
          const entries = Array.isArray(res) ? res : Array.isArray(res.entries) ? res.entries : null;
          if (entries) {
            setData({
              date: res.date || fallbackData.date,
              entries,
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDebits = data.entries.reduce((s, t) => s + t.debit, 0);
  const totalCredits = data.entries.reduce((s, t) => s + t.credit, 0);
  const isBalanced = totalDebits === totalCredits;

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded" />
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardContent className="p-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Trial Balance</h1>
            <p className="text-muted-foreground text-sm">As of {data.date}</p>
          </div>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Debit ({"\u20b9"})</TableHead>
                <TableHead className="text-right">Credit ({"\u20b9"})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.entries.map((t) => (
                <TableRow key={t.code}>
                  <TableCell className="font-mono text-sm">{t.code}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell className="text-right font-mono">{t.debit > 0 ? t.debit.toLocaleString() : ""}</TableCell>
                  <TableCell className="text-right font-mono">{t.credit > 0 ? t.credit.toLocaleString() : ""}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right font-mono">{totalDebits.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono">{totalCredits.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className={isBalanced ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
        <CardContent className="p-4 flex items-center justify-between">
          <span className="font-semibold">Verification: Debits = Credits</span>
          <Badge variant={isBalanced ? "default" : "destructive"}>
            {isBalanced ? "\u2713 Balanced" : `\u2717 Difference: \u20b9${Math.abs(totalDebits - totalCredits).toLocaleString()}`}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
