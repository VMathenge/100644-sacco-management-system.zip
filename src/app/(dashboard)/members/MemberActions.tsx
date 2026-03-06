"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MemberActionsProps {
  memberId: number;
  memberName: string;
}

export default function MemberActions({ memberId, memberName }: MemberActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete member");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Failed to delete member");
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/members/${memberId}`}
        className="text-xs text-emerald-600 font-medium hover:underline"
      >
        View
      </Link>
      <Link
        href={`/members/${memberId}/edit`}
        className="text-xs text-slate-500 font-medium hover:underline"
      >
        Edit
      </Link>
      <button
        onClick={() => setShowDelete(true)}
        className="text-xs text-red-500 font-medium hover:underline"
      >
        Delete
      </button>

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Delete Member</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <strong>{memberName}</strong>? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
