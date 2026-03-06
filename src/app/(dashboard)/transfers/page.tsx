"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Transfer {
  id: number;
  transferNumber: string;
  memberId: number | null;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  transferType: string;
  description: string | null;
  referenceNumber: string | null;
  status: string;
  processedBy: string | null;
  processedAt: Date | null;
  createdAt: Date;
  fromAccountName: string;
  toAccountName: string;
  memberName: string | null;
}

interface Account {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
}

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

export default function TransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    memberId: "",
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    transferType: "account_to_account",
    description: "",
    referenceNumber: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [transfersRes, accountsRes, membersRes] = await Promise.all([
        fetch("/api/transfers"),
        fetch("/api/accounting/accounts"),
        fetch("/api/members"),
      ]);

      const transfersData = await transfersRes.json();
      const accountsData = await accountsRes.json();
      const membersData = await membersRes.json();

      if (Array.isArray(transfersData)) setTransfers(transfersData);
      if (Array.isArray(accountsData)) setAccounts(accountsData);
      if (Array.isArray(membersData)) setMembers(membersData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: formData.memberId ? parseInt(formData.memberId) : null,
          fromAccountId: parseInt(formData.fromAccountId),
          toAccountId: parseInt(formData.toAccountId),
          amount: parseFloat(formData.amount),
          transferType: formData.transferType,
          description: formData.description || null,
          referenceNumber: formData.referenceNumber || null,
          processedBy: "Admin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create transfer");
        return;
      }

      setSuccess("Transfer completed successfully!");
      setShowForm(false);
      setFormData({
        memberId: "",
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        transferType: "account_to_account",
        description: "",
        referenceNumber: "",
      });
      fetchData();
    } catch (err) {
      setError("An error occurred while processing the transfer");
    } finally {
      setSubmitting(false);
    }
  }

  const transferTypeLabels: Record<string, string> = {
    internal: "Internal (within SACCO)",
    external: "External (to external account)",
    member_to_member: "Member to Member",
    account_to_account: "Account to Account",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fund Transfers</h1>
          <p className="text-gray-600">Transfer funds between accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Transfer
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Transfer</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Type
                </label>
                <select
                  value={formData.transferType}
                  onChange={(e) => setFormData({ ...formData, transferType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="account_to_account">Account to Account</option>
                  <option value="member_to_member">Member to Member</option>
                  <option value="internal">Internal (within SACCO)</option>
                  <option value="external">External (to external account)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member (Optional)
                </label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.memberNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Account *
                </label>
                <select
                  value={formData.fromAccountId}
                  onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Source Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountCode} - {account.accountName} (Balance: {account.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Account *
                </label>
                <select
                  value={formData.toAccountId}
                  onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Destination Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountCode} - {account.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional reference"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Process Transfer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Account</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No transfers found. Create your first transfer.
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {transfer.transferNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transferTypeLabels[transfer.transferType] || transfer.transferType}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transfer.fromAccountName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transfer.toAccountName}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {transfer.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[transfer.status] || "bg-gray-100 text-gray-800"}`}>
                        {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(transfer.createdAt).toLocaleDateString()}
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
