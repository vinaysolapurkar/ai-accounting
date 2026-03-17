"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Scale, TrendingUp, ArrowRight, Download } from "lucide-react";

const reports = [
  {
    title: "Balance Sheet",
    description: "Assets, liabilities, and equity at a point in time",
    icon: Scale,
    href: "/reports/balance-sheet",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    title: "Profit & Loss",
    description: "Revenue and expenses over a period",
    icon: TrendingUp,
    href: "/reports/profit-loss",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    title: "Trial Balance",
    description: "All account balances to verify debits = credits",
    icon: BarChart3,
    href: "/reports/trial-balance",
    color: "text-violet-500",
    bgColor: "bg-violet-50",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground text-sm">Generate and export your financial reports</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link key={report.title} href={report.href}>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl ${report.bgColor} flex items-center justify-center mb-3`}>
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <Button variant="ghost" size="sm" className="px-0">
                  View Report <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
