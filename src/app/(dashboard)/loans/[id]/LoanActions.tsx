"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Loan {
  id: number;
  loanNumber: string;
  status: string;
  balance: number;
  monthlyPayment: number;
}

export default function LoanActions({ loan }: { loan: Loan }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState(loan.monthlyPayment);

  async function handleAction(action: string, extra?: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Action failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Actions</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loan.status === "pending" && (
          <>
            <button
              onClick={() => handleAction("approve")}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              ✓ Approve Loan
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              ✗ Reject Application
            </button>
          </>
        )}

        {loan.status === "approved" && (
          <button
            onClick={() => handleAction("disburse")}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            💸 Disburse Loan
          </button>
        )}

        {loan.status === "active" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Repayment Amount (KES)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={repayAmount}
                onChange={(e) => setRepayAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => handleAction("repay", { amount: repayAmount })}
              disabled={loading || repayAmount <= 0}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Processing..." : "Record Repayment"}
            </button>
          </div>
        )}

        {(loan.status === "completed" || loan.status === "rejected") && (
          <div className="text-center py-4 text-slate-400 text-sm">
            No actions available for {loan.status} loans
          </div>
        )}
      </div>
    </div>
  );
}
