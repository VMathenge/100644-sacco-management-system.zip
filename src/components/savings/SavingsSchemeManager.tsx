"use client";

import { useState, useEffect } from "react";

interface SavingsScheme {
  id: number;
  schemeCode: string;
  schemeName: string;
  description: string | null;
  defaultInterestRate: number;
  minimumBalance: number;
  isActive: boolean;
}

export default function SavingsSchemeManager() {
  const [schemes, setSchemes] = useState<SavingsScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    schemeCode: "",
    schemeName: "",
    description: "",
    defaultInterestRate: 3.5,
    minimumBalance: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const res = await fetch("/api/savings/schemes");
      const data = await res.json();
      if (data.schemes) {
        setSchemes(data.schemes);
      }
    } catch (err) {
      console.error("Error fetching schemes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/savings/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create scheme");
        return;
      }

      setSuccess("Scheme created successfully!");
      setFormData({
        schemeCode: "",
        schemeName: "",
        description: "",
        defaultInterestRate: 3.5,
        minimumBalance: 0,
      });
      setShowForm(false);
      fetchSchemes();
    } catch (err) {
      setError("Failed to create scheme");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scheme?")) return;

    try {
      const res = await fetch(`/api/savings/schemes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete scheme");
        return;
      }

      fetchSchemes();
    } catch (err) {
      alert("Failed to delete scheme");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p className="text-slate-500">Loading schemes...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Savings Scheme Types</h2>
          <p className="text-sm text-slate-500">Manage different savings account types</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Scheme
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Code *</label>
              <input
                type="text"
                value={formData.schemeCode}
                onChange={(e) => setFormData({ ...formData, schemeCode: e.target.value.toUpperCase() })}
                placeholder="e.g., SCHOOL"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Name *</label>
              <input
                type="text"
                value={formData.schemeName}
                onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                placeholder="e.g., School Fees Savings"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultInterestRate}
                onChange={(e) => setFormData({ ...formData, defaultInterestRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Balance</label>
              <input
                type="number"
                step="1"
                value={formData.minimumBalance}
                onChange={(e) => setFormData({ ...formData, minimumBalance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {success && <p className="text-green-600 text-sm mt-3">{success}</p>}

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating..." : "Create Scheme"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Interest Rate</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Min. Balance</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schemes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  <p className="font-medium">No savings schemes found</p>
                  <p className="text-xs mt-1">Click &quot;Add Scheme&quot; to create one</p>
                </td>
              </tr>
            ) : (
              schemes.map((scheme) => (
                <tr key={scheme.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{scheme.schemeCode}</td>
                  <td className="px-6 py-4 text-slate-700">{scheme.schemeName}</td>
                  <td className="px-6 py-4 text-slate-500">{scheme.description || "—"}</td>
                  <td className="px-6 py-4 text-slate-700">{scheme.defaultInterestRate}%</td>
                  <td className="px-6 py-4 text-slate-700">
                    {scheme.minimumBalance > 0 
                      ? `KES ${scheme.minimumBalance.toLocaleString()}`
                      : "—"
                    }
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(scheme.id)}
                      className="text-xs text-red-600 font-medium hover:underline"
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
    </div>
  );
}
