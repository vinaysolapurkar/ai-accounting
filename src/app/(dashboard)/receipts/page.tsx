"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera, Upload, FileImage, Loader2, Check, X, Edit2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface ExtractedReceipt {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  lineItems: { description: string; amount: number }[];
  taxInfo: { type: string; rate: number; amount: number } | null;
  currency: string;
}

export default function ReceiptsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedReceipt | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processReceipt = useCallback(async (file: File) => {
    setIsProcessing(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) throw new Error("OCR failed");

      const data = await response.json();
      setExtractedData(data);
      toast.success("Receipt processed successfully!");
    } catch {
      // Fallback to demo data if API fails
      setExtractedData({
        vendor: "Sample Restaurant",
        amount: 1240,
        date: new Date().toISOString().split("T")[0],
        category: "Food & Dining",
        lineItems: [
          { description: "Lunch Combo", amount: 850 },
          { description: "Beverages", amount: 390 },
        ],
        taxInfo: { type: "GST", rate: 5, amount: 59 },
        currency: "INR",
      });
      toast.info("Using demo data (API not configured yet)");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processReceipt(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processReceipt(file);
  }, [processReceipt]);

  const handleConfirm = () => {
    toast.success("Transaction created from receipt!");
    setExtractedData(null);
    setPreviewUrl(null);
  };

  const pastReceipts = [
    { id: "1", vendor: "Amazon", amount: 2340, date: "Mar 17", status: "linked", category: "Office" },
    { id: "2", vendor: "Uber", amount: 450, date: "Mar 16", status: "pending", category: "Transport" },
    { id: "3", vendor: "WeWork", amount: 15000, date: "Mar 15", status: "linked", category: "Rent" },
    { id: "4", vendor: "Starbucks", amount: 380, date: "Mar 14", status: "reviewed", category: "Food" },
    { id: "5", vendor: "Adobe", amount: 1500, date: "Mar 13", status: "linked", category: "Software" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Receipt Scanner</h1>
        <p className="text-muted-foreground text-sm">Upload or photograph receipts for AI-powered extraction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> AI Receipt Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!extractedData && !isProcessing && (
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-1">Drop receipt here or click to upload</p>
                <p className="text-sm text-muted-foreground mb-4">Supports JPG, PNG, PDF up to 10MB</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <Upload className="w-4 h-4 mr-2" /> Upload File
                  </Button>
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                    <Camera className="w-4 h-4 mr-2" /> Take Photo
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="font-medium">Processing receipt...</p>
                <p className="text-sm text-muted-foreground">AI is extracting data from your receipt</p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-4">
                {previewUrl && (
                  <div className="relative rounded-lg overflow-hidden bg-muted h-48">
                    <img src={previewUrl} alt="Receipt" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Extracted Data</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                      <Edit2 className="w-4 h-4 mr-1" /> {isEditing ? "Done" : "Edit"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Vendor</Label>
                      {isEditing ? (
                        <Input value={extractedData.vendor} onChange={(e) => setExtractedData({...extractedData, vendor: e.target.value})} />
                      ) : (
                        <p className="font-medium">{extractedData.vendor}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      {isEditing ? (
                        <Input type="number" value={extractedData.amount} onChange={(e) => setExtractedData({...extractedData, amount: parseFloat(e.target.value)})} />
                      ) : (
                        <p className="font-medium text-lg">{extractedData.currency} {extractedData.amount.toLocaleString()}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <p className="font-medium">{extractedData.date}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <p className="font-medium">{extractedData.category}</p>
                    </div>
                  </div>

                  {extractedData.taxInfo && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Tax</p>
                      <p className="text-sm font-medium">
                        {extractedData.taxInfo.type} @ {extractedData.taxInfo.rate}% = {extractedData.currency} {extractedData.taxInfo.amount}
                      </p>
                    </div>
                  )}

                  {extractedData.lineItems.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Line Items</p>
                      {extractedData.lineItems.map((item, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b last:border-0 text-sm">
                          <span>{item.description}</span>
                          <span className="font-medium">{extractedData.currency} {item.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={handleConfirm}>
                      <Check className="w-4 h-4 mr-2" /> Confirm & Create Transaction
                    </Button>
                    <Button variant="outline" onClick={() => { setExtractedData(null); setPreviewUrl(null); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastReceipts.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileImage className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.vendor}</p>
                      <p className="text-xs text-muted-foreground">{r.date} &middot; {r.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{r.amount.toLocaleString()}</p>
                    <Badge variant={r.status === "linked" ? "default" : r.status === "pending" ? "secondary" : "outline"} className="text-xs">
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}
