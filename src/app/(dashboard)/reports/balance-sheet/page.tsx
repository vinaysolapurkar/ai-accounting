"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LineItem {
  name: string;
  amount: number;
}

interface BalanceSheetData {
  date: string;
  assets: {
    current: LineItem[];
    fixed: LineItem[];
  };
  liabilities: {
    current: LineItem[];
  };
  equity: LineItem[];
}

const fallbackData: BalanceSheetData = {
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

function getUserId(): string | null {
  try {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) return JSON.parse(stored).id || null;
  } catch {}
  return null;
}

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BalanceSheetData>(fallbackData);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch("/api/reports?type=balance-sheet", {
      headers: { "x-user-id": userId },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res && res.assets) {
          setData({
            date: res.date || fallbackData.date,
            assets: {
              current: Array.isArray(res.assets?.current) ? res.assets.current : fallbackData.assets.current,
              fixed: Array.isArray(res.assets?.fixed) ? res.assets.fixed : fallbackData.assets.fixed,
            },
            liabilities: {
              current: Array.isArray(res.liabilities?.current) ? res.liabilities.current : fallbackData.liabilities.current,
            },
            equity: Array.isArray(res.equity) ? res.equity : fallbackData.equity,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalAssets = [...data.assets.current, ...data.assets.fixed].reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = data.liabilities.current.reduce((s, l) => s + l.amount, 0);
  const totalEquity = data.equity.reduce((s, e) => s + e.amount, 0);
  const isBalanced = totalAssets === totalLiabilities + totalEquity;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded" />
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full mb-2" />
              ))}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full mb-2" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full mb-2" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-muted-foreground text-sm">As of {data.date}</p>
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
                  {data.assets.current.map((a) => (
                    <TableRow key={a.name}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="text-right font-mono">{"\u20b9"}{a.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Fixed Assets</h4>
              <Table>
                <TableBody>
                  {data.assets.fixed.map((a) => (
                    <TableRow key={a.name}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="text-right font-mono">{"\u20b9"}{a.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between pt-3 border-t font-bold">
              <span>Total Assets</span>
              <span className="font-mono">{"\u20b9"}{totalAssets.toLocaleString()}</span>
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
                  {data.liabilities.current.map((l) => (
                    <TableRow key={l.name}>
                      <TableCell>{l.name}</TableCell>
                      <TableCell className="text-right font-mono">{"\u20b9"}{l.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between pt-3 border-t font-bold">
                <span>Total Liabilities</span>
                <span className="font-mono">{"\u20b9"}{totalLiabilities.toLocaleString()}</span>
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
                  {data.equity.map((e) => (
                    <TableRow key={e.name}>
                      <TableCell>{e.name}</TableCell>
                      <TableCell className="text-right font-mono">{"\u20b9"}{e.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between pt-3 border-t font-bold">
                <span>Total Equity</span>
                <span className="font-mono">{"\u20b9"}{totalEquity.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Verification */}
      <Card className={isBalanced ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">Balance Verification</p>
            <p className="text-sm text-muted-foreground">
              Assets ({"\u20b9"}{totalAssets.toLocaleString()}) = Liabilities ({"\u20b9"}{totalLiabilities.toLocaleString()}) + Equity ({"\u20b9"}{totalEquity.toLocaleString()})
            </p>
          </div>
          <Badge variant={isBalanced ? "default" : "destructive"}>
            {isBalanced ? "\u2713 Balanced" : "\u2717 Unbalanced"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
