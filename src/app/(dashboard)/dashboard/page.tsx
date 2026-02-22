import Link from "next/link";
import { db } from "@/db";
import { members, loans, savingsAccounts, transactions } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

async function getDashboardStats() {
  const [totalMembers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(eq(members.status, "active"));

  const [totalSavings] = await db
    .select({ total: sql<number>`coalesce(sum(balance), 0)` })
    .from(savingsAccounts)
    .where(eq(savingsAccounts.status, "active"));

  const [activeLoans] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(balance), 0)`,
    })
    .from(loans)
    .where(eq(loans.status, "active"));

  const [pendingLoans] = await db
    .select({ count: sql<number>`count(*)` })
    .from(loans)
    .where(eq(loans.status, "pending"));

  const recentTransactions = await db
    .select({
      id: transactions.id,
      transactionNumber: transactions.transactionNumber,
      type: transactions.type,
      amount: transactions.amount,
      description: transactions.description,
      createdAt: transactions.createdAt,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
    })
    .from(transactions)
    .leftJoin(members, eq(transactions.memberId, members.id))
    .orderBy(sql`${transactions.createdAt} desc`)
    .limit(8);

  const loansByStatus = await db
    .select({
      status: loans.status,
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(principal_amount), 0)`,
    })
    .from(loans)
    .groupBy(loans.status);

  return {
    totalMembers: totalMembers?.count ?? 0,
    totalSavings: totalSavings?.total ?? 0,
    activeLoansCount: activeLoans?.count ?? 0,
    activeLoanBalance: activeLoans?.total ?? 0,
    pendingLoans: pendingLoans?.count ?? 0,
    recentTransactions,
    loansByStatus,
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const transactionTypeColors: Record<string, string> = {
  deposit: "bg-emerald-100 text-emerald-700",
  withdrawal: "bg-red-100 text-red-700",
  loan_disbursement: "bg-blue-100 text-blue-700",
  loan_repayment: "bg-purple-100 text-purple-700",
  interest: "bg-yellow-100 text-yellow-700",
  fee: "bg-orange-100 text-orange-700",
  share_capital: "bg-teal-100 text-teal-700",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Total Members",
      value: stats.totalMembers.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "bg-blue-500",
      bg: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Total Savings",
      value: formatCurrency(stats.totalSavings),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Active Loans",
      value: formatCurrency(stats.activeLoanBalance),
      subValue: `${stats.activeLoansCount} loans`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-orange-500",
      bg: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      label: "Pending Approvals",
      value: stats.pendingLoans.toLocaleString(),
      subValue: "loan applications",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-purple-500",
      bg: "bg-purple-50",
      textColor: "text-purple-600",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back! Here&apos;s an overview of your SACCO.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                {card.subValue && (
                  <p className={`text-xs font-medium mt-1 ${card.textColor}`}>{card.subValue}</p>
                )}
              </div>
              <div className={`${card.bg} ${card.textColor} p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
            <a href="/transactions" className="text-emerald-600 text-sm font-medium hover:underline">
              View all
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentTransactions.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                        transactionTypeColors[tx.type] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tx.type.replace(/_/g, " ")}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {tx.memberFirstName
                          ? `${tx.memberFirstName} ${tx.memberLastName}`
                          : tx.description ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400">{tx.transactionNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === "withdrawal" || tx.type === "loan_disbursement" ? "text-red-600" : "text-emerald-600"}`}>
                      {tx.type === "withdrawal" || tx.type === "loan_disbursement" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Loan Portfolio */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Loan Portfolio</h2>
          </div>
          <div className="p-6 space-y-4">
            {stats.loansByStatus.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No loans yet</p>
              </div>
            ) : (
              stats.loansByStatus.map((item) => {
                const statusColors: Record<string, string> = {
                  pending: "bg-yellow-400",
                  approved: "bg-blue-400",
                  active: "bg-emerald-400",
                  completed: "bg-slate-400",
                  defaulted: "bg-red-400",
                  rejected: "bg-rose-400",
                };
                return (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${statusColors[item.status] ?? "bg-slate-400"}`} />
                      <span className="text-sm text-slate-700 capitalize">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{item.count}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-6 pb-6 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
            <Link
              href="/members/new"
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register Member
            </Link>
            <Link
              href="/loans/new"
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Loan Application
            </Link>
            <Link
              href="/savings/deposit"
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Record Deposit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
