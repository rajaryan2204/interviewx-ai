"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Plus, Trash } from "lucide-react";

import { listTemplates, createTemplate, deleteTemplate } from "@/lib/recruiter-api";
import type { InterviewTemplateResponse } from "@/types/recruiter";

export default function RecruiterTemplatesPage() {
  const [templates, setTemplates] = useState<InterviewTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [expLevel, setExpLevel] = useState("Mid-level");
  const [duration, setDuration] = useState(30);
  const [questionsText, setQuestionsText] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch((err) => console.error("Error loading templates:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Parse questions line-by-line
    const parsedQuestions = questionsText
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .map((q) => ({ question: q }));

    if (parsedQuestions.length === 0) {
      setError("Please add at least one question to the template list.");
      return;
    }

    try {
      const created = await createTemplate({
        title,
        job_role: jobRole,
        experience_level: expLevel,
        duration_minutes: duration,
        question_count: parsedQuestions.length,
        questions: parsedQuestions,
      });

      setTemplates((prev) => [...prev, created]);
      setSuccess(true);
      setTitle("");
      setJobRole("");
      setQuestionsText("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create template.";
      setError(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <BookOpen className="h-7 w-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Interview Templates</h1>
          <p className="text-sm text-neutral-500">Configure standard assessment question structures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Panel: Builder */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-850 dark:text-white">
              Create New Template
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                  Template Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Staff Systems Designer"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                  Job Role Match
                </label>
                <input
                  required
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Backend Architect"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                    Difficulty Preset
                  </label>
                  <select
                    value={expLevel}
                    onChange={(e) => setExpLevel(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-2.5 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option>Junior</option>
                    <option>Mid-level</option>
                    <option>Senior</option>
                    <option>Lead / Principal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={120}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                  Questions List (one per line)
                </label>
                <textarea
                  required
                  rows={5}
                  value={questionsText}
                  onChange={(e) => setQuestionsText(e.target.value)}
                  placeholder="Design a key value cache...&#10;Explain cache invalidation..."
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm text-neutral-850 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Template created successfully!
                </p>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                <Plus className="h-4 w-4" />
                Add Template
              </button>
            </form>
          </div>
        </div>

        {/* Right list panel */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-850 dark:text-white">
              Active Templates
            </h2>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-850" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-12">
                No templates configured yet. Use the builder on the left.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-xl border border-neutral-100 dark:border-neutral-900 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20 relative"
                  >
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="absolute top-3 right-3 p-1 text-neutral-450 hover:text-rose-500 transition"
                      title="Delete template"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="font-bold text-neutral-850 dark:text-neutral-200 pr-6">
                        {template.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Role: {template.job_role} | {template.experience_level}
                      </p>
                    </div>
                    <div className="border-t border-neutral-100 dark:border-neutral-900 pt-2 text-xs space-y-1 text-neutral-600 dark:text-neutral-450">
                      <p className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
                        Structured Questions ({template.questions.length})
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        {template.questions.slice(0, 3).map((q, idx) => (
                          <li key={idx} className="truncate">
                            {q.question}
                          </li>
                        ))}
                        {template.questions.length > 3 && (
                          <li className="italic text-neutral-400">
                            + {template.questions.length - 3} more questions
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
