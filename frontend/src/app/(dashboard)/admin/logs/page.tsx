"use client";

import React, { useEffect, useState } from "react";
import { Search, Terminal } from "lucide-react";

import { adminListLogs } from "@/lib/recruiter-api";
import type { AuditLogResponse } from "@/types/recruiter";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListLogs()
      .then(setLogs)
      .catch((err) => console.error("Error loading audit logs:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase())) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(search.toLowerCase())) ||
      JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 font-sans">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <Terminal className="h-7 w-7 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Secure Audit Trails</h1>
          <p className="text-sm text-neutral-500">Trace and search system configuration adjustments and permission rollouts</p>
        </div>
      </div>

      {/* Filter search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action name, email, IP address, or JSON content payload..."
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 py-2.5 pl-9 pr-3 text-sm text-neutral-850 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />
      </div>

      {/* Table Logs viewer */}
      <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-850" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-16">No audit records correspond to search query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Action Name</th>
                  <th className="pb-3">Operator</th>
                  <th className="pb-3">IP Address</th>
                  <th className="pb-3">Metadata / Details Payload</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-neutral-100 dark:border-neutral-900 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20"
                  >
                    <td className="py-3 text-neutral-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-bold text-neutral-800 dark:text-neutral-200 uppercase">
                      {log.action}
                    </td>
                    <td className="py-3 text-neutral-600 dark:text-neutral-350">
                      {log.user_email || "System"}
                    </td>
                    <td className="py-3 text-neutral-500">{log.ip_address || "—"}</td>
                    <td className="py-3">
                      <pre className="max-w-[400px] truncate bg-black/10 dark:bg-black/30 p-1.5 rounded border border-neutral-100 dark:border-neutral-900 text-[10px] text-indigo-400">
                        {JSON.stringify(log.details)}
                      </pre>
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
