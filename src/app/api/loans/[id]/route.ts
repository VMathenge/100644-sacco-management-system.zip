import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, transactions, loanRepayments } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateTransactionNumber(): string {
  const ts = Date.now();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TXN${ts}${random}`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id);
    const body = await req.json();
    const { action, amount, processedBy } = body;

    const [loan] = await db
      .select()
      .from(loans)
      .where(eq(loans.id, loanId))
      .limit(1);

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (action === "approve") {
      if (loan.status !== "pending") {
        return NextResponse.json({ error: "Only pending loans can be approved" }, { status: 400 });
      }
      await db
        .update(loans)
        .set({ status: "approved", approvedBy: processedBy ?? "Admin", updatedAt: new Date() })
        .where(eq(loans.id, loanId));
      return NextResponse.json({ success: true, status: "approved" });
    }

    if (action === "reject") {
      if (loan.status !== "pending") {
        return NextResponse.json({ error: "Only pending loans can be rejected" }, { status: 400 });
      }
      await db
        .update(loans)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(loans.id, loanId));
      return NextResponse.json({ success: true, status: "rejected" });
    }

    if (action === "disburse") {
      if (loan.status !== "approved") {
        return NextResponse.json({ error: "Only approved loans can be disbursed" }, { status: 400 });
      }
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + loan.termMonths);

      await db
        .update(loans)
        .set({
          status: "active",
          disbursedAt: now,
          dueDate: dueDate.toISOString().split("T")[0],
          updatedAt: now,
        })
        .where(eq(loans.id, loanId));

      // Record disbursement transaction
      await db.insert(transactions).values({
        transactionNumber: generateTransactionNumber(),
        memberId: loan.memberId,
        type: "loan_disbursement",
        amount: loan.principalAmount,
        balance: 0,
        description: `Loan disbursement - ${loan.loanNumber}`,
        referenceId: loan.id,
        referenceType: "loan",
        processedBy: processedBy ?? "Admin",
      });

      return NextResponse.json({ success: true, status: "active" });
    }

    if (action === "repay") {
      if (loan.status !== "active") {
        return NextResponse.json({ error: "Only active loans can be repaid" }, { status: 400 });
      }
      if (!amount || parseFloat(amount) <= 0) {
        return NextResponse.json({ error: "Invalid repayment amount" }, { status: 400 });
      }

      const repayAmount = parseFloat(amount);
      const monthlyRate = loan.interestRate / 100 / 12;
      const interestPortion = loan.balance * monthlyRate;
      const principalPortion = Math.min(repayAmount - interestPortion, loan.balance);
      const newBalance = Math.max(0, loan.balance - principalPortion);
      const newAmountPaid = loan.amountPaid + repayAmount;

      const newStatus = newBalance <= 0 ? "completed" : "active";

      await db
        .update(loans)
        .set({
          balance: newBalance,
          amountPaid: newAmountPaid,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loanId));

      // Record transaction
      const [tx] = await db
        .insert(transactions)
        .values({
          transactionNumber: generateTransactionNumber(),
          memberId: loan.memberId,
          type: "loan_repayment",
          amount: repayAmount,
          balance: newBalance,
          description: `Loan repayment - ${loan.loanNumber}`,
          referenceId: loan.id,
          referenceType: "loan",
          processedBy: processedBy ?? "Admin",
        })
        .returning();

      // Record repayment detail
      await db.insert(loanRepayments).values({
        loanId: loan.id,
        memberId: loan.memberId,
        amount: repayAmount,
        principal: principalPortion,
        interest: interestPortion,
        balance: newBalance,
        transactionId: tx.id,
      });

      return NextResponse.json({ success: true, newBalance, status: newStatus });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating loan:", error);
    return NextResponse.json({ error: "Failed to update loan" }, { status: 500 });
  }
}
