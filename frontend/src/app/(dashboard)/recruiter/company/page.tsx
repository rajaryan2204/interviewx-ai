"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Save } from "lucide-react";

import { getCompany, updateCompany } from "@/lib/recruiter-api";


export default function RecruiterCompanyPage() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCompany()
      .then((co) => {
        setName(co.name);
        setDomain(co.domain || "");
        setDescription(co.description || "");
      })
      .catch((err) => console.error("Error loading company profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateCompany({
        name,
        domain: domain || null,
        description: description || null,
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-neutral-400">Loading company profile details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <Briefcase className="h-7 w-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Company Profile</h1>
          <p className="text-sm text-neutral-500">Configure parameters for candidate assessment branding</p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
              Company Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2.5 px-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
              Corporate Domain
            </label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., saasify.io"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2.5 px-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
              Description / Context info
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide domain details or tech stack overview to help AI context match mock evaluations..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2.5 px-3 text-sm text-neutral-850 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500 resize-none"
            />
          </div>

          {success && (
            <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Company details updated successfully.
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 active:scale-95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving Changes…" : "Save Company Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
