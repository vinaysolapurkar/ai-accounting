import { NextRequest, NextResponse } from "next/server";
import {
  initSchema,
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
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

    const invoices = await getInvoices(userId);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
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

    if (
      !body.client_name ||
      !body.invoice_number ||
      !body.date ||
      !body.due_date ||
      !body.line_items
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: client_name, invoice_number, date, due_date, line_items",
        },
        { status: 400 }
      );
    }

    const invoice = await createInvoice(userId, body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await initSchema();

    const body = await request.json();

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields: id, status" },
        { status: 400 }
      );
    }

    await updateInvoiceStatus(body.id, body.status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update invoice status error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    );
  }
}
