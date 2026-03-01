import { NextResponse } from "next/server";
import { db } from "@/db";
import { debitNotes, accounts, members } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/accounting/debit-notes/[id] - Get a single debit note
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await db
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
        updatedAt: debitNotes.updatedAt,
        accountName: accounts.accountName,
        accountCode: accounts.accountCode,
        memberName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(debitNotes)
      .leftJoin(accounts, eq(debitNotes.accountId, accounts.id))
      .leftJoin(members, eq(debitNotes.memberId, members.id))
      .where(eq(debitNotes.id, Number(id)))
      .limit(1);

    if (note.length === 0) {
      return NextResponse.json({ error: "Debit note not found" }, { status: 404 });
    }

    return NextResponse.json(note[0]);
  } catch (error) {
    console.error("Error fetching debit note:", error);
    return NextResponse.json({ error: "Failed to fetch debit note" }, { status: 500 });
  }
}

// PUT /api/accounting/debit-notes/[id] - Update a debit note
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { memberId, accountId, amount, reason, description, status, dueDate, referenceId, referenceType, issuedBy } = body;

    const result = await db
      .update(debitNotes)
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
      .where(eq(debitNotes.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Debit note not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating debit note:", error);
    return NextResponse.json({ error: "Failed to update debit note" }, { status: 500 });
  }
}

// DELETE /api/accounting/debit-notes/[id] - Delete a debit note
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db
      .delete(debitNotes)
      .where(eq(debitNotes.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Debit note not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Debit note deleted successfully" });
  } catch (error) {
    console.error("Error deleting debit note:", error);
    return NextResponse.json({ error: "Failed to delete debit note" }, { status: 500 });
  }
}
