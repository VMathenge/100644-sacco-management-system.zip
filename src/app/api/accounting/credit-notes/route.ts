import { NextResponse } from "next/server";
import { db } from "@/db";
import { creditNotes, accounts, members } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/accounting/credit-notes - List all credit notes
export async function GET() {
  try {
    const notes = await db
      .select({
        id: creditNotes.id,
        noteNumber: creditNotes.noteNumber,
        memberId: creditNotes.memberId,
        accountId: creditNotes.accountId,
        amount: creditNotes.amount,
        reason: creditNotes.reason,
        description: creditNotes.description,
        status: creditNotes.status,
        dueDate: creditNotes.dueDate,
        referenceId: creditNotes.referenceId,
        referenceType: creditNotes.referenceType,
        issuedBy: creditNotes.issuedBy,
        createdAt: creditNotes.createdAt,
        accountName: accounts.accountName,
        accountCode: accounts.accountCode,
        memberName: members.firstName,
      })
      .from(creditNotes)
      .leftJoin(accounts, eq(creditNotes.accountId, accounts.id))
      .leftJoin(members, eq(creditNotes.memberId, members.id))
      .orderBy(desc(creditNotes.createdAt));

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching credit notes:", error);
    return NextResponse.json({ error: "Failed to fetch credit notes" }, { status: 500 });
  }
}

// POST /api/accounting/credit-notes - Create a new credit note
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, accountId, amount, reason, description, dueDate, referenceId, referenceType, issuedBy } = body;

    // Generate note number
    const count = await db.select({ count: creditNotes.id }).from(creditNotes);
    const noteNumber = `CN-${String(count.length + 1).padStart(5, "0")}`;

    const result = await db.insert(creditNotes).values({
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
    console.error("Error creating credit note:", error);
    return NextResponse.json({ error: "Failed to create credit note" }, { status: 500 });
  }
}
