import { NextRequest, NextResponse } from "next/server";
import { initSchema, getReceipts, createReceipt } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initSchema();

    const userId =
      request.headers.get("x-user-id") ||
      request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const receipts = await getReceipts(userId);
    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Get receipts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initSchema();

    const userId =
      request.headers.get("x-user-id") ||
      request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const body = await request.json();
    const receipt = await createReceipt(userId, body);
    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Create receipt error:", error);
    return NextResponse.json(
      { error: "Failed to create receipt" },
      { status: 500 }
    );
  }
}
