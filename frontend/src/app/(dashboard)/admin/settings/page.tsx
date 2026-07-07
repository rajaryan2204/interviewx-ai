"use client";

import React, { useEffect, useState } from "react";
import { Save, Settings as SettingsIcon } from "lucide-react";

import { adminListSettings, adminUpdateSetting } from "@/lib/recruiter-api";
import type { AdminSettingsResponse } from "@/types/recruiter";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form edit states
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingDesc, setEditingDesc] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    adminListSettings()
      .then(setSettings)
      .catch((err) => console.error("Error loading system settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleEditInit = (setting: AdminSettingsResponse) => {
    setEditingKey(setting.key);
    setEditingValue(JSON.stringify(setting.value, null, 2));
    setEditingDesc(setting.description || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;

    setSaveLoading(true);
    try {
      const parsedValue = JSON.parse(editingValue);
      const updated = await adminUpdateSetting(editingKey, {
        value: parsedValue,
        description: editingDesc || undefined,
      });

      setSettings((prev) => prev.map((s) => (s.key === editingKey ? updated : s)));
      setEditingKey(null);
    } catch {
      alert("Invalid JSON format. Please verify your settings object.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <SettingsIcon className="h-7 w-7 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">System Parameters & Config</h1>
          <p className="text-sm text-neutral-500">Configure global engines routing and application feature flags</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left List Card */}
        <div className="md:col-span-2 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 p-6 space-y-4">
          <h2 className="text-lg font-bold text-neutral-850 dark:text-white">
            Configurations Key List
          </h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-850" />
              ))}
            </div>
          ) : settings.length === 0 ? (
            <p className="text-sm text-neutral-400 py-6 text-center">No settings configured.</p>
          ) : (
            <div className="space-y-4">
              {settings.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-neutral-100 dark:border-neutral-900 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-bold text-sm text-neutral-800 dark:text-neutral-200">
                        {s.key}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">{s.description}</p>
                    </div>
                    <button
                      onClick={() => handleEditInit(s)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Edit Config
                    </button>
                  </div>
                  <pre className="rounded-lg bg-black/35 p-3 font-mono text-[10px] text-indigo-300 overflow-x-auto max-h-40">
                    {JSON.stringify(s.value, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Editor Card */}
        <div className="md:col-span-1">
          {editingKey ? (
            <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-850 dark:text-white">
                JSON Settings Editor
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1">
                    Key Profile
                  </label>
                  <p className="text-sm font-mono text-indigo-400 font-bold">{editingKey}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                    Description
                  </label>
                  <input
                    value={editingDesc}
                    onChange={(e) => setEditingDesc(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-1.5 px-3 text-xs text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                    Value (JSON Config)
                  </label>
                  <textarea
                    rows={8}
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 font-mono text-[11px] text-neutral-850 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    className="flex-1 rounded-xl py-2 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saveLoading ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-850 p-6 text-center text-neutral-400">
              <p className="text-xs">Select a config key on the left to activate the JSON editor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
