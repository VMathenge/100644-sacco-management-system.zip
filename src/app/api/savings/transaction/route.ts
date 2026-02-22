import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savingsAccounts, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateTransactionNumber(): string {
  const ts = Date.now();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TXN${ts}${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountId, amount, type, description } = body;

    if (!accountId || !amount || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const txAmount = parseFloat(amount);
    if (isNaN(txAmount) || txAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const [account] = await db
      .select()
      .from(savingsAccounts)
      .where(eq(savingsAccounts.id, parseInt(accountId)))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (account.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 400 });
    }

    let newBalance: number;

    if (type === "deposit") {
      newBalance = account.balance + txAmount;
    } else if (type === "withdrawal") {
      if (txAmount > account.balance) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
      newBalance = account.balance - txAmount;
    } else {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }

    // Update account balance
    await db
      .update(savingsAccounts)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(savingsAccounts.id, account.id));

    // Record transaction
    const [tx] = await db
      .insert(transactions)
      .values({
        transactionNumber: generateTransactionNumber(),
        memberId: account.memberId,
        type,
        amount: txAmount,
        balance: newBalance,
        description: description || (type === "deposit" ? "Savings deposit" : "Savings withdrawal"),
        referenceId: account.id,
        referenceType: "savings",
        processedBy: "Admin",
      })
      .returning();

    return NextResponse.json({ transaction: tx, newBalance }, { status: 201 });
  } catch (error) {
    console.error("Error processing transaction:", error);
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }
}
