"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";

const trialBalance = [
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

const totalDebits = trialBalance.reduce((s, t) => s + t.debit, 0);
const totalCredits = trialBalance.reduce((s, t) => s + t.credit, 0);
const isBalanced = totalDebits === totalCredits;

export default function TrialBalancePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Trial Balance</h1>
            <p className="text-muted-foreground text-sm">As of March 18, 2026</p>
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
                <TableHead className="text-right">Debit (₹)</TableHead>
                <TableHead className="text-right">Credit (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalance.map((t) => (
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
            {isBalanced ? "✓ Balanced" : `✗ Difference: ₹${Math.abs(totalDebits - totalCredits).toLocaleString()}`}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
