"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Camera, Upload, FileImage, Loader2, Check, X, Edit2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { NewAccountDialog } from "@/components/new-account-dialog";
import { getPlanLimits } from "@/lib/plan-limits";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("ledgerai_user") || "{}");
  } catch { return {}; }
}

function getUserId(): string {
  return getUser().id || "";
}

interface ExtractedReceipt {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  lineItems: { description: string; amount: number }[];
  taxInfo: { type: string; rate: number; amount: number } | null;
  currency: string;
}

interface PastReceipt {
  id: string;
  extracted_vendor: string;
  extracted_amount: number;
  extracted_date: string;
  extracted_category: string;
  status: string;
  created_at: string;
}

export default function ReceiptsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedReceipt | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pastReceipts, setPastReceipts] = useState<PastReceipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string; code: string; type: string }[]>([]);
  const [debitAccountId, setDebitAccountId] = useState("");
  const [creditAccountId, setCreditAccountId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchReceipts = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setLoadingReceipts(false); return; }
    try {
      const res = await fetch("/api/receipts", {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("Failed to fetch receipts");
      const data = await res.json();
      setPastReceipts(data);
    } catch (err) {
      console.error("Failed to fetch receipts:", err);
    } finally {
      setLoadingReceipts(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const res = await fetch("/api/accounts", { headers: { "x-user-id": userId } });
      if (res.ok) setAccounts(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchReceipts();
    fetchAccounts();
  }, [fetchReceipts, fetchAccounts]);

  // Auto-detect debit/credit accounts when receipt is extracted
  useEffect(() => {
    if (!extractedData || accounts.length === 0) return;

    const category = (extractedData.category || "").toLowerCase();
    const vendor = (extractedData.vendor || "").toLowerCase();

    // Category-to-account keyword mapping
    const categoryMap: Record<string, string[]> = {
      "food": ["food", "meal", "dining", "restaurant"],
      "travel": ["travel", "transport", "uber", "cab", "fuel", "gas"],
      "office": ["office", "supplies", "stationery"],
      "software": ["software", "subscription", "cloud", "hosting", "saas", "aws", "adobe"],
      "utilities": ["utility", "utilities", "electric", "water", "internet", "phone"],
      "rent": ["rent", "lease", "wework", "coworking"],
      "marketing": ["marketing", "ads", "advertising", "google ads", "facebook"],
    };

    // Find best matching expense account
    let bestExpense = "";
    for (const [, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(k => category.includes(k) || vendor.includes(k))) {
        // Find an expense account whose name matches these keywords
        const match = accounts.find(a =>
          a.type === "expense" && keywords.some(k => a.name.toLowerCase().includes(k))
        );
        if (match) { bestExpense = match.id; break; }
      }
    }
    // Fallback: first expense account
    if (!bestExpense) {
      const fallback = accounts.find(a => a.type === "expense");
      if (fallback) bestExpense = fallback.id;
    }

    // Credit side: prefer bank, then cash
    const bankAcc = accounts.find(a => a.code === "1010" || (a.type === "asset" && a.name.toLowerCase().includes("bank")));
    const cashAcc = accounts.find(a => a.code === "1000" || (a.type === "asset" && a.name.toLowerCase().includes("cash")));
    const bestCredit = bankAcc?.id || cashAcc?.id || "";

    if (bestExpense) setDebitAccountId(bestExpense);
    if (bestCredit) setCreditAccountId(bestCredit);
  }, [extractedData, accounts]);

  const processReceipt = useCallback(async (file: File) => {
    // Check plan limits
    const user = getUser();
    const limits = getPlanLimits(user.plan || "free");
    if (limits.receiptsPerMonth !== Infinity) {
      const monthReceipts = pastReceipts.filter(r => {
        const d = new Date(r.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      if (monthReceipts.length >= limits.receiptsPerMonth) {
        toast.error(`Free plan limit: ${limits.receiptsPerMonth} receipts/month. Upgrade to Pro for unlimited.`);
        return;
      }
    }

    setIsProcessing(true);
    setPreviewUrl(URL.createObjectURL(file));
    const userId = getUserId();

    try {
      const base64 = await fileToBase64(file);

      // Try client-side OCR first using canvas for text extraction
      let ocrText = "";
      try {
        ocrText = await clientSideOCR(file);
      } catch {
        // Client-side OCR not available, will send image directly
      }

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          image: base64,
          ...(ocrText ? { ocrText } : {}),
        }),
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

  const handleConfirm = async () => {
    if (!extractedData) return;
    const userId = getUserId();
    if (!userId) { toast.error("Not logged in"); return; }
    if (!debitAccountId || !creditAccountId) {
      toast.error("Select both debit and credit accounts");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          date: extractedData.date,
          description: extractedData.vendor,
          source: "receipt_scan",
          currency: extractedData.currency,
          lines: [
            { account_id: debitAccountId, debit: extractedData.amount, credit: 0 },
            { account_id: creditAccountId, debit: 0, credit: extractedData.amount },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create transaction");
      }

      toast.success("Transaction created from receipt!");
      setExtractedData(null);
      setPreviewUrl(null);
      setDebitAccountId("");
      setCreditAccountId("");
      fetchReceipts();
    } catch (err: any) {
      toast.error(err.message || "Failed to create transaction from receipt");
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return dateStr; }
  };

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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Debit Account</Label>
                      <Select value={debitAccountId} onValueChange={(v) => setDebitAccountId(v || "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select...">
                            {(() => { const a = accounts.find(x => x.id === debitAccountId); return a ? `${a.code} - ${a.name}` : undefined; })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Credit Account</Label>
                      <Select value={creditAccountId} onValueChange={(v) => setCreditAccountId(v || "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select...">
                            {(() => { const a = accounts.find(x => x.id === creditAccountId); return a ? `${a.code} - ${a.name}` : undefined; })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <NewAccountDialog userId={getUserId()} onCreated={fetchAccounts} />

                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={handleConfirm} disabled={confirming || !debitAccountId || !creditAccountId}>
                      {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Confirm & Create Transaction
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
            {loadingReceipts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading receipts...</span>
              </div>
            ) : pastReceipts.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No receipts yet. Upload your first receipt to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {pastReceipts.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileImage className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{r.extracted_vendor || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(r.extracted_date || r.created_at)} &middot; {r.extracted_category || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{(Number(r.extracted_amount) || 0).toLocaleString()}</p>
                      <Badge variant={r.status === "linked" ? "default" : r.status === "pending" ? "secondary" : "outline"} className="text-xs">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function clientSideOCR(file: File): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const { data: { text } } = await Tesseract.recognize(file, "eng", {
    logger: () => {}, // suppress logs
  });
  return text.trim();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}
