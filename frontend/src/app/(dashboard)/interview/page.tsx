"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  History,
  Briefcase,
  Clock,
  Settings2,
  ChevronRight,
  PlusCircle,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";

interface ResumeSummary {
  id: number;
  file_name: string;
  uploaded_at: string;
}

interface InterviewSummary {
  id: number;
  job_role: string;
  company: string | null;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  question_count: number;
  duration_minutes: number;
  language: string;
  status: string;
  created_at: string;
}

export default function InterviewDashboard() {
  const router = useRouter();

  // Setup Form States
  const [jobRole, setJobRole] = useState("");
  const [company, setCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid-Level");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [language, setLanguage] = useState("English");
  const [resumeId, setResumeId] = useState<number | "">("");

  // Data Lists
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [history, setHistory] = useState<InterviewSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Load setup dependencies and history lists
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      setError(null);
      try {
        // Fetch resumes
        const resResumes = await apiFetch("/api/resume/history");
        if (resResumes.ok) {
          const resumesData = await resResumes.json();
          setResumes(resumesData);
        }

        // Fetch interviews
        const resHistory = await apiFetch("/api/interview/history");
        if (resHistory.ok) {
          const historyData = await resHistory.json();
          setHistory(historyData);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load dashboard data.");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  async function handleStartInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!jobRole.trim()) {
      setError("Please specify a target Job Role.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      job_role: jobRole,
      company: company || null,
      experience_level: experienceLevel,
      interview_type: interviewType,
      difficulty: difficulty,
      question_count: questionCount,
      duration_minutes: durationMinutes,
      language: language,
      resume_id: resumeId || null,
    };

    try {
      const response = await apiFetch("/api/interview/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to initialize interview.");
      }

      const data = await response.json();
      // Route directly to the active interview board session
      router.push(`/interview/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("limit") || msg.includes("Upgrade") || msg.includes("limit reached")) {
        setIsUpgradeOpen(true);
      } else {
        setError(msg || "Failed to start interview session.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-6 lg:p-10 select-none">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-neutral-800 dark:text-neutral-200" />
            AI Mock Interview Setup
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Configure custom parameters to simulate premium, interactive technical, coding, or behavioral evaluations.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Config Setup Card */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <Settings2 className="h-5 w-5 text-neutral-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Configuration</h2>
            </div>

            <form onSubmit={handleStartInterview} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Job Role */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Job Role</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                    required
                  />
                </div>

                {/* Target Company */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Target Company (Optional)</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Netflix"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  />
                </div>

                {/* Experience Level */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  >
                    <option>Entry-Level</option>
                    <option>Mid-Level</option>
                    <option>Senior</option>
                    <option>Lead / Staff</option>
                  </select>
                </div>

                {/* Interview Type */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  >
                    <option>HR</option>
                    <option>Technical</option>
                    <option>Behavioural</option>
                    <option>Coding</option>
                    <option>DSA</option>
                    <option>System Design</option>
                    <option>Company Specific</option>
                    <option>Custom Interview</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                {/* Resume Selection */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Target Resume Context</label>
                  <select
                    value={resumeId}
                    onChange={(e) => setResumeId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  >
                    <option value="">No Resume Context (Generic)</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.file_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Count */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Number of Questions</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  >
                    <option value={3}>3 Questions (Express)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Detailed)</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Duration Limit</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  >
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                  </select>
                </div>

                {/* Language */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>German</option>
                    <option>French</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto px-8 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>Initializing Session...</>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Start Mock Run
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* History Panel */}
          <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm p-6 space-y-6 flex flex-col h-[520px]">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <History className="h-5 w-5 text-neutral-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Past Runs</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingData ? (
                <div className="h-full flex items-center justify-center text-sm text-neutral-500">
                  Loading mock history...
                </div>
              ) : history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <PlusCircle className="h-10 w-10 text-neutral-300 mb-2" />
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No mock runs found</p>
                  <p className="text-xs text-neutral-400 mt-1">Configure parameters above to start.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.status === "completed") {
                        router.push(`/interview/${item.id}/feedback`);
                      } else {
                        router.push(`/interview/${item.id}`);
                      }
                    }}
                    className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white max-w-[200px] truncate">
                        {item.job_role}
                      </p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.interview_type} • {item.difficulty}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          item.status === "completed"
                            ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
                            : item.status === "paused"
                            ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400"
                            : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                      <ChevronRight className="h-4 w-4 text-neutral-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        title="Mock Interviews Limit Reached"
        description="Free users are limited to 1 mock interview per month. Please upgrade to the Basic or Pro plan to unlock unlimited simulated sessions!"
      />
    </div>
  );
}
