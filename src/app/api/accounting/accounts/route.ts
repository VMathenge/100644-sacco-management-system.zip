import { NextResponse } from "next/server";
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
