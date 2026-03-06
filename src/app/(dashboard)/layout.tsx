"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const checkDone = useRef(false);

  useEffect(() => {
    // Prevent multiple checks
    if (checkDone.current) return;
    checkDone.current = true;

    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem("sacco_auth");
    
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
