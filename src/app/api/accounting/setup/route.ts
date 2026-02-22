import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accounts: accountList } = body;

    if (!accountList || !Array.isArray(accountList)) {
      return NextResponse.json({ error: "Invalid accounts data" }, { status: 400 });
    }

    // Insert accounts, skip duplicates
    for (const acc of accountList) {
      const existing = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.accountCode, acc.code))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(accounts).values({
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.type,
          balance: 0,
          isActive: true,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting up accounts:", error);
    return NextResponse.json({ error: "Failed to setup accounts" }, { status: 500 });
  }
}
