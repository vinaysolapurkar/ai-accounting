import { NextRequest, NextResponse } from "next/server";
import { initSchema, createUser, getUserByEmail, updateUser, seedAccounts } from "@/lib/db";

// POST /api/auth — login or signup
export async function POST(request: NextRequest) {
  try {
    await initSchema();

    const body = await request.json();
    const { action, email, password, businessName } = body;

    if (action === "signup") {
      const existing = await getUserByEmail(email);
      if (existing) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
      const user = await createUser(email, password, businessName);
      return NextResponse.json({ user });
    }

    if (action === "login") {
      const user = await getUserByEmail(email);
      if (!user || user.password_hash !== password) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      return NextResponse.json({ user });
    }

    if (action === "onboarding") {
      const { userId, country, businessType } = body;
      const { COUNTRY_CONFIG } = await import("@/lib/supabase/types");
      const config = (COUNTRY_CONFIG as any)[country];

      const user = await updateUser(userId, {
        country,
        currency: config?.currency || "USD",
        fiscal_year_start: config?.fiscalYearStart || 1,
        business_type: businessType,
        onboarding_complete: 1,
      });

      // Seed chart of accounts for this country
      await seedAccounts(userId, country);

      return NextResponse.json({ user });
    }

    if (action === "update-plan") {
      const { userId, plan } = body;
      if (!userId || !plan) {
        return NextResponse.json({ error: "Missing userId or plan" }, { status: 400 });
      }
      const user = await updateUser(userId, { plan });
      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Auth error:", error?.stack || error);
    return NextResponse.json({
      error: error.message || "Server error",
      stack: error?.stack?.split("\n").slice(0, 5),
    }, { status: 500 });
  }
}
