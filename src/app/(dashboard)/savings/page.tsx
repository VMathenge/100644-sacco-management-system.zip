import { db } from "@/db";
import { savingsAccounts, members } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

async function getSavingsAccounts() {
  return db
    .select({
      id: savingsAccounts.id,
      accountNumber: savingsAccounts.accountNumber,
      accountType: savingsAccounts.accountType,
      balance: savingsAccounts.balance,
      interestRate: savingsAccounts.interestRate,
      status: savingsAccounts.status,
      createdAt: savingsAccounts.createdAt,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberNumber: members.memberNumber,
      memberId: members.id,
    })
    .from(savingsAccounts)
    .leftJoin(members, eq(savingsAccounts.memberId, members.id))
    .orderBy(sql`${savingsAccounts.createdAt} desc`);
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  dormant: "bg-orange-100 text-orange-700",
  closed: "bg-slate-100 text-slate-600",
};

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
  }).format(new Date(date));
}

export default async function SavingsPage() {
  const accounts = await getSavingsAccounts();
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const activeAccounts = accounts.filter((a) => a.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Savings</h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeAccounts} active account{activeAccounts !== 1 ? "s" : ""} • Total: {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/savings/deposit"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Deposit
          </Link>
          <Link
            href="/savings/withdraw"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Withdrawal
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Savings", value: formatCurrency(totalBalance), color: "text-emerald-600" },
          { label: "Active Accounts", value: activeAccounts.toString(), color: "text-blue-600" },
          { label: "Total Accounts", value: accounts.length.toString(), color: "text-slate-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-slate-500 text-sm">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Interest Rate</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Opened</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="font-medium">No savings accounts</p>
                    <p className="text-xs mt-1">Accounts are created automatically when members register</p>
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{acc.accountNumber}</td>
                    <td className="px-6 py-4">
                      <Link href={`/members/${acc.memberId}`} className="hover:underline">
                        <p className="font-medium text-slate-900">{acc.memberFirstName} {acc.memberLastName}</p>
                        <p className="text-xs text-slate-400">{acc.memberNumber}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-700">{acc.accountType}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(acc.balance)}</td>
                    <td className="px-6 py-4 text-slate-700">{acc.interestRate}% p.a.</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[acc.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(acc.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/savings/deposit?account=${acc.id}`}
                          className="text-xs text-emerald-600 font-medium hover:underline"
                        >
                          Deposit
                        </Link>
                        <Link
                          href={`/savings/withdraw?account=${acc.id}`}
                          className="text-xs text-slate-500 font-medium hover:underline"
                        >
                          Withdraw
                        </Link>
                      </div>
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
