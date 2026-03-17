"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, User, CreditCard, Shield, Download } from "lucide-react";
import { toast } from "sonner";
import { COUNTRY_CONFIG, type CountryCode, type User as UserType } from "@/lib/supabase/types";

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ledgerai_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleSave = () => {
    if (user) {
      localStorage.setItem("ledgerai_user", JSON.stringify(user));
      toast.success("Settings saved!");
    }
  };

  if (!user) return null;

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
              <Select value={user.country} onValueChange={(v) => setUser({...user, country: v || ""})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(COUNTRY_CONFIG) as [CountryCode, typeof COUNTRY_CONFIG[CountryCode]][]).map(([code, config]) => (
                    <SelectItem key={code} value={code}>{config.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Currency</Label><Input value={user.currency} disabled className="bg-muted" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tax ID (GSTIN/EIN/VAT)</Label><Input value={user.tax_id || ""} onChange={(e) => setUser({...user, tax_id: e.target.value})} placeholder="Enter your tax ID" /></div>
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
                <p className="font-semibold text-lg capitalize">{user.plan} Plan</p>
                <Badge>{user.plan === "free" ? "Current" : "Active"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {user.plan === "free" ? "25 receipts/month, 50 AI queries" : "Full access to all features"}
              </p>
            </div>
            <Button variant="outline">Upgrade</Button>
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
            <Button variant="outline" size="sm" onClick={() => toast.success("Data export started. You'll receive it via email.")}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
