"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
  const [taxRate, setTaxRate] = useState(18);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Invoice created successfully!");
    router.push("/invoices");
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Client Name</Label><Input placeholder="Company or person name" required /></div>
                  <div><Label>Client Email</Label><Input type="email" placeholder="client@example.com" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tax ID (GSTIN/VAT)</Label><Input placeholder="Optional" /></div>
                  <div><Label>Country</Label>
                    <Select defaultValue="IN">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">India</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Line Items</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {lineItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {i === 0 && <Label className="text-xs">Description</Label>}
                      <Input placeholder="Service or product" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <Label className="text-xs">Qty</Label>}
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <Label className="text-xs">Unit Price</Label>}
                      <Input type="number" min={0} value={item.unitPrice} onChange={(e) => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-1 text-right font-mono text-sm py-2">
                      ₹{(item.quantity * item.unitPrice).toLocaleString()}
                    </div>
                    <div className="col-span-1">
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
                <div><Label>Invoice Number</Label><Input defaultValue="INV-006" /></div>
                <div><Label>Date</Label><Input type="date" defaultValue={new Date().toISOString().split("T")[0]} /></div>
                <div><Label>Due Date</Label><Input type="date" /></div>
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Select value={taxRate.toString()} onValueChange={(v) => setTaxRate(parseInt(v || "0"))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Tax (0%)</SelectItem>
                      <SelectItem value="5">GST 5%</SelectItem>
                      <SelectItem value="12">GST 12%</SelectItem>
                      <SelectItem value="18">GST 18%</SelectItem>
                      <SelectItem value="28">GST 28%</SelectItem>
                      <SelectItem value="10">GST 10% (AU)</SelectItem>
                      <SelectItem value="15">GST 15% (NZ)</SelectItem>
                      <SelectItem value="20">VAT 20% (UK)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono">₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span>Tax ({taxRate}%)</span><span className="font-mono">₹{taxAmount.toLocaleString()}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="font-mono">₹{total.toLocaleString()}</span></div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button type="submit" className="w-full">Create Invoice</Button>
              <Button type="button" variant="outline" className="w-full">Save as Draft</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
