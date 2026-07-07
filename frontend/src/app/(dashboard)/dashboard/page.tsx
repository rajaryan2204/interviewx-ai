"use client";

import React from "react";

import { useAuth } from "@/context/AuthContext";
import CandidateDashboardView from "@/components/dashboard/CandidateDashboard";
import RecruiterDashboardView from "@/components/dashboard/RecruiterDashboard";
import AdminDashboardView from "@/components/dashboard/AdminDashboard";

export default function DashboardHomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-neutral-400">Verifying session profile…</p>
        </div>
      </div>
    );
  }

  if (user?.role === "admin") {
    return <AdminDashboardView />;
  }

  if (user?.role === "recruiter") {
    return <RecruiterDashboardView />;
  }

  // Default candidate landing dashboard
  return <CandidateDashboardView />;
}
