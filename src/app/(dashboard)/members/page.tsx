import { db } from "@/db";
import { members, savingsAccounts, loans } from "@/db/schema";
import { eq, sql, like, or } from "drizzle-orm";
import Link from "next/link";

async function getMembers(search?: string) {
  const query = db
    .select({
      id: members.id,
      memberNumber: members.memberNumber,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
      phone: members.phone,
      status: members.status,
      shareCapital: members.shareCapital,
      joinDate: members.joinDate,
      savingsBalance: sql<number>`coalesce((select sum(balance) from savings_accounts where member_id = ${members.id} and status = 'active'), 0)`,
      activeLoans: sql<number>`coalesce((select count(*) from loans where member_id = ${members.id} and status = 'active'), 0)`,
    })
    .from(members);

  if (search) {
    return query.where(
      or(
        like(members.firstName, `%${search}%`),
        like(members.lastName, `%${search}%`),
        like(members.email, `%${search}%`),
        like(members.memberNumber, `%${search}%`),
        like(members.phone, `%${search}%`)
      )
    );
  }

  return query.orderBy(sql`${members.createdAt} desc`);
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  suspended: "bg-red-100 text-red-700",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const allMembers = await getMembers(search);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members</h1>
          <p className="text-slate-500 text-sm mt-1">
            {allMembers.length} member{allMembers.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link
          href="/members/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Register Member
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <form method="GET">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by name, email, phone, or member number..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Savings</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Share Capital</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Loans</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="font-medium">No members found</p>
                    <p className="text-xs mt-1">
                      {search ? "Try a different search term" : "Register your first member to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                allMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-slate-400">{member.memberNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{member.email}</p>
                      <p className="text-xs text-slate-400">{member.phone}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(member.savingsBalance)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(member.shareCapital)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${member.activeLoans > 0 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                        {member.activeLoans}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[member.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/members/${member.id}`}
                          className="text-xs text-emerald-600 font-medium hover:underline"
                        >
                          View
                        </Link>
                        <Link
                          href={`/members/${member.id}/edit`}
                          className="text-xs text-slate-500 font-medium hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
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
