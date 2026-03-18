"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, Settings, LogOut, User as UserIcon, CreditCard, Receipt, FileText, AlertTriangle, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { User } from "@/lib/supabase/types";

interface HeaderProps {
  onMenuClick: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  icon: typeof Bell;
  time: string;
  read: boolean;
  href?: string;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const buildNotifications = useCallback(async (userData: User) => {
    const notifs: Notification[] = [];
    const userId = userData.id;

    try {
      // Check pending receipts
      const receiptsRes = await fetch("/api/receipts", { headers: { "x-user-id": userId } });
      if (receiptsRes.ok) {
        const receipts = await receiptsRes.json();
        const pending = receipts.filter((r: any) => r.status === "pending");
        if (pending.length > 0) {
          notifs.push({
            id: "pending-receipts",
            title: "Pending Receipts",
            message: `${pending.length} receipt${pending.length > 1 ? "s" : ""} waiting to be processed`,
            icon: Receipt,
            time: "Now",
            read: false,
            href: "/receipts",
          });
        }
      }

      // Check overdue invoices
      const invoicesRes = await fetch("/api/invoices", { headers: { "x-user-id": userId } });
      if (invoicesRes.ok) {
        const invoices = await invoicesRes.json();
        const overdue = invoices.filter((i: any) => i.status !== "paid" && i.due_date < new Date().toISOString().split("T")[0]);
        if (overdue.length > 0) {
          notifs.push({
            id: "overdue-invoices",
            title: "Overdue Invoices",
            message: `${overdue.length} invoice${overdue.length > 1 ? "s" : ""} past due date`,
            icon: FileText,
            time: "Today",
            read: false,
            href: "/invoices",
          });
        }
        const draft = invoices.filter((i: any) => i.status === "draft");
        if (draft.length > 0) {
          notifs.push({
            id: "draft-invoices",
            title: "Draft Invoices",
            message: `${draft.length} draft invoice${draft.length > 1 ? "s" : ""} not yet sent`,
            icon: FileText,
            time: "Recent",
            read: true,
            href: "/invoices",
          });
        }
      }

      // Free plan reminder
      if (userData.plan === "free") {
        notifs.push({
          id: "upgrade",
          title: "Upgrade Your Plan",
          message: "Get unlimited receipts, AI queries & reports",
          icon: CreditCard,
          time: "",
          read: true,
          href: "/settings",
        });
      }
    } catch {
      // Silently fail — notifications are non-critical
    }

    if (notifs.length === 0) {
      notifs.push({
        id: "all-good",
        title: "All caught up!",
        message: "No pending items right now",
        icon: Bell,
        time: "",
        read: true,
      });
    }

    setNotifications(notifs);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      buildNotifications(parsed);
    }
  }, [buildNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("ledgerai_user");
    window.location.href = "/";
  };

  const initials = user?.business_name
    ? user.business_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const unreadCount = notifications.filter(n => !n.read).length;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-sm font-semibold">{user?.business_name || "My Business"}</h2>
          <p className="text-xs text-muted-foreground">{user?.country || ""} | {user?.currency || ""}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Badge variant="secondary" className="hidden sm:flex cursor-pointer hover:bg-secondary/80">
            {user?.plan?.toUpperCase() || "FREE"} Plan
          </Badge>
        </Link>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative cursor-pointer focus:outline-none inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b">
              <p className="font-semibold text-sm">Notifications</p>
            </div>
            {notifications.map((n) => {
              const content = (
                <div className="flex items-start gap-3 px-3 py-2.5 w-full">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.read ? "bg-muted" : "bg-primary/10"}`}>
                    <n.icon className={`w-4 h-4 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? "" : "font-medium"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                  {n.time && <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>}
                </div>
              );
              return (
                <DropdownMenuItem key={n.id} className="p-0">
                  {n.href ? <Link href={n.href} className="w-full">{content}</Link> : content}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full cursor-pointer focus:outline-none">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.business_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/settings" className="flex items-center gap-2 w-full">
                <UserIcon className="w-4 h-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="flex items-center gap-2 w-full">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
