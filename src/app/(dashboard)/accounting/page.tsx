import { db } from "@/db";
import { accounts, journalEntries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getAccounts() {
  return db.select().from(accounts).where(eq(accounts.isActive, true)).orderBy(accounts.accountCode);
}

async function getRecentJournalEntries() {
  return db
    .select({
      id: journalEntries.id,
      entryNumber: journalEntries.entryNumber,
      description: journalEntries.description,
      amount: journalEntries.amount,
      entryDate: journalEntries.entryDate,
      debitAccountCode: sql<string>`(select account_code from accounts where id = ${journalEntries.debitAccountId})`,
      debitAccountName: sql<string>`(select account_name from accounts where id = ${journalEntries.debitAccountId})`,
      creditAccountCode: sql<string>`(select account_code from accounts where id = ${journalEntries.creditAccountId})`,
      creditAccountName: sql<string>`(select account_name from accounts where id = ${journalEntries.creditAccountId})`,
    })
    .from(journalEntries)
    .orderBy(sql`${journalEntries.entryDate} desc`)
    .limit(20);
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
  }).format(new Date(date));
}

const accountTypeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-700",
  liability: "bg-red-100 text-red-700",
  equity: "bg-purple-100 text-purple-700",
  income: "bg-emerald-100 text-emerald-700",
  expense: "bg-orange-100 text-orange-700",
};

export default async function AccountingPage() {
  const [chartOfAccounts, recentEntries] = await Promise.all([
    getAccounts(),
    getRecentJournalEntries(),
  ]);

  const totalAssets = chartOfAccounts
    .filter((a) => a.accountType === "asset")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = chartOfAccounts
    .filter((a) => a.accountType === "liability")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalEquity = chartOfAccounts
    .filter((a) => a.accountType === "equity")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalIncome = chartOfAccounts
    .filter((a) => a.accountType === "income")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalExpenses = chartOfAccounts
    .filter((a) => a.accountType === "expense")
    .reduce((sum, a) => sum + a.balance, 0);

  const accountTypes = ["asset", "liability", "equity", "income", "expense"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounting</h1>
          <p className="text-slate-500 text-sm mt-1">Chart of accounts and journal entries</p>
        </div>
        <Link
          href="/accounting/setup"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Setup Accounts
        </Link>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Assets", value: formatCurrency(totalAssets), color: "text-blue-600" },
          { label: "Total Liabilities", value: formatCurrency(totalLiabilities), color: "text-red-600" },
          { label: "Total Equity", value: formatCurrency(totalEquity), color: "text-purple-600" },
          { label: "Total Income", value: formatCurrency(totalIncome), color: "text-emerald-600" },
          { label: "Total Expenses", value: formatCurrency(totalExpenses), color: "text-orange-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-slate-500 text-xs">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart of Accounts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Chart of Accounts</h2>
          </div>
          {chartOfAccounts.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="font-medium text-sm">No accounts set up</p>
              <p className="text-xs mt-1">Click &quot;Setup Accounts&quot; to initialize the chart of accounts</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {accountTypes.map((type) => {
                const typeAccounts = chartOfAccounts.filter((a) => a.accountType === type);
                if (typeAccounts.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="px-6 py-2 bg-slate-50">
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${accountTypeColors[type] ?? "bg-slate-100 text-slate-600"}`}>
                        {type}
                      </span>
                    </div>
                    {typeAccounts.map((acc) => (
                      <Link
                        key={acc.id}
                        href={`/accounting/edit/${acc.id}`}
                        className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">{acc.accountName}</p>
                          <p className="text-xs text-slate-400">{acc.accountCode}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-slate-900">{formatCurrency(acc.balance)}</p>
                          <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Journal Entries */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Journal Entries</h2>
          </div>
          {recentEntries.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <p className="text-sm">No journal entries yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{entry.description}</p>
                      <p className="text-xs text-slate-400">{entry.entryNumber} • {formatDate(entry.entryDate)}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(entry.amount)}</p>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-red-500 font-medium">DR</span>
                      <span className="text-slate-600">{entry.debitAccountCode} {entry.debitAccountName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-500 font-medium">CR</span>
                      <span className="text-slate-600">{entry.creditAccountCode} {entry.creditAccountName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
