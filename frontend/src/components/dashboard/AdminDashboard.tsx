"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Cpu,
  Database,
  FileText,
  Settings as SettingsIcon,
  Shield,
  ShieldAlert,
  Terminal,
  TrendingUp,
  Users,
  MessageSquare,
  Star,
} from "lucide-react";

import {
  getPlatformAnalytics,
  adminListLogs,
} from "@/lib/recruiter-api";
import { apiFetch } from "@/lib/api";
import type {
  PlatformAnalyticsResponse,
  AuditLogResponse,
} from "@/types/recruiter";

export default function AdminDashboardView() {
  const [analytics, setAnalytics] = useState<PlatformAnalyticsResponse | null>(null);
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPlatformAnalytics(),
      adminListLogs(),
      apiFetch("/api/productivity/admin/feedback").then(res => res.json())
    ])
      .then(([an, lo, fb]) => {
        setAnalytics(an);
        setLogs(lo);
        setFeedbacks(fb);
      })
      .catch((err) => console.error("Error loading admin dashboard stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-neutral-400">Loading admin panel stats…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-300 dark:to-neutral-500">
          Admin Control Center
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Monitor system load, configuration parameters, audit trails, and platform-wide analytics
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Registered Candidates",
            value: analytics.total_candidates,
            icon: <Users className="h-5 w-5 text-indigo-500" />,
            bg: "from-indigo-500/10",
          },
          {
            label: "Total Recruiter Partners",
            value: analytics.total_recruiters,
            icon: <Shield className="h-5 w-5 text-emerald-500" />,
            bg: "from-emerald-500/10",
          },
          {
            label: "Total Completed Interviews",
            value: analytics.total_interviews_completed,
            icon: <FileText className="h-5 w-5 text-amber-500" />,
            bg: "from-amber-500/10",
          },
          {
            label: "System Average Score Rating",
            value: `${analytics.average_score.toFixed(1)} / 10`,
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

      {/* Grid: Left Logs & Flags, Right Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Audit Log & Feature Flags */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audit Logs */}
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-neutral-400" />
                Recent System Audits
              </h2>
              <a
                href="/admin/logs"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all logs
              </a>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-neutral-400 py-10 text-center">
                No system logs recorded yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {logs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-900 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-mono font-bold text-neutral-800 dark:text-neutral-200 uppercase">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-neutral-500">
                        By: {log.user_email || "System"} | IP: {log.ip_address}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Candidate Feedback Reviews */}
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 mt-6">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-violet-500" />
              Candidate Feedbacks
            </h2>
            {feedbacks.length === 0 ? (
              <p className="text-sm text-neutral-400 py-10 text-center">
                No platform feedback submitted yet.
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-900 space-y-2 text-xs text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-850 dark:text-neutral-200">
                        {fb.user_name}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{fb.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {fb.comment}
                    </p>
                    <p className="text-[10px] text-neutral-450 dark:text-neutral-500 pt-1 text-right">
                      {new Date(fb.created_at).toLocaleDateString()} at {new Date(fb.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
                Avg CPU Load
              </span>
              <p className="text-2xl font-bold font-mono">{(analytics.system_load * 100).toFixed(0)}%</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-500" />
                DB Engine
              </span>
              <p className="text-2xl font-bold">SQLite 3</p>
            </div>
          </div>
        </div>

        {/* Right: Settings / Feature Toggles Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-neutral-400" />
              Active LLM Providers
            </h2>
            <div className="space-y-3">
              {Object.entries(analytics.provider_configurations).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-900 text-xs"
                >
                  <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                    {key}
                  </span>
                  <span className="font-mono bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-bold">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <a
              href="/admin/settings"
              className="block text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-2 border-t border-neutral-100 dark:border-neutral-800"
            >
              Configure Application Settings →
            </a>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-3">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">
              Administrative Shortcuts
            </h2>
            <a
              href="/admin/users"
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition text-sm font-semibold text-neutral-700 dark:text-neutral-300"
            >
              <span>Manage User Roles</span>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </a>
            <a
              href="/admin/settings"
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition text-sm font-semibold text-neutral-700 dark:text-neutral-300"
            >
              <span>System Settings & Feature Flags</span>
              <SettingsIcon className="h-4 w-4 text-indigo-500" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
