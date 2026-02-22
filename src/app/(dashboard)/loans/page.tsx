import { db } from "@/db";
import { loans, members } from "@/db/schema";
import { eq, sql, like, or } from "drizzle-orm";
import Link from "next/link";

async function getLoans(search?: string, status?: string) {
  const query = db
    .select({
      id: loans.id,
      loanNumber: loans.loanNumber,
      loanType: loans.loanType,
      principalAmount: loans.principalAmount,
      balance: loans.balance,
      amountPaid: loans.amountPaid,
      interestRate: loans.interestRate,
      termMonths: loans.termMonths,
      monthlyPayment: loans.monthlyPayment,
      status: loans.status,
      dueDate: loans.dueDate,
      disbursedAt: loans.disbursedAt,
      createdAt: loans.createdAt,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberNumber: members.memberNumber,
      memberId: members.id,
    })
    .from(loans)
    .leftJoin(members, eq(loans.memberId, members.id))
    .orderBy(sql`${loans.createdAt} desc`);

  return query;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  defaulted: "bg-red-100 text-red-700",
  rejected: "bg-rose-100 text-rose-700",
};

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

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { search, status } = await searchParams;
  const allLoans = await getLoans(search, status);

  const filtered = allLoans.filter((loan) => {
    const matchesStatus = !status || loan.status === status;
    const matchesSearch =
      !search ||
      loan.loanNumber.toLowerCase().includes(search.toLowerCase()) ||
      `${loan.memberFirstName} ${loan.memberLastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (loan.memberNumber ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statuses = ["pending", "approved", "active", "completed", "defaulted", "rejected"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loans</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} loan{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/loans/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Loan Application
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <form method="GET" className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by loan number or member..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loan #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No loans found</p>
                    <p className="text-xs mt-1">Create a new loan application to get started</p>
                  </td>
                </tr>
              ) : (
                filtered.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/loans/${loan.id}`} className="text-emerald-600 font-medium hover:underline">
                        {loan.loanNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/members/${loan.memberId}`} className="hover:underline">
                        <p className="font-medium text-slate-900">{loan.memberFirstName} {loan.memberLastName}</p>
                        <p className="text-xs text-slate-400">{loan.memberNumber}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-700">{loan.loanType}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(loan.principalAmount)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(loan.balance)}</td>
                    <td className="px-6 py-4 text-slate-700">{loan.interestRate}%</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[loan.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(loan.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Link href={`/loans/${loan.id}`} className="text-xs text-emerald-600 font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
