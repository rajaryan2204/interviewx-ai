"use client";

import React, { useEffect, useState } from "react";
import { Shield, Trash } from "lucide-react";

import { adminListUsers, adminUpdateUser, adminDeleteUser } from "@/lib/recruiter-api";
import type { UserAdminResponse } from "@/types/recruiter";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListUsers()
      .then(setUsers)
      .catch((err) => console.error("Error loading system users:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const updated = await adminUpdateUser(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusToggle = async (userId: number, currentActive: boolean) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    try {
      const updated = await adminUpdateUser(userId, {
        role: targetUser.role,
        is_active: !currentActive,
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action is permanent!")) return;
    try {
      await adminDeleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <Shield className="h-7 w-7 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">User Role Management</h1>
          <p className="text-sm text-neutral-500">Configure permission access levels and status controls</p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-850" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-12">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs font-semibold">
                  <th className="pb-3">User Profile</th>
                  <th className="pb-3">Permissions Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Joined Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-neutral-100 dark:border-neutral-900 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20"
                  >
                    <td className="py-4">
                      <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {u.full_name || "New System User"}
                        </p>
                        <p className="text-xs text-neutral-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-1.5 px-2.5 text-xs text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="candidate">Candidate</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleStatusToggle(u.id, u.is_active)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.is_active
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {u.is_active ? "Active" : "Blocked"}
                      </button>
                    </td>
                    <td className="py-4 text-xs text-neutral-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition inline-flex items-center gap-1"
                        title="Delete account"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
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
