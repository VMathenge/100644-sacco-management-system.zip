"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const defaultAccounts = [
  { code: "1001", name: "Cash and Bank", type: "asset" },
  { code: "1002", name: "Loan Portfolio", type: "asset" },
  { code: "1003", name: "Interest Receivable", type: "asset" },
  { code: "1004", name: "Other Assets", type: "asset" },
  { code: "2001", name: "Member Savings", type: "liability" },
  { code: "2002", name: "External Borrowings", type: "liability" },
  { code: "2003", name: "Other Liabilities", type: "liability" },
  { code: "3001", name: "Share Capital", type: "equity" },
  { code: "3002", name: "Retained Earnings", type: "equity" },
  { code: "3003", name: "Reserves", type: "equity" },
  { code: "4001", name: "Interest Income", type: "income" },
  { code: "4002", name: "Loan Processing Fees", type: "income" },
  { code: "4003", name: "Membership Fees", type: "income" },
  { code: "5001", name: "Interest Expense", type: "expense" },
  { code: "5002", name: "Operating Expenses", type: "expense" },
  { code: "5003", name: "Salaries and Wages", type: "expense" },
];

export default function AccountingSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounting/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: defaultAccounts }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Setup failed");
      }
      setSuccess(true);
      setTimeout(() => router.push("/accounting"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const typeColors: Record<string, string> = {
    asset: "bg-blue-100 text-blue-700",
    liability: "bg-red-100 text-red-700",
    equity: "bg-purple-100 text-purple-700",
    income: "bg-emerald-100 text-emerald-700",
    expense: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/accounting" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Setup Chart of Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Initialize the standard SACCO chart of accounts</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm mb-4">
          ✓ Chart of accounts initialized successfully! Redirecting...
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-sm text-slate-600">
            The following {defaultAccounts.length} accounts will be created:
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {defaultAccounts.map((acc) => (
            <div key={acc.code} className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-400 w-12">{acc.code}</span>
                <span className="text-sm text-slate-900">{acc.name}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${typeColors[acc.type] ?? "bg-slate-100 text-slate-600"}`}>
                {acc.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSetup}
          disabled={loading || success}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Setting up..." : "Initialize Accounts"}
        </button>
        <Link href="/accounting" className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
          Cancel
        </Link>
      </div>
    </div>
  );
}
