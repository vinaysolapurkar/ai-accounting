import { NextResponse } from "next/server";

export async function POST() {
  const csvContent = `Date,Description,Category,Type,Amount,Status,Source
2026-03-17,Office Supplies - Amazon,Office Expenses,expense,2340,confirmed,receipt_scan
2026-03-16,Client Payment - Acme Corp,Revenue,income,15000,confirmed,manual
2026-03-15,Electricity Bill - MSEB,Utilities,expense,1850,confirmed,receipt_scan
2026-03-14,Adobe Creative Cloud,Software,expense,1500,confirmed,chat
2026-03-13,Consulting Fee - Client B,Revenue,income,8500,reconciled,bank_import
2026-03-12,Uber Rides,Transport,expense,450,draft,receipt_scan
2026-03-11,AWS Hosting,Cloud Services,expense,3200,confirmed,receipt_scan
2026-03-10,Client Payment - XYZ Ltd,Revenue,income,25000,reconciled,bank_import
2026-03-09,Team Lunch,Food & Dining,expense,2100,confirmed,receipt_scan
2026-03-08,WeWork Rent,Rent,expense,15000,confirmed,manual`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=ledgerai-transactions.csv",
    },
  });
}
