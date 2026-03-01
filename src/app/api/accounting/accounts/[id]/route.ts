import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);
    
    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account[0]);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);
    
    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const body = await request.json();
    const { accountName, accountCode, accountType, isActive, balance } = body;

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

    // Check if account exists
    const existing = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check for duplicate account code (excluding current account)
    if (accountCode !== existing[0].accountCode) {
      const duplicate = await db
        .select()
        .from(accounts)
        .where(eq(accounts.accountCode, accountCode))
        .limit(1);

      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: "Account code already exists" },
          { status: 400 }
        );
      }
    }

    // Update the account
    await db
      .update(accounts)
      .set({
        accountName,
        accountCode,
        accountType,
        isActive: isActive !== undefined ? isActive : existing[0].isActive,
        balance: balance !== undefined ? balance : existing[0].balance,
      })
      .where(eq(accounts.id, accountId));

    // Fetch updated account
    const updated = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);
    
    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    // Check if account exists
    const existing = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await db
      .update(accounts)
      .set({ isActive: false })
      .where(eq(accounts.id, accountId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
