"use client";

import { useState, useEffect } from "react";

interface SchemeAccount {
  id: number;
  accountId: number;
  accountRole: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

interface Scheme {
  id: number;
  schemeCode: string;
  schemeName: string;
  description: string | null;
  schemeType: string;
  contributionAmount: number;
  contributionFrequency: string | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  accounts: SchemeAccount[];
  totalBalance: number;
}

interface Account {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
}

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    schemeCode: "",
    schemeName: "",
    description: "",
    schemeType: "welfare",
    contributionAmount: "",
    contributionFrequency: "monthly",
    startDate: "",
    endDate: "",
    accounts: [] as { accountId: string; accountRole: string }[],
  });

  const schemeTypes = [
    { value: "welfare", label: "Welfare Scheme" },
    { value: "education", label: "Education Scheme" },
    { value: "emergency", label: "Emergency Fund" },
    { value: "burial", label: "Burial Scheme" },
    { value: "medical", label: "Medical Scheme" },
    { value: "custom", label: "Custom Scheme" },
  ];

  const contributionFrequencies = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annually", label: "Annually" },
    { value: "one-time", label: "One-time" },
  ];

  const accountRoles = [
    { value: "contribution", label: "Contribution Account (Receives funds)" },
    { value: "benefit", label: "Benefit Account (Pays out benefits)" },
    { value: "expense", label: "Expense Account" },
    { value: "reserve", label: "Reserve Account" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [schemesRes, accountsRes] = await Promise.all([
        fetch("/api/schemes"),
        fetch("/api/accounting/accounts"),
      ]);

      const schemesData = await schemesRes.json();
      const accountsData = await accountsRes.json();

      if (Array.isArray(schemesData)) setSchemes(schemesData);
      if (Array.isArray(accountsData)) setAccounts(accountsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  function addAccountField() {
    setFormData({
      ...formData,
      accounts: [...formData.accounts, { accountId: "", accountRole: "contribution" }],
    });
  }

  function removeAccountField(index: number) {
    setFormData({
      ...formData,
      accounts: formData.accounts.filter((_, i) => i !== index),
    });
  }

  function updateAccountField(index: number, field: string, value: string) {
    const newAccounts = [...formData.accounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setFormData({ ...formData, accounts: newAccounts });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const validAccounts = formData.accounts.filter(a => a.accountId);
      
      const res = await fetch("/api/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeCode: formData.schemeCode,
          schemeName: formData.schemeName,
          description: formData.description || null,
          schemeType: formData.schemeType,
          contributionAmount: formData.contributionAmount ? parseFloat(formData.contributionAmount) : 0,
          contributionFrequency: formData.contributionFrequency,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          accounts: validAccounts.map(a => ({
            accountId: parseInt(a.accountId),
            accountRole: a.accountRole,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create scheme");
        return;
      }

      setSuccess("Scheme created successfully!");
      setShowForm(false);
      setFormData({
        schemeCode: "",
        schemeName: "",
        description: "",
        schemeType: "welfare",
        contributionAmount: "",
        contributionFrequency: "monthly",
        startDate: "",
        endDate: "",
        accounts: [],
      });
      fetchData();
    } catch (err) {
      setError("An error occurred while creating the scheme");
    } finally {
      setSubmitting(false);
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Schemes</h1>
          <p className="text-gray-600">Manage SACCO schemes and their accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Scheme
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Scheme</h2>
          
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
                  Scheme Code *
                </label>
                <input
                  type="text"
                  value={formData.schemeCode}
                  onChange={(e) => setFormData({ ...formData, schemeCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., WELFARE-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  value={formData.schemeName}
                  onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Member Welfare Fund"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheme Type *
                </label>
                <select
                  value={formData.schemeType}
                  onChange={(e) => setFormData({ ...formData, schemeType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {schemeTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.contributionAmount}
                  onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Frequency
                </label>
                <select
                  value={formData.contributionFrequency}
                  onChange={(e) => setFormData({ ...formData, contributionFrequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {contributionFrequencies.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  placeholder="Scheme description"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Affected Accounts</h3>
                <button
                  type="button"
                  onClick={addAccountField}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Account
                </button>
              </div>

              {formData.accounts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No accounts linked yet. Click &quot;Add Account&quot; to link accounts to this scheme.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.accounts.map((account, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <select
                          value={account.accountId}
                          onChange={(e) => updateAccountField(index, "accountId", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Account</option>
                          {accounts.map((acct) => (
                            <option key={acct.id} value={acct.id}>
                              {acct.accountCode} - {acct.accountName} ({acct.accountType})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          value={account.accountRole}
                          onChange={(e) => updateAccountField(index, "accountRole", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {accountRoles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAccountField(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
                {submitting ? "Creating..." : "Create Scheme"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No schemes found. Create your first scheme.
          </div>
        ) : (
          schemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{scheme.schemeName}</h3>
                  <p className="text-sm text-gray-500">{scheme.schemeCode}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${scheme.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {scheme.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-900 capitalize">{scheme.schemeType}</span>
                </div>
                {scheme.contributionAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Contribution:</span>
                    <span className="text-gray-900">{scheme.contributionAmount.toLocaleString()} / {scheme.contributionFrequency}</span>
                  </div>
                )}
                {scheme.description && (
                  <p className="text-sm text-gray-600 mt-2">{scheme.description}</p>
                )}
              </div>

              {scheme.accounts && scheme.accounts.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Affected Accounts:</h4>
                  <div className="space-y-1">
                    {scheme.accounts.map((acct) => (
                      <div key={acct.id} className="flex justify-between text-xs">
                        <span className="text-gray-500">{acct.accountCode} - {acct.accountName}</span>
                        <span className="text-blue-600 capitalize">{acct.accountRole}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-sm font-medium">
                    <span className="text-gray-700">Total Account Balance:</span>
                    <span className="text-green-600">{scheme.totalBalance.toLocaleString("en-KE", { style: "currency", currency: "KES" })}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 mt-3">
                Created: {new Date(scheme.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
