"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Send, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function getUserId(): string {
  try {
    return JSON.parse(localStorage.getItem("ledgerai_user") || "{}").id || "";
  } catch { return ""; }
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
  date: string;
  due_date: string;
  status: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { icon: FileText, color: "text-muted-foreground", variant: "outline" },
  sent: { icon: Send, color: "text-blue-500", variant: "secondary" },
  paid: { icon: CheckCircle, color: "text-green-500", variant: "default" },
  overdue: { icon: AlertCircle, color: "text-red-500", variant: "destructive" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      const userId = getUserId();
      if (!userId) { setLoading(false); return; }
      try {
        const res = await fetch("/api/invoices", {
          headers: { "x-user-id": userId },
        });
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const data = await res.json();
        setInvoices(data);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const totalOutstanding = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (Number(i.total) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm">Create, send, and track invoices</p>
        </div>
        <Link href="/invoices/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Outstanding</p><p className="text-xl font-bold text-orange-500">₹{totalOutstanding.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Paid</p><p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Invoices</p><p className="text-xl font-bold">{invoices.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading invoices...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No invoices found. Create your first invoice to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const config = statusConfig[inv.status] || statusConfig.draft;
                  return (
                    <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">{inv.invoice_number}</TableCell>
                      <TableCell className="font-medium">{inv.client_name}</TableCell>
                      <TableCell className="text-sm">{inv.date}</TableCell>
                      <TableCell className="text-sm">{inv.due_date}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="text-xs capitalize">{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">₹{(Number(inv.total) || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
