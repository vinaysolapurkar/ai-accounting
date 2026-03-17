"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

const balanceSheet = {
  date: "March 18, 2026",
  assets: {
    current: [
      { name: "Cash", amount: 245000 },
      { name: "Bank Account", amount: 580000 },
      { name: "Accounts Receivable", amount: 150000 },
      { name: "GST Input Credit", amount: 28000 },
    ],
    fixed: [
      { name: "Equipment", amount: 200000 },
      { name: "Furniture", amount: 100000 },
    ],
  },
  liabilities: {
    current: [
      { name: "Accounts Payable", amount: 85000 },
      { name: "GST Payable", amount: 12000 },
      { name: "TDS Payable", amount: 8000 },
    ],
  },
  equity: [
    { name: "Owner's Equity", amount: 500000 },
    { name: "Retained Earnings", amount: 698000 },
  ],
};

const totalAssets = [...balanceSheet.assets.current, ...balanceSheet.assets.fixed].reduce((s, a) => s + a.amount, 0);
const totalLiabilities = balanceSheet.liabilities.current.reduce((s, l) => s + l.amount, 0);
const totalEquity = balanceSheet.equity.reduce((s, e) => s + e.amount, 0);

export default function BalanceSheetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="w-6 h-6" /> Balance Sheet
            </h1>
            <p className="text-muted-foreground text-sm">As of {balanceSheet.date}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-600">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Current Assets</h4>
              <Table>
                <TableBody>
                  {balanceSheet.assets.current.map((a) => (
                    <TableRow key={a.name}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="text-right font-mono">₹{a.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Fixed Assets</h4>
              <Table>
                <TableBody>
                  {balanceSheet.assets.fixed.map((a) => (
                    <TableRow key={a.name}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="text-right font-mono">₹{a.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between pt-3 border-t font-bold">
              <span>Total Assets</span>
              <span className="font-mono">₹{totalAssets.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities & Equity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {balanceSheet.liabilities.current.map((l) => (
                    <TableRow key={l.name}>
                      <TableCell>{l.name}</TableCell>
                      <TableCell className="text-right font-mono">₹{l.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between pt-3 border-t font-bold">
                <span>Total Liabilities</span>
                <span className="font-mono">₹{totalLiabilities.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-purple-600">Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {balanceSheet.equity.map((e) => (
                    <TableRow key={e.name}>
                      <TableCell>{e.name}</TableCell>
                      <TableCell className="text-right font-mono">₹{e.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between pt-3 border-t font-bold">
                <span>Total Equity</span>
                <span className="font-mono">₹{totalEquity.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Verification */}
      <Card className={totalAssets === totalLiabilities + totalEquity ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Balance Verification</p>
            <p className="text-sm text-muted-foreground">
              Assets (₹{totalAssets.toLocaleString()}) = Liabilities (₹{totalLiabilities.toLocaleString()}) + Equity (₹{totalEquity.toLocaleString()})
            </p>
          </div>
          <Badge variant={totalAssets === totalLiabilities + totalEquity ? "default" : "destructive"}>
            {totalAssets === totalLiabilities + totalEquity ? "✓ Balanced" : "✗ Unbalanced"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
