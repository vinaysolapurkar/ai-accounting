"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, Camera, MessageSquare,
  FileText, ArrowRight, Plus, Upload,
} from "lucide-react";
import type { User } from "@/lib/supabase/types";

const currencySymbols: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", EUR: "€", AUD: "A$", NZD: "NZ$",
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const sym = currencySymbols[user?.currency || "USD"] || "$";

  // Demo data
  const stats = [
    { label: "Revenue", value: `${sym}24,563`, change: "+12.5%", trend: "up", icon: DollarSign, color: "text-blue-500" },
    { label: "Expenses", value: `${sym}8,234`, change: "+3.2%", trend: "up", icon: TrendingDown, color: "text-red-500" },
    { label: "Net Profit", value: `${sym}16,329`, change: "+18.3%", trend: "up", icon: TrendingUp, color: "text-green-500" },
    { label: "Pending Receipts", value: "7", change: "Review needed", trend: "neutral", icon: Receipt, color: "text-orange-500" },
  ];

  const recentTransactions = [
    { id: "1", date: "Mar 17", description: "Office Supplies - Amazon", amount: `-${sym}2,340`, category: "Office Expenses" },
    { id: "2", date: "Mar 16", description: "Client Payment - Acme Corp", amount: `+${sym}15,000`, category: "Revenue" },
    { id: "3", date: "Mar 15", description: "Electricity Bill", amount: `-${sym}1,850`, category: "Utilities" },
    { id: "4", date: "Mar 14", description: "Software Subscription", amount: `-${sym}999`, category: "Software" },
    { id: "5", date: "Mar 13", description: "Consulting Fee - Client B", amount: `+${sym}8,500`, category: "Revenue" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{user?.business_name ? `, ${user.business_name}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">Here&apos;s your financial overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/receipts">
            <Button size="sm" variant="outline">
              <Camera className="w-4 h-4 mr-2" /> Scan Receipt
            </Button>
          </Link>
          <Link href="/transactions">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className={`text-xs mt-1 ${
                stat.trend === "up" && stat.label !== "Expenses" ? "text-green-600" :
                stat.trend === "up" && stat.label === "Expenses" ? "text-red-500" :
                "text-muted-foreground"
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 w-4 h-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{txn.date} &middot; {txn.category}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${txn.amount.startsWith("+") ? "text-green-600" : "text-red-500"}`}>
                    {txn.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/receipts" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Camera className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Scan Receipt</p>
                  <p className="text-xs text-muted-foreground">Upload or photograph</p>
                </div>
              </Button>
            </Link>
            <Link href="/chat" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <MessageSquare className="w-5 h-5 text-violet-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Ask AI</p>
                  <p className="text-xs text-muted-foreground">Chat with your books</p>
                </div>
              </Button>
            </Link>
            <Link href="/invoices/new" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <FileText className="w-5 h-5 text-green-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Create Invoice</p>
                  <p className="text-xs text-muted-foreground">Bill a client</p>
                </div>
              </Button>
            </Link>
            <Link href="/reconciliation" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Upload className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Reconcile</p>
                  <p className="text-xs text-muted-foreground">Upload bank statement</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pending Receipts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Pending Receipts</CardTitle>
            <p className="text-sm text-muted-foreground">Review AI-extracted data and confirm</p>
          </div>
          <Badge variant="secondary">7 pending</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { vendor: "Uber Eats", amount: `${sym}450`, date: "Mar 17", category: "Food & Dining" },
              { vendor: "AWS", amount: `${sym}3,200`, date: "Mar 16", category: "Cloud Services" },
              { vendor: "WeWork", amount: `${sym}15,000`, date: "Mar 15", category: "Rent" },
            ].map((receipt, i) => (
              <div key={i} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                    Pending
                  </Badge>
                  <span className="text-xs text-muted-foreground">{receipt.date}</span>
                </div>
                <p className="font-medium text-sm">{receipt.vendor}</p>
                <p className="text-lg font-bold">{receipt.amount}</p>
                <p className="text-xs text-muted-foreground">{receipt.category}</p>
                <Button size="sm" className="w-full mt-2" variant="outline">
                  Review & Confirm
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
