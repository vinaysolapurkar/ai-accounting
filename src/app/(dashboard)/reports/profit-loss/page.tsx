"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LineItem {
  name: string;
  amount: number;
}

interface PnLData {
  period: string;
  revenue: LineItem[];
  cogs: LineItem[];
  expenses: LineItem[];
}

const fallbackData: PnLData = {
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

function getUserId(): string | null {
  try {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) return JSON.parse(stored).id || null;
  } catch {}
  return null;
}

export default function ProfitLossPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PnLData>(fallbackData);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch("/api/reports?type=profit-loss", {
      headers: { "x-user-id": userId },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res) {
          setData({
            period: res.period || fallbackData.period,
            revenue: Array.isArray(res.revenue) ? res.revenue : fallbackData.revenue,
            cogs: Array.isArray(res.cogs) ? res.cogs : fallbackData.cogs,
            expenses: Array.isArray(res.expenses) ? res.expenses : fallbackData.expenses,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = data.revenue.reduce((s, r) => s + r.amount, 0);
  const totalCOGS = data.cogs.reduce((s, c) => s + c.amount, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded" />
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardContent className="p-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6" /> Profit & Loss</h1>
            <p className="text-muted-foreground text-sm">{data.period}</p>
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
                  {data.revenue.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="pl-6">{r.name}</TableCell>
                      <TableCell className="text-right font-mono">{"\u20b9"}{r.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell>Total Revenue</TableCell>
                    <TableCell className="text-right font-mono text-green-600">{"\u20b9"}{totalRevenue.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* COGS */}
            <div>
              <h3 className="font-semibold text-orange-600 mb-2">Cost of Goods/Services</h3>
              <Table>
                <TableBody>
                  {data.cogs.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="pl-6">{c.name}</TableCell>
                      <TableCell className="text-right font-mono">{"\u20b9"}{c.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t bg-muted/30">
                    <TableCell>Gross Profit</TableCell>
                    <TableCell className="text-right font-mono">{"\u20b9"}{grossProfit.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Operating Expenses */}
            <div>
              <h3 className="font-semibold text-red-600 mb-2">Operating Expenses</h3>
              <Table>
                <TableBody>
                  {data.expenses.map((e) => (
                    <TableRow key={e.name}>
                      <TableCell className="pl-6">{e.name}</TableCell>
                      <TableCell className="text-right font-mono">{"\u20b9"}{e.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell>Total Expenses</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{"\u20b9"}{totalExpenses.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Net Profit */}
            <div className={`p-4 rounded-lg ${netProfit >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Net Profit</span>
                <span className={`text-2xl font-bold font-mono ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {"\u20b9"}{netProfit.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Profit margin: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0"}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
