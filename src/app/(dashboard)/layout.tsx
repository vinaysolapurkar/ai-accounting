"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Receipt, MessageSquare, ArrowLeftRight,
  BookOpen, FileText, BarChart3, Building2, Link2, Settings, Sparkles, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/receipts", icon: Receipt, label: "Receipts" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/ledger", icon: BookOpen, label: "Ledger" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/reconciliation", icon: Building2, label: "Reconciliation" },
  { href: "/integrations", icon: Link2, label: "Integrations" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-16 flex items-center px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">LedgerAI</span>
            </Link>
          </div>
          <nav className="py-4 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={() => {
                localStorage.removeItem("ledgerai_user");
                window.location.href = "/";
              }}
            >
              <LogOut className="w-5 h-5" /> Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
