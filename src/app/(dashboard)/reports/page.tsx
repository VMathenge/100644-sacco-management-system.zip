import { db } from "@/db";
import { members, loans, savingsAccounts, transactions, loanRepayments } from "@/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

async function getReportData() {
  // Member stats
  const memberStats = await db
    .select({
      status: members.status,
      count: sql<number>`count(*)`,
    })
    .from(members)
    .groupBy(members.status);

  // Loan stats by type
  const loansByType = await db
    .select({
      loanType: loans.loanType,
      count: sql<number>`count(*)`,
      totalPrincipal: sql<number>`coalesce(sum(principal_amount), 0)`,
      totalBalance: sql<number>`coalesce(sum(balance), 0)`,
    })
    .from(loans)
    .where(eq(loans.status, "active"))
    .groupBy(loans.loanType);

  // Monthly transaction summary (last 6 months)
  const monthlyTransactions = await db
    .select({
      type: transactions.type,
      total: sql<number>`coalesce(sum(amount), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .groupBy(transactions.type);

  // Top savers
  const topSavers = await db
    .select({
      memberId: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      memberNumber: members.memberNumber,
      totalSavings: sql<number>`coalesce(sum(${savingsAccounts.balance}), 0)`,
    })
    .from(members)
    .leftJoin(savingsAccounts, eq(savingsAccounts.memberId, members.id))
    .groupBy(members.id)
    .orderBy(sql`coalesce(sum(${savingsAccounts.balance}), 0) desc`)
    .limit(10);

  // Loan portfolio health
  const loanHealth = await db
    .select({
      status: loans.status,
      count: sql<number>`count(*)`,
      totalBalance: sql<number>`coalesce(sum(balance), 0)`,
    })
    .from(loans)
    .groupBy(loans.status);

  // Total figures
  const [totals] = await db
    .select({
      totalMembers: sql<number>`count(distinct ${members.id})`,
      totalSavings: sql<number>`coalesce((select sum(balance) from savings_accounts where status = 'active'), 0)`,
      totalLoanPortfolio: sql<number>`coalesce((select sum(balance) from loans where status = 'active'), 0)`,
      totalRepayments: sql<number>`coalesce((select sum(amount) from loan_repayments), 0)`,
    })
    .from(members);

  return {
    memberStats,
    loansByType,
    monthlyTransactions,
    topSavers,
    loanHealth,
    totals,
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

const loanTypeColors: Record<string, string> = {
  personal: "bg-blue-500",
  business: "bg-emerald-500",
  emergency: "bg-red-500",
  development: "bg-purple-500",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500",
  pending: "bg-yellow-500",
  approved: "bg-blue-500",
  completed: "bg-slate-400",
  defaulted: "bg-red-500",
  rejected: "bg-rose-500",
};

export default async function ReportsPage() {
  const data = await getReportData();

  const totalActiveMembers = data.memberStats.find((s) => s.status === "active")?.count ?? 0;
  const totalInactiveMembers = data.memberStats.find((s) => s.status === "inactive")?.count ?? 0;

  const totalLoanCount = data.loanHealth.reduce((sum, l) => sum + l.count, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">SACCO performance overview and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: (data.totals?.totalMembers ?? 0).toLocaleString(), icon: "👥" },
          { label: "Total Savings", value: formatCurrency(data.totals?.totalSavings ?? 0), icon: "💰" },
          { label: "Loan Portfolio", value: formatCurrency(data.totals?.totalLoanPortfolio ?? 0), icon: "📋" },
          { label: "Total Repayments", value: formatCurrency(data.totals?.totalRepayments ?? 0), icon: "✅" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-slate-500 text-xs">{label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Member Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Member Status Distribution</h2>
          <div className="space-y-3">
            {data.memberStats.map((stat) => {
              const total = data.memberStats.reduce((sum, s) => sum + s.count, 0);
              const pct = total > 0 ? (stat.count / total) * 100 : 0;
              const colors: Record<string, string> = {
                active: "bg-emerald-500",
                inactive: "bg-slate-400",
                suspended: "bg-red-500",
              };
              return (
                <div key={stat.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-slate-700">{stat.status}</span>
                    <span className="font-medium text-slate-900">{stat.count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[stat.status] ?? "bg-slate-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.memberStats.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">No member data</p>
            )}
          </div>
        </div>

        {/* Loan Portfolio Health */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Loan Portfolio Health</h2>
          <div className="space-y-3">
            {data.loanHealth.map((item) => {
              const pct = totalLoanCount > 0 ? (item.count / totalLoanCount) * 100 : 0;
              return (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-slate-700">{item.status}</span>
                    <div className="text-right">
                      <span className="font-medium text-slate-900">{item.count} loans</span>
                      <span className="text-slate-400 ml-2">({formatCurrency(item.totalBalance)})</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${statusColors[item.status] ?? "bg-slate-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.loanHealth.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">No loan data</p>
            )}
          </div>
        </div>

        {/* Loans by Type */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Active Loans by Type</h2>
          {data.loansByType.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No active loans</p>
          ) : (
            <div className="space-y-4">
              {data.loansByType.map((item) => (
                <div key={item.loanType} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${loanTypeColors[item.loanType] ?? "bg-slate-400"}`} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize text-slate-700">{item.loanType}</span>
                      <span className="font-medium text-slate-900">{item.count} loans</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                      <span>Principal: {formatCurrency(item.totalPrincipal)}</span>
                      <span>Balance: {formatCurrency(item.totalBalance)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Transaction Summary</h2>
          {data.monthlyTransactions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No transactions</p>
          ) : (
            <div className="space-y-3">
              {data.monthlyTransactions.map((tx) => (
                <div key={tx.type} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">{tx.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-400">{tx.count} transaction{tx.count !== 1 ? "s" : ""}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(tx.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Savers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Top 10 Savers</h2>
        </div>
        {data.topSavers.filter((s) => s.totalSavings > 0).length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <p className="text-sm">No savings data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Member</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Member #</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Total Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.topSavers
                  .filter((s) => s.totalSavings > 0)
                  .map((saver, i) => (
                    <tr key={saver.memberId} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {saver.firstName[0]}{saver.lastName[0]}
                          </div>
                          <span className="font-medium text-slate-900">{saver.firstName} {saver.lastName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{saver.memberNumber}</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-600">{formatCurrency(saver.totalSavings)}</td>
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
