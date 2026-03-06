import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsSchemes } from "@/db/schema";
import { eq } from "drizzle-orm";

// DELETE - Soft delete a savings scheme (set isActive to false)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schemeId = parseInt(id);

    if (isNaN(schemeId)) {
      return NextResponse.json({ error: "Invalid scheme ID" }, { status: 400 });
    }

    // Check if scheme exists
    const existing = await db
      .select()
      .from(savingsSchemes)
      .where(eq(savingsSchemes.id, schemeId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    // Soft delete - set isActive to false
    await db
      .update(savingsSchemes)
      .set({ isActive: false })
      .where(eq(savingsSchemes.id, schemeId));

    return NextResponse.json({ message: "Scheme deleted successfully" });
  } catch (error) {
    console.error("Error deleting savings scheme:", error);
    return NextResponse.json({ error: "Failed to delete savings scheme" }, { status: 500 });
  }
}
