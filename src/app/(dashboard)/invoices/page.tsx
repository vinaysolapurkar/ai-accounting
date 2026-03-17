"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";

const invoices = [
  { id: "INV-001", client: "Acme Corp", amount: 25000, date: "2026-03-15", due: "2026-04-14", status: "sent" },
  { id: "INV-002", client: "TechStart Ltd", amount: 15000, date: "2026-03-10", due: "2026-04-09", status: "paid" },
  { id: "INV-003", client: "Design Co", amount: 8500, date: "2026-03-05", due: "2026-04-04", status: "overdue" },
  { id: "INV-004", client: "Global Inc", amount: 45000, date: "2026-03-01", due: "2026-03-31", status: "paid" },
  { id: "INV-005", client: "StartupXYZ", amount: 12000, date: "2026-02-25", due: "2026-03-25", status: "draft" },
];

const statusConfig: Record<string, { icon: React.ElementType; color: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { icon: FileText, color: "text-muted-foreground", variant: "outline" },
  sent: { icon: Send, color: "text-blue-500", variant: "secondary" },
  paid: { icon: CheckCircle, color: "text-green-500", variant: "default" },
  overdue: { icon: AlertCircle, color: "text-red-500", variant: "destructive" },
};

export default function InvoicesPage() {
  const totalOutstanding = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);

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
                const config = statusConfig[inv.status];
                return (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">{inv.id}</TableCell>
                    <TableCell className="font-medium">{inv.client}</TableCell>
                    <TableCell className="text-sm">{inv.date}</TableCell>
                    <TableCell className="text-sm">{inv.due}</TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="text-xs capitalize">{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">₹{inv.amount.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
