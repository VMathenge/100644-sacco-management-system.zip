import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, savingsAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateMemberNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `MBR${year}${random}`;
}

function generateAccountNumber(): string {
  const random = Math.floor(Math.random() * 900000000) + 100000000;
  return `SAV${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      nationalId,
      dateOfBirth,
      address,
      occupation,
      status,
      shareCapital,
    } = body;

    if (!firstName || !lastName || !email || !phone || !nationalId || !dateOfBirth || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate email or national ID
    const existing = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "A member with this email already exists" }, { status: 409 });
    }

    const existingId = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.nationalId, nationalId))
      .limit(1);

    if (existingId.length > 0) {
      return NextResponse.json({ error: "A member with this National ID already exists" }, { status: 409 });
    }

    const memberNumber = generateMemberNumber();

    const [newMember] = await db
      .insert(members)
      .values({
        memberNumber,
        firstName,
        lastName,
        email,
        phone,
        nationalId,
        dateOfBirth,
        address,
        occupation: occupation || null,
        status: status || "active",
        shareCapital: parseFloat(shareCapital) || 0,
      })
      .returning();

    // Auto-create a savings account for the member
    await db.insert(savingsAccounts).values({
      accountNumber: generateAccountNumber(),
      memberId: newMember.id,
      accountType: "regular",
      balance: 0,
      interestRate: 3.5,
      status: "active",
    });

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allMembers = await db.select().from(members).orderBy(members.createdAt);
    return NextResponse.json({ members: allMembers });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
