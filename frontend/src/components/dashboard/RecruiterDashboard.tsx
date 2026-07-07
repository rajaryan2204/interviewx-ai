"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Mail,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  listAssignments,
  createAssignment,
  getCompany,
  listTemplates,
} from "@/lib/recruiter-api";
import type {
  CandidateAssignmentResponse,
  CompanyResponse,
  InterviewTemplateResponse,
} from "@/types/recruiter";

export default function RecruiterDashboardView() {
  const [assignments, setAssignments] = useState<CandidateAssignmentResponse[]>([]);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [templates, setTemplates] = useState<InterviewTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite candidate state
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedFlow, setSelectedFlow] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([listAssignments(), getCompany(), listTemplates()])
      .then(([as, co, te]) => {
        setAssignments(as);
        setCompany(co);
        setTemplates(te);
      })
      .catch((err) => console.error("Error loading recruiter data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !selectedFlow) return;

    setInviteLoading(true);
    setInviteMsg(null);
    try {
      await createAssignment(inviteEmail, Number(selectedFlow));
      setInviteMsg({
        type: "success",
        text: `Candidate ${inviteEmail} invited successfully!`,
      });
      setInviteEmail("");
      // Refresh assignments
      const updated = await listAssignments();
      setAssignments(updated);
      setTimeout(() => setInviteModalOpen(false), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to invite candidate.";
      setInviteMsg({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const metrics = {
    totalAssigned: assignments.length,
    completed: assignments.filter((a) => a.status === "completed").length,
    pending: assignments.filter((a) => a.status === "invited").length,
    avgScore:
      assignments.filter((a) => a.score != null).reduce((acc, a) => acc + (a.score || 0), 0) /
        assignments.filter((a) => a.score != null).length || 0.0,
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-neutral-400">Loading recruiter portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-300 dark:to-neutral-500">
            Recruiter Workspace
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage templates, schedule assessments, and evaluate candidate performance for {company?.name}
          </p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Schedule Assessment
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Assigned Candidates",
            value: metrics.totalAssigned,
            icon: <Users className="h-5 w-5 text-violet-500" />,
            bg: "from-violet-500/10",
          },
          {
            label: "Completed Interviews",
            value: metrics.completed,
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
            bg: "from-emerald-500/10",
          },
          {
            label: "Pending Invitations",
            value: metrics.pending,
            icon: <Calendar className="h-5 w-5 text-amber-500" />,
            bg: "from-amber-500/10",
          },
          {
            label: "Average Score Rating",
            value: `${metrics.avgScore.toFixed(1)} / 10`,
            icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
            bg: "from-blue-500/10",
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-gradient-to-br ${metric.bg} to-transparent p-5 shadow-sm`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              {metric.icon}
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {metric.label}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-neutral-850 dark:text-white">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid: Left Candidate Table, Right Templates and Company */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Candidate Assignments (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-white mb-4">
              Invited Candidates & Status
            </h2>
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-neutral-400">
                <Users className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                <p className="text-sm">No assignments active at the moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs font-semibold">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Flow Assigned</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Overall Rating</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className="border-b border-neutral-100 dark:border-neutral-900 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20"
                      >
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {assignment.user_full_name || "Invited Candidate"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {assignment.user_email}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 text-neutral-600 dark:text-neutral-400">
                          {assignment.interview_title}
                        </td>
                        <td className="py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              assignment.status === "completed"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : assignment.status === "in_progress"
                                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </td>
                        <td className="py-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {assignment.score != null ? `${assignment.score.toFixed(1)} / 10` : "—"}
                        </td>
                        <td className="py-4 text-right">
                          <a
                            href={`/recruiter/candidates/${assignment.user_id}`}
                            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            View Reports →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels (Col Span 1): Templates list */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-white">
                Interview Templates
              </h2>
              <span className="text-xs text-neutral-500">
                {templates.length} Active
              </span>
            </div>
            <div className="space-y-3">
              {templates.slice(0, 3).map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-neutral-100 dark:border-neutral-900 p-4 space-y-1.5"
                >
                  <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                    {template.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{template.job_role}</span>
                    <span>{template.duration_minutes} mins</span>
                  </div>
                </div>
              ))}
              <a
                href="/recruiter/templates"
                className="block text-center text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline pt-2"
              >
                Manage Templates →
              </a>
            </div>
          </div>

          {/* Company details */}
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-white">
              Company Context
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
                {company?.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-neutral-800 dark:text-neutral-200">
                  {company?.name}
                </p>
                <p className="text-xs text-neutral-500">{company?.domain}</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
              {company?.description || "No description set yet."}
            </p>
            <a
              href="/recruiter/company"
              className="block text-center text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline pt-2"
            >
              Update Settings →
            </a>
          </div>
        </div>
      </div>

      {/* Schedule Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
              Invite Candidate
            </h3>
            <p className="text-xs text-neutral-500">
              Schedule a technical evaluation flow for a candidate profile. They will receive access credentials.
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Candidate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2.5 pl-9 pr-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Interview Flow Template
                </label>
                <select
                  required
                  value={selectedFlow}
                  onChange={(e) => setSelectedFlow(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2.5 px-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="">Select a template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.job_role})
                    </option>
                  ))}
                </select>
              </div>

              {inviteMsg && (
                <p
                  className={`rounded-xl px-3 py-2 text-xs font-medium ${
                    inviteMsg.type === "success"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {inviteMsg.text}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {inviteLoading ? "Sending invite…" : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
