import { NextRequest, NextResponse } from "next/server";
import {
  initSchema,
  getTransactions,
  getAccounts,
  getInvoices,
  getReceipts,
  getBalanceSheet,
  getProfitLoss,
  getTrialBalance,
  getUserById,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initSchema();

    const userId = request.headers.get("x-user-id") || request.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const format = request.nextUrl.searchParams.get("format") || "csv";
    const dataType = request.nextUrl.searchParams.get("type") || "transactions";

    const user = await getUserById(userId);
    const currency = user?.currency || "INR";

    if (format === "csv") {
      let csv = "";

      if (dataType === "transactions") {
        const txns = await getTransactions(userId, { limit: 1000 });
        csv = "Date,Description,Type,Amount,Status,Source\n";
        for (const t of txns) {
          csv += `"${t.date}","${t.description}","${t.type}","${t.amount}","${t.status}","${t.source}"\n`;
        }
      } else if (dataType === "accounts") {
        const accounts = await getAccounts(userId);
        csv = "Code,Name,Type\n";
        for (const a of accounts) {
          csv += `"${a.code}","${a.name}","${a.type}"\n`;
        }
      } else if (dataType === "invoices") {
        const invoices = await getInvoices(userId);
        csv = "Invoice Number,Client,Date,Due Date,Subtotal,Tax,Total,Status,Currency\n";
        for (const inv of invoices) {
          csv += `"${inv.invoice_number}","${inv.client_name}","${inv.date}","${inv.due_date}","${inv.subtotal}","${inv.tax_total}","${inv.total}","${inv.status}","${inv.currency}"\n`;
        }
      } else if (dataType === "all") {
        const [txns, accounts, invoices, receipts] = await Promise.all([
          getTransactions(userId, { limit: 1000 }),
          getAccounts(userId),
          getInvoices(userId),
          getReceipts(userId),
        ]);
        csv = "=== ACCOUNTS ===\nCode,Name,Type\n";
        for (const a of accounts) csv += `"${a.code}","${a.name}","${a.type}"\n`;
        csv += "\n=== TRANSACTIONS ===\nDate,Description,Type,Amount,Status,Source\n";
        for (const t of txns) csv += `"${t.date}","${t.description}","${t.type}","${t.amount}","${t.status}","${t.source}"\n`;
        csv += "\n=== INVOICES ===\nInvoice Number,Client,Date,Total,Status\n";
        for (const inv of invoices) csv += `"${inv.invoice_number}","${inv.client_name}","${inv.date}","${inv.total}","${inv.status}"\n`;
        csv += "\n=== RECEIPTS ===\nVendor,Amount,Date,Category,Status\n";
        for (const r of receipts) csv += `"${r.extracted_vendor || ""}","${r.extracted_amount || ""}","${r.extracted_date || ""}","${r.extracted_category || ""}","${r.status}"\n`;
      }

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="numba-${dataType}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (format === "json") {
      const [txns, accounts, invoices, receipts, balanceSheet, profitLoss, trialBalance] = await Promise.all([
        getTransactions(userId, { limit: 1000 }),
        getAccounts(userId),
        getInvoices(userId),
        getReceipts(userId),
        getBalanceSheet(userId),
        getProfitLoss(userId),
        getTrialBalance(userId),
      ]);

      return NextResponse.json({
        exportDate: new Date().toISOString(),
        business: { name: user?.business_name, country: user?.country, currency },
        accounts,
        transactions: txns,
        invoices,
        receipts,
        reports: { balanceSheet, profitLoss, trialBalance },
      });
    }

    if (format === "tally") {
      const [txns, accounts] = await Promise.all([
        getTransactions(userId, { limit: 1000 }),
        getAccounts(userId),
      ]);

      const typeMap: Record<string, string> = {
        asset: "Current Assets",
        liability: "Current Liabilities",
        equity: "Capital Account",
        revenue: "Sales Accounts",
        expense: "Indirect Expenses",
      };

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<ENVELOPE>\n<HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>\n<BODY>\n<IMPORTDATA>\n`;
      xml += `<REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>\n<REQUESTDATA>\n`;

      // Ledger masters
      for (const a of accounts) {
        xml += `<TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
        xml += `  <LEDGER NAME="${escapeXml(a.name)}" ACTION="Create">\n`;
        xml += `    <NAME>${escapeXml(a.name)}</NAME>\n`;
        xml += `    <PARENT>${typeMap[a.type] || "Indirect Expenses"}</PARENT>\n`;
        xml += `  </LEDGER>\n`;
        xml += `</TALLYMESSAGE>\n`;
      }

      xml += `</REQUESTDATA>\n</IMPORTDATA>\n`;

      // Vouchers
      xml += `<IMPORTDATA>\n<REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>\n<REQUESTDATA>\n`;

      for (const t of txns) {
        if (!t.lines || t.lines.length === 0) continue;
        const voucherType = t.type === "income" ? "Receipt" : "Payment";
        xml += `<TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
        xml += `  <VOUCHER VCHTYPE="${voucherType}" ACTION="Create">\n`;
        xml += `    <DATE>${t.date.replace(/-/g, "")}</DATE>\n`;
        xml += `    <NARRATION>${escapeXml(t.description)}</NARRATION>\n`;
        xml += `    <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>\n`;
        for (const line of t.lines) {
          if (line.debit > 0) {
            xml += `    <ALLLEDGERENTRIES.LIST>\n`;
            xml += `      <LEDGERNAME>${escapeXml(line.account_name || "Unknown")}</LEDGERNAME>\n`;
            xml += `      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
            xml += `      <AMOUNT>-${line.debit.toFixed(2)}</AMOUNT>\n`;
            xml += `    </ALLLEDGERENTRIES.LIST>\n`;
          }
          if (line.credit > 0) {
            xml += `    <ALLLEDGERENTRIES.LIST>\n`;
            xml += `      <LEDGERNAME>${escapeXml(line.account_name || "Unknown")}</LEDGERNAME>\n`;
            xml += `      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
            xml += `      <AMOUNT>${line.credit.toFixed(2)}</AMOUNT>\n`;
            xml += `    </ALLLEDGERENTRIES.LIST>\n`;
          }
        }
        xml += `  </VOUCHER>\n`;
        xml += `</TALLYMESSAGE>\n`;
      }

      xml += `</REQUESTDATA>\n</IMPORTDATA>\n</BODY>\n</ENVELOPE>`;

      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/xml",
          "Content-Disposition": `attachment; filename="numba-tally-${new Date().toISOString().split("T")[0]}.xml"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
