"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, Camera, MessageSquare,
  FileText, ArrowRight, Plus, Upload,
} from "lucide-react";
import type { User } from "@/lib/supabase/types";

const currencySymbols: Record<string, string> = {
  INR: "\u20b9", USD: "$", GBP: "\u00a3", EUR: "\u20ac", AUD: "A$", NZD: "NZ$",
};

// Demo fallback data
const demoStats = [
  { label: "Money In", value: "$24,563", change: "+12.5%", trend: "up" },
  { label: "Money Out", value: "$8,234", change: "+3.2%", trend: "up" },
  { label: "You Kept", value: "$16,329", change: "+18.3%", trend: "up" },
  { label: "To Review", value: "7", change: "Review needed", trend: "neutral" },
];

const demoTransactions = [
  { id: "1", date: "Mar 17", description: "Office Supplies - Amazon", amount: "-$2,340", category: "Office Expenses" },
  { id: "2", date: "Mar 16", description: "Client Payment - Acme Corp", amount: "+$15,000", category: "Revenue" },
  { id: "3", date: "Mar 15", description: "Electricity Bill", amount: "-$1,850", category: "Utilities" },
  { id: "4", date: "Mar 14", description: "Software Subscription", amount: "-$999", category: "Software" },
  { id: "5", date: "Mar 13", description: "Consulting Fee - Client B", amount: "+$8,500", category: "Revenue" },
];

const demoReceipts = [
  { vendor: "Uber Eats", amount: "$450", date: "Mar 17", category: "Food & Dining" },
  { vendor: "AWS", amount: "$3,200", date: "Mar 16", category: "Cloud Services" },
  { vendor: "WeWork", amount: "$15,000", date: "Mar 15", category: "Rent" },
];

const statIcons = [DollarSign, TrendingDown, TrendingUp, Receipt];
const statBorderColors = [
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-blue-500",
  "border-l-orange-500",
];
const statIconColors = [
  "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10",
  "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10",
  "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10",
  "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10",
];

function getUserId(): string | null {
  try {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.id || null;
    }
  } catch {}
  return null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ label: string; value: string; change: string; trend: string }[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<{ id: string; date: string; description: string; amount: string; category: string }[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<{ vendor: string; amount: string; date: string; category: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      // No user, use demo data
      setStats(demoStats);
      setRecentTransactions(demoTransactions);
      setPendingReceipts(demoReceipts);
      setLoading(false);
      return;
    }

    const headers = { "x-user-id": userId };

    Promise.all([
      fetch("/api/dashboard", { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/transactions?limit=5", { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/receipts", { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([dashboardData, txnData, receiptsData]) => {
        const sym = currencySymbols[user?.currency || "USD"] || "$";

        // Dashboard stats
        if (dashboardData) {
          setStats([
            {
              label: "Money In",
              value: `${sym}${Number(dashboardData.revenue ?? 0).toLocaleString()}`,
              change: dashboardData.revenueChange ?? "+0%",
              trend: "up",
            },
            {
              label: "Money Out",
              value: `${sym}${Number(dashboardData.expenses ?? 0).toLocaleString()}`,
              change: dashboardData.expensesChange ?? "+0%",
              trend: "up",
            },
            {
              label: "You Kept",
              value: `${sym}${Number(dashboardData.netProfit ?? 0).toLocaleString()}`,
              change: dashboardData.netProfitChange ?? "+0%",
              trend: "up",
            },
            {
              label: "To Review",
              value: String(dashboardData.pendingReceipts ?? 0),
              change: "Review needed",
              trend: "neutral",
            },
          ]);
        } else {
          setStats(demoStats.map((s) => ({
            ...s,
            value: s.value.replace("$", sym),
          })));
        }

        // Transactions
        if (txnData && Array.isArray(txnData)) {
          setRecentTransactions(
            txnData.map((t: any) => ({
              id: t.id,
              date: t.date ? new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
              description: t.description || t.narration || "",
              amount: `${t.type === "credit" || Number(t.amount) > 0 ? "+" : "-"}${sym}${Math.abs(Number(t.amount)).toLocaleString()}`,
              category: t.category || "",
            }))
          );
        } else if (txnData && txnData.transactions && Array.isArray(txnData.transactions)) {
          setRecentTransactions(
            txnData.transactions.map((t: any) => ({
              id: t.id,
              date: t.date ? new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
              description: t.description || t.narration || "",
              amount: `${t.type === "credit" || Number(t.amount) > 0 ? "+" : "-"}${sym}${Math.abs(Number(t.amount)).toLocaleString()}`,
              category: t.category || "",
            }))
          );
        } else {
          setRecentTransactions(demoTransactions.map((t) => ({
            ...t,
            amount: t.amount.replace("$", sym),
          })));
        }

        // Receipts - filter for pending
        if (receiptsData) {
          const arr = Array.isArray(receiptsData) ? receiptsData : receiptsData.receipts;
          if (Array.isArray(arr)) {
            const pending = arr.filter((r: any) => r.status === "pending");
            setPendingReceipts(
              pending.map((r: any) => ({
                vendor: r.vendor || r.merchant || "Unknown",
                amount: `${sym}${Number(r.amount ?? 0).toLocaleString()}`,
                date: r.date ? new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
                category: r.category || "Uncategorized",
              }))
            );
          } else {
            setPendingReceipts(demoReceipts.map((r) => ({ ...r, amount: r.amount.replace("$", sym) })));
          }
        } else {
          setPendingReceipts(demoReceipts.map((r) => ({ ...r, amount: r.amount.replace("$", sym) })));
        }
      })
      .finally(() => setLoading(false));
  }, [user?.currency]);

  const sym = currencySymbols[user?.currency || "USD"] || "$";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1
            className="text-3xl md:text-4xl text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome back
            {user?.business_name ? (
              <>, <span className="gradient-text">{user.business_name}</span></>
            ) : (
              ""
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s your financial overview</p>
        </div>
        <div className="flex gap-3 animate-fade-up stagger-1">
          <Link href="/receipts">
            <Button
              size="sm"
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border"
            >
              <Camera className="w-4 h-4 mr-2" /> Snap a Receipt
            </Button>
          </Link>
          <Link href="/transactions">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> New Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card shadow-warm rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-20 bg-muted/50" />
                  <Skeleton className="h-9 w-9 rounded-lg bg-muted/50" />
                </div>
                <Skeleton className="h-8 w-28 mb-2 bg-muted/50" />
                <Skeleton className="h-3 w-16 bg-muted/50" />
              </div>
            ))
          : stats.map((stat, i) => {
              const Icon = statIcons[i] || DollarSign;
              const borderColor = statBorderColors[i] || "border-l-emerald-500";
              const iconColor = statIconColors[i] || "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10";
              return (
                <div
                  key={stat.label}
                  className={`bg-card shadow-warm rounded-xl p-5 border-l-[3px] ${borderColor} animate-fade-up stagger-${i + 1}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p
                    className={`text-xs mt-1 ${
                      stat.trend === "up" && stat.label !== "Money Out"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : stat.trend === "up" && stat.label === "Money Out"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
              );
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-card shadow-warm rounded-xl animate-fade-up stagger-3">
          <div className="flex items-center justify-between p-5 pb-0">
            <h2
              className="text-lg text-foreground font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recent Transactions
            </h2>
            <Link href="/transactions">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                View all <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="p-5 pt-4">
            <div className="space-y-1">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-lg bg-muted/50" />
                        <div>
                          <Skeleton className="h-4 w-36 mb-1.5 bg-muted/50" />
                          <Skeleton className="h-3 w-24 bg-muted/50" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16 bg-muted/50" />
                    </div>
                  ))
                : recentTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {txn.date} &middot; {txn.category}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          txn.amount.startsWith("+") ? "text-emerald-600 dark:text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {txn.amount}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card shadow-warm rounded-xl animate-fade-up stagger-4">
          <div className="p-5 pb-0">
            <h2
              className="text-lg text-foreground font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Quick Actions
            </h2>
          </div>
          <div className="p-5 pt-4 space-y-2">
            <Link href="/receipts" className="block">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border hover:bg-muted/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                    Snap a Receipt
                  </p>
                  <p className="text-xs text-muted-foreground">Upload or photograph</p>
                </div>
              </button>
            </Link>
            <Link href="/chat" className="block">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border hover:bg-muted/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                    Ask a Question
                  </p>
                  <p className="text-xs text-muted-foreground">Chat with your books</p>
                </div>
              </button>
            </Link>
            <Link href="/invoices/new" className="block">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border hover:bg-muted/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                    Send an Invoice
                  </p>
                  <p className="text-xs text-muted-foreground">Bill a client</p>
                </div>
              </button>
            </Link>
            <Link href="/reconciliation" className="block">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border hover:bg-muted/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                    Match Transactions
                  </p>
                  <p className="text-xs text-muted-foreground">Upload bank statement</p>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Receipts */}
      <div className="bg-card shadow-warm rounded-xl animate-fade-up stagger-5">
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2
              className="text-lg text-foreground font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pending Receipts
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Review AI-extracted data and confirm</p>
          </div>
          {!loading && (
            <Badge className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20">
              {pendingReceipts.length} pending
            </Badge>
          )}
        </div>
        <div className="p-5 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="h-5 w-16 bg-muted/50" />
                      <Skeleton className="h-3 w-12 bg-muted/50" />
                    </div>
                    <Skeleton className="h-4 w-24 mb-1.5 bg-muted/50" />
                    <Skeleton className="h-6 w-20 mb-1 bg-muted/50" />
                    <Skeleton className="h-3 w-16 mb-3 bg-muted/50" />
                    <Skeleton className="h-8 w-full bg-muted/50" />
                  </div>
                ))
              : pendingReceipts.map((receipt, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border hover:border-border hover:bg-muted/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-xs">
                        Pending
                      </Badge>
                      <span className="text-xs text-muted-foreground">{receipt.date}</span>
                    </div>
                    <p className="font-medium text-sm text-foreground">{receipt.vendor}</p>
                    <p className="text-lg font-bold text-foreground">{receipt.amount}</p>
                    <p className="text-xs text-muted-foreground mb-3">{receipt.category}</p>
                    <Button
                      size="sm"
                      className="w-full bg-muted/50 border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      variant="outline"
                    >
                      Review & Confirm
                    </Button>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
