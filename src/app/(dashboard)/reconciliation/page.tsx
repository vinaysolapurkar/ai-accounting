"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Check, X, Sparkles, ArrowLeftRight, FileUp } from "lucide-react";
import { toast } from "sonner";

const demoMatches = [
  { id: "1", bankDate: "Mar 15", bankDesc: "NEFT-ACME CORP", bankAmount: 15000, txnDate: "Mar 15", txnDesc: "Client Payment - Acme Corp", txnAmount: 15000, confidence: 98, status: "pending" },
  { id: "2", bankDate: "Mar 14", bankDesc: "UPI-AMAZON", bankAmount: -2340, txnDate: "Mar 14", txnDesc: "Office Supplies - Amazon", txnAmount: 2340, confidence: 95, status: "pending" },
  { id: "3", bankDate: "Mar 13", bankDesc: "NEFT-XYZ LTD", bankAmount: 25000, txnDate: "Mar 13", txnDesc: "Client Payment - XYZ Ltd", txnAmount: 25000, confidence: 92, status: "pending" },
  { id: "4", bankDate: "Mar 12", bankDesc: "DD-ELECTRICITY", bankAmount: -1850, txnDate: "Mar 12", txnDesc: "Electricity Bill - MSEB", txnAmount: 1850, confidence: 88, status: "pending" },
  { id: "5", bankDate: "Mar 11", bankDesc: "UPI-SWIGGY", bankAmount: -680, txnDate: null, txnDesc: null, txnAmount: null, confidence: 0, status: "unmatched" },
];

export default function ReconciliationPage() {
  const [matches, setMatches] = useState(demoMatches);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
    toast.success("Bank statement processed! AI found 4 matches.");
  };

  const confirmMatch = (id: string) => {
    setMatches(matches.map(m => m.id === id ? { ...m, status: "confirmed" } : m));
    toast.success("Match confirmed!");
  };

  const rejectMatch = (id: string) => {
    setMatches(matches.map(m => m.id === id ? { ...m, status: "rejected" } : m));
  };

  const confirmed = matches.filter(m => m.status === "confirmed").length;
  const pending = matches.filter(m => m.status === "pending").length;
  const unmatched = matches.filter(m => m.status === "unmatched").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6" /> Bank Reconciliation
        </h1>
        <p className="text-muted-foreground text-sm">Upload bank statements and let AI match transactions</p>
      </div>

      {!uploaded ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Bank Statement</h3>
            <p className="text-muted-foreground mb-6">Upload a CSV or PDF bank statement to start reconciliation</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleUpload}><Upload className="w-4 h-4 mr-2" /> Upload CSV</Button>
              <Button variant="outline" onClick={handleUpload}><Upload className="w-4 h-4 mr-2" /> Upload PDF</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Confirmed</p><p className="text-xl font-bold text-green-600">{confirmed}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending Review</p><p className="text-xl font-bold text-orange-500">{pending}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Unmatched</p><p className="text-xl font-bold text-red-500">{unmatched}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI-Matched Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Entry</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Matched Transaction</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{m.bankDesc}</p>
                        <p className="text-xs text-muted-foreground">{m.bankDate}</p>
                      </TableCell>
                      <TableCell className={`font-semibold ${m.bankAmount > 0 ? "text-green-600" : "text-red-500"}`}>
                        {m.bankAmount > 0 ? "+" : ""}₹{Math.abs(m.bankAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {m.txnDesc ? (
                          <p className="text-sm">{m.txnDesc}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No match found</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.confidence > 0 ? (
                          <Badge variant={m.confidence >= 90 ? "default" : "secondary"}>
                            {m.confidence}%
                          </Badge>
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          m.status === "confirmed" ? "default" :
                          m.status === "rejected" ? "destructive" :
                          m.status === "unmatched" ? "outline" : "secondary"
                        } className="text-xs capitalize">{m.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {m.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => confirmMatch(m.id)}>
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => rejectMatch(m.id)}>
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
