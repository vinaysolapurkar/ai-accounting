"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Download, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

const integrations = [
  {
    name: "Tally",
    description: "Export vouchers, masters, and ledgers in Tally XML format",
    type: "export",
    status: "available",
    logo: "T",
    color: "bg-red-100 text-red-600",
  },
  {
    name: "QuickBooks",
    description: "Sync invoices, expenses, and accounts via OAuth API",
    type: "sync",
    status: "available",
    logo: "QB",
    color: "bg-green-100 text-green-600",
  },
  {
    name: "Sage",
    description: "Sync ledger accounts, payments, and contacts",
    type: "sync",
    status: "available",
    logo: "S",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    name: "Zoho Books",
    description: "Sync invoices, expenses, and chart of accounts",
    type: "sync",
    status: "available",
    logo: "Z",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    name: "Wave",
    description: "Sync businesses, invoices, and transactions via GraphQL",
    type: "sync",
    status: "available",
    logo: "W",
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "SAP Business One",
    description: "Sync journal entries and business partners via OData",
    type: "sync",
    status: "available",
    logo: "SAP",
    color: "bg-indigo-100 text-indigo-600",
  },
];

const exportFormats = [
  { name: "CSV", description: "Comma-separated values — works with Excel, Google Sheets" },
  { name: "PDF", description: "Professional reports for printing and sharing" },
  { name: "Tally XML", description: "Import-ready format for Tally ERP 9 / TallyPrime" },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="w-6 h-6" /> Integrations
        </h1>
        <p className="text-muted-foreground text-sm">Connect with your favorite accounting software</p>
      </div>

      {/* Platform Integrations */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Platform Integrations</h2>
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
                      onClick={() => {
                        if (int.name === "Tally") {
                          toast.success("Tally XML export started!");
                        } else {
                          toast.info(`${int.name} integration requires OAuth setup. Coming soon!`);
                        }
                      }}
                    >
                      {int.name === "Tally" ? (
                        <><Download className="w-4 h-4 mr-2" /> Export to Tally</>
                      ) : (
                        <><ExternalLink className="w-4 h-4 mr-2" /> Connect</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Export Formats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Export Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exportFormats.map((fmt) => (
            <Card key={fmt.name}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{fmt.name}</p>
                  <p className="text-xs text-muted-foreground">{fmt.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.success(`${fmt.name} export started!`)}>
                  <Download className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
