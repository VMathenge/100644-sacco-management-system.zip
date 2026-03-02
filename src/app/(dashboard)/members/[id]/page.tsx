import { db } from "@/db";
import { members, savingsAccounts, loans, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  suspended: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  completed: "bg-slate-100 text-slate-600",
  defaulted: "bg-red-100 text-red-700",
  rejected: "bg-rose-100 text-rose-700",
  dormant: "bg-orange-100 text-orange-700",
  closed: "bg-slate-100 text-slate-600",
};

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const memberId = parseInt(id);

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!member) notFound();

  const memberSavings = await db
    .select()
    .from(savingsAccounts)
    .where(eq(savingsAccounts.memberId, memberId));

  const memberLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.memberId, memberId))
    .orderBy(sql`${loans.createdAt} desc`);

  const recentTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.memberId, memberId))
    .orderBy(sql`${transactions.createdAt} desc`)
    .limit(10);

  const totalSavings = memberSavings.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLoanBalance = memberLoans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + l.balance, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/members" className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            {member.photoUrl ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500">
                <img src={member.photoUrl} alt="Member photo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg">
                {member.firstName[0]}{member.lastName[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{member.firstName} {member.lastName}</h1>
              <p className="text-slate-500 text-sm">{member.memberNumber}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${statusColors[member.status] ?? "bg-slate-100 text-slate-600"}`}>
            {member.status}
          </span>
          <Link
            href={`/members/${member.id}/edit`}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-slate-500 text-sm">Total Savings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalSavings)}</p>
          <p className="text-xs text-slate-400 mt-1">{memberSavings.length} account{memberSavings.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-slate-500 text-sm">Active Loan Balance</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalLoanBalance)}</p>
          <p className="text-xs text-slate-400 mt-1">{memberLoans.filter(l => l.status === "active").length} active loan{memberLoans.filter(l => l.status === "active").length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-slate-500 text-sm">Share Capital</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(member.shareCapital)}</p>
          <p className="text-xs text-slate-400 mt-1">Member since {formatDate(member.joinDate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Personal Details</h2>
          <dl className="space-y-3">
            {[
              { label: "Full Name", value: `${member.firstName} ${member.lastName}` },
              { label: "Member Number", value: member.memberNumber },
              { label: "Email", value: member.email },
              { label: "Phone", value: member.phone },
              { label: "National ID", value: member.nationalId },
              { label: "Date of Birth", value: formatDate(member.dateOfBirth) },
              { label: "Occupation", value: member.occupation ?? "—" },
              { label: "Address", value: member.address },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-slate-900 font-medium text-right max-w-xs">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Savings Accounts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Savings Accounts</h2>
            <Link href={`/savings?member=${member.id}`} className="text-emerald-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          {memberSavings.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No savings accounts</p>
          ) : (
            <div className="space-y-3">
              {memberSavings.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{acc.accountNumber}</p>
                    <p className="text-xs text-slate-400 capitalize">{acc.accountType} • {acc.interestRate}% p.a.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(acc.balance)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[acc.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {acc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loans */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Loans</h2>
          <Link href={`/loans/new?member=${member.id}`} className="text-emerald-600 text-sm hover:underline">
            + New Loan
          </Link>
        </div>
        {memberLoans.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <p className="text-sm">No loans found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Loan #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Principal</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Balance</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link href={`/loans/${loan.id}`} className="text-emerald-600 hover:underline font-medium">
                        {loan.loanNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3 capitalize text-slate-700">{loan.loanType}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatCurrency(loan.principalAmount)}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatCurrency(loan.balance)}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[loan.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{formatDate(loan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 capitalize">{tx.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-400">{tx.transactionNumber} • {formatDate(tx.createdAt)}</p>
                </div>
                <p className={`text-sm font-semibold ${tx.type === "withdrawal" || tx.type === "loan_disbursement" ? "text-red-600" : "text-emerald-600"}`}>
                  {tx.type === "withdrawal" || tx.type === "loan_disbursement" ? "-" : "+"}
                  {formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
