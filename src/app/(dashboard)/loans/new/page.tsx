"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Member {
  id: number;
  memberNumber: string;
  firstName: string;
  lastName: string;
}

export default function NewLoanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMember = searchParams.get("member");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [principal, setPrincipal] = useState(50000);
  const [rate, setRate] = useState(12);
  const [term, setTerm] = useState(12);

  const monthlyRate = rate / 100 / 12;
  const monthlyPayment =
    monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
        (Math.pow(1 + monthlyRate, term) - 1)
      : principal / term;
  const totalAmount = monthlyPayment * term;
  const totalInterest = totalAmount - principal;

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          principalAmount: principal,
          interestRate: rate,
          termMonths: term,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create loan");
      }

      router.push("/loans");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/loans" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Loan Application</h1>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the loan details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Member & Loan Type */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Loan Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Member *</label>
              <select
                name="memberId"
                required
                defaultValue={preselectedMember ?? ""}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.memberNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loan Type *</label>
              <select
                name="loanType"
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="emergency">Emergency</option>
                <option value="development">Development</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
              <textarea
                name="purpose"
                rows={2}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Describe the purpose of the loan..."
              />
            </div>
          </div>
        </div>

        {/* Loan Calculator */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Loan Calculator</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Principal Amount (KES) *</label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (% p.a.) *</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Term (Months) *</label>
              <input
                type="number"
                min="1"
                max="120"
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-emerald-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-emerald-600 font-medium">Monthly Payment</p>
              <p className="text-lg font-bold text-emerald-800">{formatCurrency(monthlyPayment)}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Total Amount</p>
              <p className="text-lg font-bold text-emerald-800">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Total Interest</p>
              <p className="text-lg font-bold text-emerald-800">{formatCurrency(totalInterest)}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Term</p>
              <p className="text-lg font-bold text-emerald-800">{term} months</p>
            </div>
          </div>
        </div>

        {/* Guarantor */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Guarantor (Optional)</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guarantor Member</label>
            <select
              name="guarantorId"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">No guarantor</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.memberNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
          <Link
            href="/loans"
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
