"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  MessageSquare,
  ArrowLeftRight,
  BookOpen,
  FileText,
  BarChart3,
  Building2,
  Link2,
  Settings,
  Sparkles,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("ledgerai_user");
    window.location.href = "/";
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-card border-r h-screen sticky top-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold">LedgerAI</span>}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>
    </aside>
  );
}
