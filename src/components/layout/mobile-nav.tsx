"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  MessageSquare,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/receipts", icon: Receipt, label: "Receipts" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Txns" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center gap-1 py-2",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
