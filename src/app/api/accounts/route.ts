import { NextRequest, NextResponse } from "next/server";
import { initSchema, getAccounts, createAccount } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initSchema();

    const userId =
      request.headers.get("x-user-id") ||
      request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const accounts = await getAccounts(userId);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Get accounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
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

    if (!body.name || !body.code || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: name, code, type" },
        { status: 400 }
      );
    }

    const account = await createAccount(userId, body);
    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error("Create account error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 400 }
    );
  }
}
