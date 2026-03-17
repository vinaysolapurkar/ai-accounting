"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Download, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

const demoTransactions = [
  { id: "1", date: "2026-03-17", description: "Office Supplies - Amazon", amount: 2340, type: "expense", status: "confirmed", category: "Office Expenses", source: "receipt_scan" },
  { id: "2", date: "2026-03-16", description: "Client Payment - Acme Corp", amount: 15000, type: "income", status: "confirmed", category: "Revenue", source: "manual" },
  { id: "3", date: "2026-03-15", description: "Electricity Bill - MSEB", amount: 1850, type: "expense", status: "confirmed", category: "Utilities", source: "receipt_scan" },
  { id: "4", date: "2026-03-14", description: "Adobe Creative Cloud", amount: 1500, type: "expense", status: "confirmed", category: "Software", source: "chat" },
  { id: "5", date: "2026-03-13", description: "Consulting Fee - Client B", amount: 8500, type: "income", status: "reconciled", category: "Revenue", source: "bank_import" },
  { id: "6", date: "2026-03-12", description: "Uber Rides", amount: 450, type: "expense", status: "draft", category: "Transport", source: "receipt_scan" },
  { id: "7", date: "2026-03-11", description: "AWS Hosting", amount: 3200, type: "expense", status: "confirmed", category: "Cloud Services", source: "receipt_scan" },
  { id: "8", date: "2026-03-10", description: "Client Payment - XYZ Ltd", amount: 25000, type: "income", status: "reconciled", category: "Revenue", source: "bank_import" },
  { id: "9", date: "2026-03-09", description: "Team Lunch", amount: 2100, type: "expense", status: "confirmed", category: "Food & Dining", source: "receipt_scan" },
  { id: "10", date: "2026-03-08", description: "WeWork Rent", amount: 15000, type: "expense", status: "confirmed", category: "Rent", source: "manual" },
];

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const filtered = demoTransactions.filter((t) => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm">Manage all your financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowNewDialog(true)}><Plus className="w-4 h-4 mr-2" /> New Transaction</Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); toast.success("Transaction created!"); setShowNewDialog(false); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select defaultValue="expense">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input placeholder="e.g., Office supplies from Amazon" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Office Expenses</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="food">Food & Dining</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Debit Account</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="ar">Accounts Receivable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Credit Account</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="ap">Accounts Payable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full">Create Transaction</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-xl font-bold text-red-500">₹{totalExpense.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Net</p>
            <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-500"}`}>
              ₹{(totalIncome - totalExpense).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "all")}>
          <SelectTrigger className="w-[140px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="reconciled">Reconciled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer"><div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div></TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="text-sm">{t.date}</TableCell>
                  <TableCell className="font-medium text-sm">{t.description}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.source.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "reconciled" ? "default" : t.status === "confirmed" ? "secondary" : "outline"} className="text-xs">
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold text-sm ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
