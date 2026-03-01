import { NextResponse } from "next/server";
import { db } from "@/db";
import { creditNotes, accounts, members } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/accounting/credit-notes/[id] - Get a single credit note
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await db
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
        updatedAt: creditNotes.updatedAt,
        accountName: accounts.accountName,
        accountCode: accounts.accountCode,
        memberName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(creditNotes)
      .leftJoin(accounts, eq(creditNotes.accountId, accounts.id))
      .leftJoin(members, eq(creditNotes.memberId, members.id))
      .where(eq(creditNotes.id, Number(id)))
      .limit(1);

    if (note.length === 0) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 });
    }

    return NextResponse.json(note[0]);
  } catch (error) {
    console.error("Error fetching credit note:", error);
    return NextResponse.json({ error: "Failed to fetch credit note" }, { status: 500 });
  }
}

// PUT /api/accounting/credit-notes/[id] - Update a credit note
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { memberId, accountId, amount, reason, description, status, dueDate, referenceId, referenceType, issuedBy } = body;

    const result = await db
      .update(creditNotes)
      .set({
        memberId: memberId || null,
        accountId: accountId ? Number(accountId) : undefined,
        amount: amount ? Number(amount) : undefined,
        reason,
        description: description || null,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        referenceId: referenceId || null,
        referenceType: referenceType || null,
        issuedBy: issuedBy || null,
        updatedAt: new Date(),
      })
      .where(eq(creditNotes.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating credit note:", error);
    return NextResponse.json({ error: "Failed to update credit note" }, { status: 500 });
  }
}

// DELETE /api/accounting/credit-notes/[id] - Delete a credit note
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db
      .delete(creditNotes)
      .where(eq(creditNotes.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Credit note deleted successfully" });
  } catch (error) {
    console.error("Error deleting credit note:", error);
    return NextResponse.json({ error: "Failed to delete credit note" }, { status: 500 });
  }
}
