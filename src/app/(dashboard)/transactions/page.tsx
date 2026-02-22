import { db } from "@/db";
import { transactions, members } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

async function getTransactions() {
  return db
    .select({
      id: transactions.id,
      transactionNumber: transactions.transactionNumber,
      type: transactions.type,
      amount: transactions.amount,
      balance: transactions.balance,
      description: transactions.description,
      referenceType: transactions.referenceType,
      processedBy: transactions.processedBy,
      createdAt: transactions.createdAt,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberNumber: members.memberNumber,
      memberId: members.id,
    })
    .from(transactions)
    .leftJoin(members, eq(transactions.memberId, members.id))
    .orderBy(sql`${transactions.createdAt} desc`)
    .limit(200);
}

const typeColors: Record<string, string> = {
  deposit: "bg-emerald-100 text-emerald-700",
  withdrawal: "bg-red-100 text-red-700",
  loan_disbursement: "bg-blue-100 text-blue-700",
  loan_repayment: "bg-purple-100 text-purple-700",
  interest: "bg-yellow-100 text-yellow-700",
  fee: "bg-orange-100 text-orange-700",
  share_capital: "bg-teal-100 text-teal-700",
};

const creditTypes = new Set(["deposit", "loan_repayment", "interest", "share_capital"]);

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

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const allTransactions = await getTransactions();

  const filtered = type
    ? allTransactions.filter((tx) => tx.type === type)
    : allTransactions;

  const totalDeposits = allTransactions
    .filter((tx) => tx.type === "deposit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalWithdrawals = allTransactions
    .filter((tx) => tx.type === "withdrawal")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalLoanDisbursements = allTransactions
    .filter((tx) => tx.type === "loan_disbursement")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalRepayments = allTransactions
    .filter((tx) => tx.type === "loan_repayment")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const txTypes = [
    "deposit",
    "withdrawal",
    "loan_disbursement",
    "loan_repayment",
    "interest",
    "fee",
    "share_capital",
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="text-slate-500 text-sm mt-1">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Deposits", value: formatCurrency(totalDeposits), color: "text-emerald-600" },
          { label: "Total Withdrawals", value: formatCurrency(totalWithdrawals), color: "text-red-600" },
          { label: "Loan Disbursements", value: formatCurrency(totalLoanDisbursements), color: "text-blue-600" },
          { label: "Loan Repayments", value: formatCurrency(totalRepayments), color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-slate-500 text-xs">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <form method="GET" className="flex flex-wrap gap-2">
          <a
            href="/transactions"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!type ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All
          </a>
          {txTypes.map((t) => (
            <a
              key={t}
              href={`/transactions?type=${t}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${type === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {t.replace(/_/g, " ")}
            </a>
          ))}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Processed By</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="font-medium">No transactions found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">{tx.transactionNumber}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${typeColors[tx.type] ?? "bg-slate-100 text-slate-600"}`}>
                        {tx.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {tx.memberFirstName ? (
                        <div>
                          <p className="font-medium text-slate-900">{tx.memberFirstName} {tx.memberLastName}</p>
                          <p className="text-xs text-slate-400">{tx.memberNumber}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-600 max-w-xs truncate">{tx.description ?? "—"}</td>
                    <td className={`px-6 py-3 text-right font-semibold ${creditTypes.has(tx.type) ? "text-emerald-600" : "text-red-600"}`}>
                      {creditTypes.has(tx.type) ? "+" : "-"}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{tx.processedBy ?? "—"}</td>
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
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
