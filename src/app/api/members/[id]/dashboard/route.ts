import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { 
  members, 
  savingsAccounts, 
  loans, 
  transactions, 
  schemeContributions,
  schemes,
  loanRepayments
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = parseInt(id);

    // Get member basic info
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get savings accounts
    const memberSavings = await db
      .select()
      .from(savingsAccounts)
      .where(eq(savingsAccounts.memberId, memberId));

    // Get loans
    const memberLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.memberId, memberId))
      .orderBy(desc(loans.createdAt));

    // Get all transactions for this member
    const memberTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.memberId, memberId));

    // Calculate transaction totals (deposits, withdrawals, deductions)
    const deposits = memberTransactions
      .filter(t => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = memberTransactions
      .filter(t => t.type === "withdrawal")
      .reduce((sum, t) => sum + t.amount, 0);

    const loanDisbursements = memberTransactions
      .filter(t => t.type === "loan_disbursement")
      .reduce((sum, t) => sum + t.amount, 0);

    const loanRepaymentsTx = memberTransactions
      .filter(t => t.type === "loan_repayment")
      .reduce((sum, t) => sum + t.amount, 0);

    const interestCredited = memberTransactions
      .filter(t => t.type === "interest")
      .reduce((sum, t) => sum + t.amount, 0);

    const fees = memberTransactions
      .filter(t => t.type === "fee")
      .reduce((sum, t) => sum + t.amount, 0);

    const shareCapitalTx = memberTransactions
      .filter(t => t.type === "share_capital")
      .reduce((sum, t) => sum + t.amount, 0);

    // Deductions = loan repayments from member + fees
    const deductions = loanRepaymentsTx + fees;

    // Get scheme contributions for this member
    const memberSchemeContributions = await db
      .select()
      .from(schemeContributions)
      .where(
        and(
          eq(schemeContributions.memberId, memberId),
          eq(schemeContributions.status, "completed")
        )
      )
      .orderBy(desc(schemeContributions.contributionDate));

    // Get unique scheme IDs the member has contributed to
    const memberSchemeIds = [...new Set(memberSchemeContributions.map(c => c.schemeId))];

    // Get scheme details
    const memberSchemesData = await Promise.all(
      memberSchemeIds.map(async (schemeId) => {
        const [scheme] = await db
          .select()
          .from(schemes)
          .where(eq(schemes.id, schemeId))
          .limit(1);

        if (!scheme) return null;

        // Get total contributions for this member in this scheme
        const schemeTotal = memberSchemeContributions
          .filter(c => c.schemeId === schemeId)
          .reduce((sum, c) => sum + c.amount, 0);

        return {
          id: scheme.id,
          schemeCode: scheme.schemeCode,
          schemeName: scheme.schemeName,
          schemeType: scheme.schemeType,
          contributionAmount: scheme.contributionAmount,
          contributionFrequency: scheme.contributionFrequency,
          totalContributed: schemeTotal,
          isActive: scheme.isActive,
        };
      })
    );

    const memberSchemes = memberSchemesData.filter(Boolean);

    // Calculate totals
    const totalSavings = memberSavings.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLoanBalance = memberLoans
      .filter(l => l.status === "active")
      .reduce((sum, l) => sum + l.balance, 0);
    const totalSchemeContributions = memberSchemeContributions.reduce((sum, c) => sum + c.amount, 0);
    
    // Total contributions = savings balance + share capital + scheme contributions
    const totalContributions = totalSavings + member.shareCapital + totalSchemeContributions;

    // Get recent transactions
    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.memberId, memberId))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    // Get loan repayments for this member
    const memberLoanRepayments = await db
      .select()
      .from(loanRepayments)
      .where(eq(loanRepayments.memberId, memberId))
      .orderBy(desc(loanRepayments.paymentDate));

    // Total amount paid on loans
    const totalLoanRepayments = memberLoanRepayments.reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({
      member: {
        id: member.id,
        memberNumber: member.memberNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        status: member.status,
        shareCapital: member.shareCapital,
        joinDate: member.joinDate,
      },
      summary: {
        totalSavings,
        totalLoanBalance,
        totalContributions,
        totalSchemeContributions,
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
        totalDeductions: deductions,
        totalLoanRepayments: totalLoanRepayments,
        totalInterestReceived: interestCredited,
        totalShareCapital: member.shareCapital,
      },
      savings: memberSavings.map(s => ({
        id: s.id,
        accountNumber: s.accountNumber,
        accountType: s.accountType,
        balance: s.balance,
        interestRate: s.interestRate,
        status: s.status,
      })),
      loans: memberLoans.map(l => ({
        id: l.id,
        loanNumber: l.loanNumber,
        loanType: l.loanType,
        principalAmount: l.principalAmount,
        interestRate: l.interestRate,
        termMonths: l.termMonths,
        monthlyPayment: l.monthlyPayment,
        totalAmount: l.totalAmount,
        amountPaid: l.amountPaid,
        balance: l.balance,
        status: l.status,
        createdAt: l.createdAt,
      })),
      schemes: memberSchemes,
      schemeContributions: memberSchemeContributions.map(c => ({
        id: c.id,
        schemeId: c.schemeId,
        amount: c.amount,
        paymentMethod: c.paymentMethod,
        referenceNumber: c.referenceNumber,
        status: c.status,
        contributionDate: c.contributionDate,
      })),
      transactions: recentTransactions.map(t => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        type: t.type,
        amount: t.amount,
        balance: t.balance,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching member dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch member dashboard" }, { status: 500 });
  }
}
