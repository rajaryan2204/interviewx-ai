"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Search, Users } from "lucide-react";

import { listAssignments, downloadReportUrl } from "@/lib/recruiter-api";
import type { CandidateAssignmentResponse } from "@/types/recruiter";

export default function RecruiterCandidatesPage() {
  const [assignments, setAssignments] = useState<CandidateAssignmentResponse[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAssignments()
      .then(setAssignments)
      .catch((err) => console.error("Error loading candidate assignments:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter((a) => {
    const matchSearch =
      !search ||
      (a.user_full_name && a.user_full_name.toLowerCase().includes(search.toLowerCase())) ||
      (a.user_email && a.user_email.toLowerCase().includes(search.toLowerCase())) ||
      (a.interview_title && a.interview_title.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <Users className="h-7 w-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assigned Candidates</h1>
          <p className="text-sm text-neutral-500">Track and review candidate performance and test results</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name, email, or flow title..."
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 py-2 pl-9 pr-3 text-sm text-neutral-850 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 py-2 px-3 text-sm text-neutral-850 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="all">All Statuses</option>
          <option value="invited">Invited</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-850" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-400">
            <p>No candidates found matching the active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs font-semibold">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Flow Title</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Assigned Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-neutral-100 dark:border-neutral-900 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20"
                  >
                    <td className="py-4 font-semibold text-neutral-800 dark:text-neutral-200">
                      <div>
                        <p>{a.user_full_name || "Invited Candidate"}</p>
                        <p className="text-xs font-normal text-neutral-500">{a.user_email}</p>
                      </div>
                    </td>
                    <td className="py-4 text-neutral-600 dark:text-neutral-400">{a.interview_title}</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          a.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : a.status === "in_progress"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-4 font-mono font-bold">
                      {a.score != null ? `${a.score.toFixed(1)} / 10` : "—"}
                    </td>
                    <td className="py-4 text-xs text-neutral-400">
                      {new Date(a.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right space-x-3">
                      <Link
                        href={`/recruiter/candidates/${a.user_id}`}
                        className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        View Reports
                      </Link>
                      {a.status === "completed" && (
                        <a
                          href={downloadReportUrl(a.user_id)}
                          download={`report_${a.user_id}.txt`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800"
                          title="Download report summary"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
