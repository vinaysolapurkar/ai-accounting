import { NextRequest, NextResponse } from "next/server";
import { initSchema, getDashboardStats } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initSchema();

    const userId =
      request.headers.get("x-user-id") ||
      request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const stats = await getDashboardStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
