"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Account {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
  isActive: boolean;
}

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("asset");
  const [balance, setBalance] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function fetchAccount() {
      try {
        const res = await fetch(`/api/accounting/accounts/${accountId}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Failed to fetch account");
        }
        const data: Account = await res.json();
        setAccountCode(data.accountCode);
        setAccountName(data.accountName);
        setAccountType(data.accountType);
        setBalance(data.balance);
        setIsActive(data.isActive);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (accountId) {
      fetchAccount();
    }
  }, [accountId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountCode,
          accountName,
          accountType,
          balance,
          isActive,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Update failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/accounting"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const accountTypes = [
    { value: "asset", label: "Asset" },
    { value: "liability", label: "Liability" },
    { value: "equity", label: "Equity" },
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
  ];

  const typeColors: Record<string, string> = {
    asset: "bg-blue-100 text-blue-700",
    liability: "bg-red-100 text-red-700",
    equity: "bg-purple-100 text-purple-700",
    income: "bg-emerald-100 text-emerald-700",
    expense: "bg-orange-100 text-orange-700",
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Loading account...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/accounting" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Account</h1>
          <p className="text-slate-500 text-sm mt-0.5">Update account details</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm mb-4">
          ✓ Account updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Account Code */}
        <div>
          <label htmlFor="accountCode" className="block text-sm font-medium text-slate-700 mb-1.5">
            Account Code
          </label>
          <input
            type="text"
            id="accountCode"
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="e.g., 1001"
          />
        </div>

        {/* Account Name */}
        <div>
          <label htmlFor="accountName" className="block text-sm font-medium text-slate-700 mb-1.5">
            Account Name
          </label>
          <input
            type="text"
            id="accountName"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="e.g., Cash and Bank"
          />
        </div>

        {/* Account Type */}
        <div>
          <label htmlFor="accountType" className="block text-sm font-medium text-slate-700 mb-1.5">
            Account Type
          </label>
          <select
            id="accountType"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {accountTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Balance */}
        <div>
          <label htmlFor="balance" className="block text-sm font-medium text-slate-700 mb-1.5">
            Balance (KES)
          </label>
          <input
            type="number"
            id="balance"
            value={balance}
            onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
            step="0.01"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="0.00"
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="isActive" className="text-sm text-slate-700">
            Active account
          </label>
          {!isActive && (
            <span className="text-xs text-slate-400">(Inactive accounts won&apos;t appear in transactions)</span>
          )}
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Preview</p>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="font-mono text-xs text-slate-500">{accountCode}</span>
            <span className="text-sm text-slate-900">{accountName || "—"}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ml-auto capitalize ${typeColors[accountType] ?? "bg-slate-100 text-slate-600"}`}>
              {accountType}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || success}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/accounting"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
