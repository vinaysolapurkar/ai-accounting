"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { COUNTRY_CONFIG, type CountryCode } from "@/lib/supabase/types";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("ledgerai_user") || "{}");
  } catch { return {}; }
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // User context
  const [userCountry, setUserCountry] = useState<CountryCode>("IN");
  const [currency, setCurrency] = useState("INR");
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  // Form fields
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-0001");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState(0);

  // Load user's country and set defaults
  useEffect(() => {
    const user = getUser();
    const country = (user.country || "IN") as CountryCode;
    const config = COUNTRY_CONFIG[country];
    if (config) {
      setUserCountry(country);
      setCurrency(config.currency);
      setCurrencySymbol(config.currencySymbol);
      setTaxRate(config.defaultTaxRate);
    }

    // Fetch next invoice number
    if (user.id) {
      fetch("/api/invoices?action=next-number", {
        headers: { "x-user-id": user.id },
      }).then(r => r.ok ? r.json() : null).then(d => {
        if (d?.invoiceNumber) setInvoiceNumber(d.invoiceNumber);
      }).catch(() => {});
    }
  }, []);

  const config = COUNTRY_CONFIG[userCountry];
  const taxRates = config?.taxRates || [];

  const subtotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUser();
    if (!user.id) { toast.error("Not logged in"); return; }
    if (!clientName) { toast.error("Client name is required"); return; }
    if (!dueDate) { toast.error("Due date is required"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail || undefined,
          client_tax_id: clientTaxId || undefined,
          invoice_number: invoiceNumber,
          date: invoiceDate,
          due_date: dueDate,
          subtotal,
          tax_total: taxAmount,
          total,
          currency,
          line_items: lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create invoice");
      }
      toast.success("Invoice created successfully!");
      router.push("/invoices");
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-2xl font-bold">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Client Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Client Name</Label><Input placeholder="Company or person name" required value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
                  <div><Label>Client Email</Label><Input type="email" placeholder="client@example.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
                </div>
                <div>
                  <Label>Tax ID ({config?.taxType === "GST" ? "GSTIN" : config?.taxType === "VAT" ? "VAT Number" : "Tax ID"})</Label>
                  <Input placeholder="Optional" value={clientTaxId} onChange={(e) => setClientTaxId(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Line Items</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {lineItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-5">
                      {i === 0 && <Label className="text-xs">Description</Label>}
                      <Input placeholder="Service or product" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      {i === 0 && <Label className="text-xs">Qty</Label>}
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="sm:col-span-3">
                      {i === 0 && <Label className="text-xs">Unit Price</Label>}
                      <Input type="number" min={0} value={item.unitPrice} onChange={(e) => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="sm:col-span-1 text-right font-mono text-sm py-2">
                      {currencySymbol}{(item.quantity * item.unitPrice).toLocaleString()}
                    </div>
                    <div className="sm:col-span-1">
                      {lineItems.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-4 h-4 mr-2" /> Add Line Item
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Invoice Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Invoice Number</Label><Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
                <div><Label>Date</Label><Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
                <div><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
                <div>
                  <Label>{config?.taxType || "Tax"} Rate</Label>
                  <Select value={taxRate.toString()} onValueChange={(v) => setTaxRate(parseFloat(v || "0"))}>
                    <SelectTrigger>
                      <SelectValue>
                        {(() => { const r = taxRates.find(t => t.rate === taxRate); return r ? r.label : `${taxRate}%`; })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {taxRates.map((t) => (
                        <SelectItem key={t.rate} value={t.rate.toString()}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono">{currencySymbol}{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span>{config?.taxType || "Tax"} ({taxRate}%)</span><span className="font-mono">{currencySymbol}{taxAmount.toLocaleString()}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="font-mono">{currencySymbol}{total.toLocaleString()}</span></div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Invoice
              </Button>
              <Button type="button" variant="outline" className="w-full">Save as Draft</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
