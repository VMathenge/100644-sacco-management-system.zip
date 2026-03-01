import { NextResponse } from "next/server";
import { db } from "@/db";
import { debitNotes, accounts, members } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/accounting/debit-notes - List all debit notes
export async function GET() {
  try {
    const notes = await db
      .select({
        id: debitNotes.id,
        noteNumber: debitNotes.noteNumber,
        memberId: debitNotes.memberId,
        accountId: debitNotes.accountId,
        amount: debitNotes.amount,
        reason: debitNotes.reason,
        description: debitNotes.description,
        status: debitNotes.status,
        dueDate: debitNotes.dueDate,
        referenceId: debitNotes.referenceId,
        referenceType: debitNotes.referenceType,
        issuedBy: debitNotes.issuedBy,
        createdAt: debitNotes.createdAt,
        accountName: accounts.accountName,
        accountCode: accounts.accountCode,
        memberName: members.firstName,
      })
      .from(debitNotes)
      .leftJoin(accounts, eq(debitNotes.accountId, accounts.id))
      .leftJoin(members, eq(debitNotes.memberId, members.id))
      .orderBy(desc(debitNotes.createdAt));

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching debit notes:", error);
    return NextResponse.json({ error: "Failed to fetch debit notes" }, { status: 500 });
  }
}

// POST /api/accounting/debit-notes - Create a new debit note
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, accountId, amount, reason, description, dueDate, referenceId, referenceType, issuedBy } = body;

    // Generate note number
    const count = await db.select({ count: debitNotes.id }).from(debitNotes);
    const noteNumber = `DN-${String(count.length + 1).padStart(5, "0")}`;

    const result = await db.insert(debitNotes).values({
      noteNumber,
      memberId: memberId || null,
      accountId: Number(accountId),
      amount: Number(amount),
      reason,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      issuedBy: issuedBy || null,
      status: "pending",
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating debit note:", error);
    return NextResponse.json({ error: "Failed to create debit note" }, { status: 500 });
  }
}
