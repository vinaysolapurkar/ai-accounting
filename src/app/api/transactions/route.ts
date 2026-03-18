import { NextRequest, NextResponse } from "next/server";
import {
  initSchema,
  getTransactions,
  createTransaction,
  deleteTransaction,
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

    const params = request.nextUrl.searchParams;
    const filters: {
      search?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {};

    if (params.get("search")) filters.search = params.get("search")!;
    if (params.get("status")) filters.status = params.get("status")!;
    if (params.get("startDate")) filters.startDate = params.get("startDate")!;
    if (params.get("endDate")) filters.endDate = params.get("endDate")!;
    if (params.get("limit")) filters.limit = Number(params.get("limit"));

    const transactions = await getTransactions(userId, filters);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
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

    if (!body.date || !body.description || !body.lines?.length) {
      return NextResponse.json(
        { error: "Missing required fields: date, description, lines" },
        { status: 400 }
      );
    }

    const transaction = await createTransaction(userId, body);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create transaction" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initSchema();

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing transaction id" },
        { status: 400 }
      );
    }

    await deleteTransaction(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
