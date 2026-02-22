import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsAccounts, members } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const accounts = await db
      .select({
        id: savingsAccounts.id,
        accountNumber: savingsAccounts.accountNumber,
        accountType: savingsAccounts.accountType,
        balance: savingsAccounts.balance,
        interestRate: savingsAccounts.interestRate,
        status: savingsAccounts.status,
        memberId: members.id,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberNumber: members.memberNumber,
      })
      .from(savingsAccounts)
      .leftJoin(members, eq(savingsAccounts.memberId, members.id))
      .where(eq(savingsAccounts.status, "active"))
      .orderBy(sql`${savingsAccounts.createdAt} desc`);

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching savings accounts:", error);
    return NextResponse.json({ error: "Failed to fetch savings accounts" }, { status: 500 });
  }
}
