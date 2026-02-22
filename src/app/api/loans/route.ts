import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, members } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateLoanNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `LN${year}${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      memberId,
      loanType,
      principalAmount,
      interestRate,
      termMonths,
      monthlyPayment,
      totalAmount,
      purpose,
      guarantorId,
    } = body;

    if (!memberId || !principalAmount || !termMonths) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify member exists
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.id, parseInt(memberId)))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const loanNumber = generateLoanNumber();
    const principal = parseFloat(principalAmount);

    const [newLoan] = await db
      .insert(loans)
      .values({
        loanNumber,
        memberId: parseInt(memberId),
        loanType: loanType || "personal",
        principalAmount: principal,
        interestRate: parseFloat(interestRate) || 12,
        termMonths: parseInt(termMonths),
        monthlyPayment: parseFloat(monthlyPayment) || 0,
        totalAmount: parseFloat(totalAmount) || principal,
        amountPaid: 0,
        balance: principal,
        status: "pending",
        purpose: purpose || null,
        guarantorId: guarantorId ? parseInt(guarantorId) : null,
      })
      .returning();

    return NextResponse.json({ loan: newLoan }, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allLoans = await db.select().from(loans).orderBy(loans.createdAt);
    return NextResponse.json({ loans: allLoans });
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
  }
}
