import { NextRequest, NextResponse } from "next/server";
import {
  initSchema,
  getBalanceSheet,
  getProfitLoss,
  getTrialBalance,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initSchema();

    const userId =
      request.headers.get("x-user-id") ||
      request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const type = request.nextUrl.searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Missing report type. Use ?type=balance-sheet|profit-loss|trial-balance" },
        { status: 400 }
      );
    }

    let report;

    switch (type) {
      case "balance-sheet":
        report = await getBalanceSheet(userId);
        break;
      case "profit-loss":
        report = await getProfitLoss(userId);
        break;
      case "trial-balance":
        report = await getTrialBalance(userId);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}. Use balance-sheet, profit-loss, or trial-balance` },
          { status: 400 }
        );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
