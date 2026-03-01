"use client";

import { useState, useEffect } from "react";
import { db } from "@/db";
import { accounts, members } from "@/db/schema";
import { eq } from "drizzle-orm";

// Types
interface DebitNote {
  id: number;
  noteNumber: string;
  memberId: number | null;
  accountId: number;
  amount: number;
  reason: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  referenceId: number | null;
  referenceType: string | null;
  issuedBy: string | null;
  createdAt: string;
  accountName?: string;
  accountCode?: string;
  memberName?: string;
}

interface CreditNote {
  id: number;
  noteNumber: string;
  memberId: number | null;
  accountId: number;
  amount: number;
  reason: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  referenceId: number | null;
  referenceType: string | null;
  issuedBy: string | null;
  createdAt: string;
  accountName?: string;
  accountCode?: string;
  memberName?: string;
}

interface Account {
  id: number;
  accountCode: string;
  accountName: string;
}

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState<"debit" | "credit">("debit");
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<DebitNote | CreditNote | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    memberId: "",
    accountId: "",
    amount: "",
    reason: "",
    description: "",
    status: "pending",
    dueDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [debitRes, creditRes, accountsRes, membersRes] = await Promise.all([
        fetch("/api/accounting/debit-notes"),
        fetch("/api/accounting/credit-notes"),
        fetch("/api/accounting/accounts"),
        fetch("/api/members"),
      ]);

      const debitData = await debitRes.json();
      const creditData = await creditRes.json();
      const accountsData = await accountsRes.json();
      const membersData = await membersRes.json();

      setDebitNotes(debitData);
      setCreditNotes(creditData);
      setAccounts(accountsData);
      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const endpoint = activeTab === "debit" ? "/api/accounting/debit-notes" : "/api/accounting/credit-notes";
    const method = editingNote ? "PUT" : "POST";
    
    const payload = {
      ...formData,
      memberId: formData.memberId ? Number(formData.memberId) : null,
      accountId: Number(formData.accountId),
      amount: Number(formData.amount),
      dueDate: formData.dueDate || null,
    };

    if (editingNote) {
      // @ts-ignore
      payload.id = editingNote.id;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingNote(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    const endpoint = activeTab === "debit" ? `/api/accounting/debit-notes/${id}` : `/api/accounting/credit-notes/${id}`;
    
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    const endpoint = activeTab === "debit" ? `/api/accounting/debit-notes/${id}` : `/api/accounting/credit-notes/${id}`;
    
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  }

  function openEditModal(note: DebitNote | CreditNote) {
    setEditingNote(note);
    setFormData({
      memberId: note.memberId?.toString() || "",
      accountId: note.accountId.toString(),
      amount: note.amount.toString(),
      reason: note.reason,
      description: note.description || "",
      status: note.status,
      dueDate: note.dueDate ? note.dueDate.split("T")[0] : "",
    });
    setShowModal(true);
  }

  function openNewModal() {
    setEditingNote(null);
    resetForm();
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      memberId: "",
      accountId: "",
      amount: "",
      reason: "",
      description: "",
      status: "pending",
      dueDate: "",
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "issued": return "bg-blue-100 text-blue-800";
      case "paid":
      case "applied": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  const currentNotes = activeTab === "debit" ? debitNotes : creditNotes;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debit & Credit Notes</h1>
          <p className="text-gray-600">Manage debit and credit notes for accounting</p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New {activeTab === "debit" ? "Debit" : "Credit"} Note
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("debit")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "debit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Debit Notes ({debitNotes.length})
          </button>
          <button
            onClick={() => setActiveTab("credit")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "credit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Credit Notes ({creditNotes.length})
          </button>
        </nav>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Total Debit Notes</div>
          <div className="text-2xl font-bold">{debitNotes.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {debitNotes.filter(n => n.status === "pending").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Total Credit Notes</div>
          <div className="text-2xl font-bold">{creditNotes.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {creditNotes.filter(n => n.status === "pending").length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Note #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentNotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No {activeTab} notes found
                </td>
              </tr>
            ) : (
              currentNotes.map((note) => (
                <tr key={note.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {note.noteNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {note.accountCode} - {note.accountName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {note.memberName || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${note.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {note.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(note.status)}`}>
                      {note.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(note)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingNote ? "Edit" : "New"} {activeTab === "debit" ? "Debit" : "Credit"} Note
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account</label>
                <select
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountCode} - {account.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Member (Optional)</label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Fee adjustment, Interest"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {editingNote && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="issued">Issued</option>
                    {activeTab === "debit" ? (
                      <option value="paid">Paid</option>
                    ) : (
                      <option value="applied">Applied</option>
                    )}
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingNote(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingNote ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
