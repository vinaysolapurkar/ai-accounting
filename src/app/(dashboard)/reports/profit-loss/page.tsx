"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

const pnl = {
  period: "March 1 - March 18, 2026",
  revenue: [
    { name: "Service Revenue", amount: 485000 },
    { name: "Product Revenue", amount: 120000 },
  ],
  cogs: [
    { name: "Cost of Services", amount: 95000 },
  ],
  expenses: [
    { name: "Rent", amount: 45000 },
    { name: "Utilities", amount: 12500 },
    { name: "Office Supplies", amount: 8700 },
    { name: "Travel & Transport", amount: 15800 },
    { name: "Food & Dining", amount: 7200 },
    { name: "Software & Subscriptions", amount: 22400 },
    { name: "Marketing", amount: 18000 },
  ],
};

const totalRevenue = pnl.revenue.reduce((s, r) => s + r.amount, 0);
const totalCOGS = pnl.cogs.reduce((s, c) => s + c.amount, 0);
const grossProfit = totalRevenue - totalCOGS;
const totalExpenses = pnl.expenses.reduce((s, e) => s + e.amount, 0);
const netProfit = grossProfit - totalExpenses;

export default function ProfitLossPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6" /> Profit & Loss</h1>
            <p className="text-muted-foreground text-sm">{pnl.period}</p>
          </div>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Revenue */}
            <div>
              <h3 className="font-semibold text-green-600 mb-2">Revenue</h3>
              <Table>
                <TableBody>
                  {pnl.revenue.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="pl-6">{r.name}</TableCell>
                      <TableCell className="text-right font-mono">₹{r.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell>Total Revenue</TableCell>
                    <TableCell className="text-right font-mono text-green-600">₹{totalRevenue.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* COGS */}
            <div>
              <h3 className="font-semibold text-orange-600 mb-2">Cost of Goods/Services</h3>
              <Table>
                <TableBody>
                  {pnl.cogs.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="pl-6">{c.name}</TableCell>
                      <TableCell className="text-right font-mono">₹{c.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t bg-muted/30">
                    <TableCell>Gross Profit</TableCell>
                    <TableCell className="text-right font-mono">₹{grossProfit.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Operating Expenses */}
            <div>
              <h3 className="font-semibold text-red-600 mb-2">Operating Expenses</h3>
              <Table>
                <TableBody>
                  {pnl.expenses.map((e) => (
                    <TableRow key={e.name}>
                      <TableCell className="pl-6">{e.name}</TableCell>
                      <TableCell className="text-right font-mono">₹{e.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell>Total Expenses</TableCell>
                    <TableCell className="text-right font-mono text-red-600">₹{totalExpenses.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Net Profit */}
            <div className={`p-4 rounded-lg ${netProfit >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Net Profit</span>
                <span className={`text-2xl font-bold font-mono ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{netProfit.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Profit margin: {((netProfit / totalRevenue) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
