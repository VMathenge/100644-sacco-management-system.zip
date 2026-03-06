import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsSchemes } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - Fetch all savings schemes
export async function GET() {
  try {
    const schemes = await db
      .select()
      .from(savingsSchemes)
      .where(eq(savingsSchemes.isActive, true))
      .orderBy(savingsSchemes.schemeName);

    return NextResponse.json({ schemes });
  } catch (error) {
    console.error("Error fetching savings schemes:", error);
    return NextResponse.json({ error: "Failed to fetch savings schemes" }, { status: 500 });
  }
}

// POST - Create a new savings scheme
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schemeCode, schemeName, description, defaultInterestRate, minimumBalance } = body;

    // Validate required fields
    if (!schemeCode || !schemeName) {
      return NextResponse.json(
        { error: "Scheme code and name are required" },
        { status: 400 }
      );
    }

    // Check if scheme code already exists
    const existing = await db
      .select()
      .from(savingsSchemes)
      .where(eq(savingsSchemes.schemeCode, schemeCode.toUpperCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A scheme with this code already exists" },
        { status: 400 }
      );
    }

    const newScheme = await db
      .insert(savingsSchemes)
      .values({
        schemeCode: schemeCode.toUpperCase(),
        schemeName,
        description: description || null,
        defaultInterestRate: defaultInterestRate || 3.5,
        minimumBalance: minimumBalance || 0,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ scheme: newScheme[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating savings scheme:", error);
    return NextResponse.json({ error: "Failed to create savings scheme" }, { status: 500 });
  }
}
