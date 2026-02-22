import { db } from "@/db";
import { loans, members, loanRepayments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import LoanActions from "./LoanActions";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null | string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  defaulted: "bg-red-100 text-red-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loanId = parseInt(id);

  const [loan] = await db
    .select({
      id: loans.id,
      loanNumber: loans.loanNumber,
      loanType: loans.loanType,
      principalAmount: loans.principalAmount,
      interestRate: loans.interestRate,
      termMonths: loans.termMonths,
      monthlyPayment: loans.monthlyPayment,
      totalAmount: loans.totalAmount,
      amountPaid: loans.amountPaid,
      balance: loans.balance,
      status: loans.status,
      purpose: loans.purpose,
      dueDate: loans.dueDate,
      disbursedAt: loans.disbursedAt,
      approvedBy: loans.approvedBy,
      createdAt: loans.createdAt,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberNumber: members.memberNumber,
      memberId: members.id,
    })
    .from(loans)
    .leftJoin(members, eq(loans.memberId, members.id))
    .where(eq(loans.id, loanId))
    .limit(1);

  if (!loan) notFound();

  const repayments = await db
    .select()
    .from(loanRepayments)
    .where(eq(loanRepayments.loanId, loanId))
    .orderBy(sql`${loanRepayments.paymentDate} desc`);

  const progressPercent = loan.totalAmount > 0
    ? Math.min(100, (loan.amountPaid / loan.totalAmount) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/loans" className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{loan.loanNumber}</h1>
            <p className="text-slate-500 text-sm capitalize">{loan.loanType} Loan</p>
          </div>
        </div>
        <span className={`text-sm font-medium px-3 py-1.5 rounded-full capitalize ${statusColors[loan.status] ?? "bg-slate-100 text-slate-600"}`}>
          {loan.status}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Principal", value: formatCurrency(loan.principalAmount) },
          { label: "Balance", value: formatCurrency(loan.balance) },
          { label: "Amount Paid", value: formatCurrency(loan.amountPaid) },
          { label: "Monthly Payment", value: formatCurrency(loan.monthlyPayment) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-slate-500 text-xs">{label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      {loan.status === "active" || loan.status === "completed" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Repayment Progress</p>
            <p className="text-sm font-bold text-emerald-600">{progressPercent.toFixed(1)}%</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>Paid: {formatCurrency(loan.amountPaid)}</span>
            <span>Total: {formatCurrency(loan.totalAmount)}</span>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Loan Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Loan Details</h2>
          <dl className="space-y-3">
            {[
              { label: "Member", value: `${loan.memberFirstName} ${loan.memberLastName} (${loan.memberNumber})` },
              { label: "Loan Type", value: loan.loanType, capitalize: true },
              { label: "Interest Rate", value: `${loan.interestRate}% p.a.` },
              { label: "Term", value: `${loan.termMonths} months` },
              { label: "Purpose", value: loan.purpose ?? "—" },
              { label: "Applied On", value: formatDate(loan.createdAt) },
              { label: "Disbursed On", value: formatDate(loan.disbursedAt) },
              { label: "Due Date", value: formatDate(loan.dueDate) },
              { label: "Approved By", value: loan.approvedBy ?? "—" },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-slate-500">{label}</dt>
                <dd className={`text-slate-900 font-medium ${capitalize ? "capitalize" : ""}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Actions */}
        <LoanActions loan={loan} />
      </div>

      {/* Repayment Schedule */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Repayment History</h2>
        </div>
        {repayments.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <p className="text-sm">No repayments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Principal</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Interest</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repayments.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500">{repayments.length - i}</td>
                    <td className="px-6 py-3 text-slate-700">{formatDate(r.paymentDate)}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatCurrency(r.amount)}</td>
                    <td className="px-6 py-3 text-slate-700">{formatCurrency(r.principal)}</td>
                    <td className="px-6 py-3 text-slate-700">{formatCurrency(r.interest)}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatCurrency(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
