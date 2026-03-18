"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, User, CreditCard, Shield, Download, Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { COUNTRY_CONFIG, type CountryCode, type User as UserType } from "@/lib/supabase/types";

function getUserId(): string {
  try {
    return JSON.parse(localStorage.getItem("ledgerai_user") || "{}").id || "";
  } catch { return ""; }
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    features: [
      "25 receipts/month",
      "50 AI queries/month",
      "Basic reports",
      "Manual entry",
      "CSV export",
    ],
    limits: "For personal use & getting started",
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    period: "/month",
    popular: true,
    features: [
      "Unlimited receipts",
      "Unlimited AI queries",
      "All reports (P&L, Balance Sheet, Trial Balance)",
      "Multi-currency support",
      "Tally & QuickBooks export",
      "Invoice generation",
      "Priority support",
    ],
    limits: "For freelancers & small businesses",
  },
  {
    id: "business",
    name: "Business",
    price: 1499,
    period: "/month",
    features: [
      "Everything in Pro",
      "Multi-user access (up to 5)",
      "API access",
      "Custom chart of accounts",
      "Audit trail & compliance",
      "GST/VAT auto-filing prep",
      "Dedicated account manager",
    ],
    limits: "For growing businesses & teams",
  },
];

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "onboarding",
          userId: user.id,
          country: user.country,
          businessType: user.business_type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("ledgerai_user", JSON.stringify(data.user));
        setUser(data.user);
      } else {
        localStorage.setItem("ledgerai_user", JSON.stringify(user));
      }
      toast.success("Settings saved!");
    } catch {
      localStorage.setItem("ledgerai_user", JSON.stringify(user));
      toast.success("Settings saved locally!");
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;
    setUpgrading(planId);

    try {
      // Persist to database
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-plan",
          userId: user.id,
          plan: planId,
        }),
      });

      const updated = { ...user, plan: planId };

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem("ledgerai_user", JSON.stringify(data.user));
          setUser(data.user);
        } else {
          localStorage.setItem("ledgerai_user", JSON.stringify(updated));
          setUser(updated);
        }
      } else {
        // Fallback to local update
        localStorage.setItem("ledgerai_user", JSON.stringify(updated));
        setUser(updated);
      }

      setShowUpgrade(false);
      toast.success(`Upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`);
    } catch {
      const updated = { ...user, plan: planId };
      localStorage.setItem("ledgerai_user", JSON.stringify(updated));
      setUser(updated);
      setShowUpgrade(false);
      toast.success(`Plan updated to ${planId}!`);
    } finally {
      setUpgrading(null);
    }
  };

  const handleExportAll = async () => {
    const userId = getUserId();
    if (!userId) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/integrations?format=json&type=all`, {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledgerai-full-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (!user) return null;

  const currentPlan = plans.find(p => p.id === user.plan) || plans[0];
  const config = COUNTRY_CONFIG[(user.country || "IN") as CountryCode];
  const currencySymbol = config?.currencySymbol || "₹";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" /> Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5" /> Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Business Name</Label><Input value={user.business_name || ""} onChange={(e) => setUser({...user, business_name: e.target.value})} /></div>
            <div><Label>Email</Label><Input value={user.email} disabled /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Country</Label>
              <Select value={user.country} onValueChange={(v) => {
                const c = COUNTRY_CONFIG[v as CountryCode];
                setUser({...user, country: v || "", currency: c?.currency || user.currency});
              }}>
                <SelectTrigger>
                  <SelectValue>
                    {config?.name || user.country}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(COUNTRY_CONFIG) as [CountryCode, typeof COUNTRY_CONFIG[CountryCode]][]).map(([code, cfg]) => (
                    <SelectItem key={code} value={code}>{cfg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Currency</Label><Input value={`${config?.currencySymbol || ""} ${user.currency}`} disabled className="bg-muted" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tax ID ({config?.taxType === "GST" ? "GSTIN" : config?.taxType === "VAT" ? "VAT Number" : "Tax ID"})</Label>
              <Input value={user.tax_id || ""} onChange={(e) => setUser({...user, tax_id: e.target.value})} placeholder="Enter your tax ID" />
            </div>
            <div><Label>Business Type</Label><Input value={user.business_type || ""} disabled className="bg-muted" /></div>
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5" /> Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg capitalize">{currentPlan.name} Plan</p>
                <Badge>{user.plan === "free" ? "Current" : "Active"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{currentPlan.limits}</p>
              {currentPlan.price > 0 && (
                <p className="text-sm font-medium mt-1">
                  {currencySymbol}{currentPlan.price}{currentPlan.period}
                </p>
              )}
            </div>
            <Button onClick={() => setShowUpgrade(true)}>
              {user.plan === "free" ? "Upgrade" : "Change Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5" /> Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export All Data</p>
              <p className="text-sm text-muted-foreground">Download all your transactions, receipts, and invoices (GDPR Article 20)</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportAll} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => toast.error("Please contact support to delete your account.")}>Delete</Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Choose Your Plan
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {plans.map((plan) => {
              const isCurrent = user.plan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-5 transition-all ${
                    plan.popular ? "border-primary shadow-md" : isCurrent ? "border-primary/50 bg-primary/5" : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                  )}
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">{currencySymbol}{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{plan.limits}</p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                    disabled={isCurrent || upgrading === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {upgrading === plan.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : plan.price === 0 ? (
                      "Downgrade"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
