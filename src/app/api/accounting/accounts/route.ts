import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/accounting/accounts - List all accounts
export async function GET() {
  try {
    const allAccounts = await db
      .select({
        id: accounts.id,
        accountCode: accounts.accountCode,
        accountName: accounts.accountName,
        accountType: accounts.accountType,
        parentId: accounts.parentId,
        balance: accounts.balance,
        isActive: accounts.isActive,
      })
      .from(accounts)
      .where(eq(accounts.isActive, true))
      .orderBy(accounts.accountCode);

    return NextResponse.json(allAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

// POST /api/accounting/accounts - Create a new account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountName, accountCode, accountType, balance = 0 } = body;

    // Validate required fields
    if (!accountName || !accountCode || !accountType) {
      return NextResponse.json(
        { error: "Account name, code, and type are required" },
        { status: 400 }
      );
    }

    // Validate account type
    const validTypes = ["asset", "liability", "equity", "income", "expense"];
    if (!validTypes.includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 }
      );
    }

    // Check for duplicate account code
    const existing = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountCode, accountCode))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Account code already exists" },
        { status: 400 }
      );
    }

    // Create the account
    const [newAccount] = await db
      .insert(accounts)
      .values({
        accountName,
        accountCode,
        accountType,
        balance: parseFloat(balance) || 0,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
