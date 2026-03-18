"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link2, Download, ExternalLink, Loader2, Check, FileSpreadsheet, FileText, FileCode, Lock } from "lucide-react";
import { toast } from "sonner";
import { getPlanLimits } from "@/lib/plan-limits";

function getUserId(): string {
  try {
    return JSON.parse(localStorage.getItem("ledgerai_user") || "{}").id || "";
  } catch { return ""; }
}

const integrations = [
  {
    name: "Tally",
    description: "Export vouchers, masters, and ledgers in Tally XML format for TallyPrime / ERP 9",
    type: "export",
    logo: "T",
    color: "bg-red-100 text-red-600",
    action: "export",
    format: "tally",
  },
  {
    name: "QuickBooks",
    description: "Import your transactions and chart of accounts into QuickBooks via CSV",
    type: "export",
    logo: "QB",
    color: "bg-green-100 text-green-600",
    action: "export",
    format: "csv",
  },
  {
    name: "Sage",
    description: "Export ledger accounts, payments, and contacts in CSV format for Sage import",
    type: "export",
    logo: "S",
    color: "bg-emerald-100 text-emerald-600",
    action: "export",
    format: "csv",
  },
  {
    name: "Zoho Books",
    description: "Export transactions and chart of accounts for Zoho Books CSV import",
    type: "export",
    logo: "Z",
    color: "bg-yellow-100 text-yellow-600",
    action: "export",
    format: "csv",
  },
  {
    name: "Wave",
    description: "Export all financial data in JSON format compatible with Wave import",
    type: "export",
    logo: "W",
    color: "bg-blue-100 text-blue-600",
    action: "export",
    format: "json",
  },
  {
    name: "SAP Business One",
    description: "Export journal entries and accounts in CSV format for SAP import",
    type: "export",
    logo: "SAP",
    color: "bg-indigo-100 text-indigo-600",
    action: "export",
    format: "csv",
  },
];

const exportFormats = [
  { name: "CSV", description: "Comma-separated values — works with Excel, Google Sheets", icon: FileSpreadsheet, format: "csv", type: "all" },
  { name: "JSON", description: "Full data export — transactions, accounts, reports", icon: FileCode, format: "json", type: "all" },
  { name: "Tally XML", description: "Import-ready format for Tally ERP 9 / TallyPrime", icon: FileText, format: "tally", type: "all" },
];

export default function IntegrationsPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("ledgerai_user") || "{}") : {};
  const limits = getPlanLimits(user.plan || "free");

  const handleExport = async (format: string, type: string, label: string) => {
    const userId = getUserId();
    if (!userId) { toast.error("Not logged in"); return; }

    // Check plan for Tally export
    const user = JSON.parse(localStorage.getItem("ledgerai_user") || "{}");
    const limits = getPlanLimits(user.plan || "free");
    if (format === "tally" && !limits.tallyExport) {
      toast.error("Tally export requires Pro plan or above. Upgrade in Settings.");
      return;
    }

    setExporting(label);
    try {
      const res = await fetch(`/api/integrations?format=${format}&type=${type}`, {
        headers: { "x-user-id": userId },
      });

      if (!res.ok) throw new Error("Export failed");

      const contentType = res.headers.get("content-type") || "";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      let ext = "csv";
      if (format === "json") ext = "json";
      if (format === "tally") ext = "xml";

      a.href = url;
      a.download = `numba-${type}-${new Date().toISOString().split("T")[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${label} export downloaded!`);
    } catch {
      toast.error(`Failed to export ${label}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="w-6 h-6" /> Integrations & Export
        </h1>
        <p className="text-muted-foreground text-sm">Export your data to your favorite accounting software</p>
      </div>

      {/* Export Formats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Export</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exportFormats.map((fmt) => (
            <Card key={fmt.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <fmt.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{fmt.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={exporting === fmt.name}
                  onClick={() => handleExport(fmt.format, fmt.type, fmt.name)}
                >
                  {exporting === fmt.name ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export All Data
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Integrations */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Export to Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((int) => (
            <Card key={int.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${int.color} flex items-center justify-center font-bold text-sm shrink-0`}>
                    {int.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{int.name}</h3>
                      <Badge variant="secondary" className="text-xs">{int.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{int.description}</p>
                    <Button
                      size="sm"
                      variant={int.name === "Tally" ? "default" : "outline"}
                      className="w-full"
                      disabled={exporting === int.name}
                      onClick={() => handleExport(int.format, "all", int.name)}
                    >
                      {exporting === int.name ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : int.format === "tally" && !limits.tallyExport ? (
                        <Lock className="w-4 h-4 mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {int.format === "tally" && !limits.tallyExport ? "Pro Plan" : `Export for ${int.name}`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
