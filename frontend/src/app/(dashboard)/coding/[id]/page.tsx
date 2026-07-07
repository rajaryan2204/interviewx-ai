"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Play,
  Save,
  Send,
  Terminal,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import UpgradeModal from "@/components/UpgradeModal";
import {
  getSession,
  listSubmissions,
  runCode,
  saveSnapshot,
  submitCode,
} from "@/lib/coding-api";
import type {
  CodeRunResponse,
  CodingSessionDetail,
  CodeSubmissionSummary,
  Language,
} from "@/types/coding";
import AIReviewPanel from "@/components/coding/AIReviewPanel";
import CodeEditor from "@/components/coding/CodeEditor";
import ExecutionResult from "@/components/coding/ExecutionResult";
import QuestionPanel from "@/components/coding/QuestionPanel";
import TestCasePanel from "@/components/coding/TestCasePanel";

type RightTab = "testcases" | "output" | "review" | "history";

const VERDICT_BADGE: Record<string, string> = {
  accepted: "text-emerald-400 bg-emerald-500/15",
  wrong_answer: "text-rose-400 bg-rose-500/15",
  runtime_error: "text-orange-400 bg-orange-500/15",
  time_limit_exceeded: "text-yellow-400 bg-yellow-500/15",
  compilation_error: "text-purple-400 bg-purple-500/15",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CodingWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);

  const [session, setSession] = useState<CodingSessionDetail | null>(null);
  const [code, setCode] = useState("");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("python");
  const [loading, setLoading] = useState(true);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Right panel
  const [activeTab, setActiveTab] = useState<RightTab>("testcases");
  const [runResult, setRunResult] = useState<CodeRunResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionId, setLastSubmissionId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<CodeSubmissionSummary[]>([]);

  // Left panel collapse
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  // Auto-save
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );

  // Load session
  useEffect(() => {
    getSession(sessionId)
      .then((s) => {
        setSession(s);
        setCode(s.code_snapshot ?? s.question.default_code?.[s.language] ?? "");
        setLanguage(s.language as Language);
        setElapsed(s.timer_seconds_elapsed);
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-save on code change
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      setSaveStatus("unsaved");
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await saveSnapshot(sessionId, newCode, language, elapsed);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("unsaved");
        }
      }, 1500);
    },
    [sessionId, language, elapsed]
  );

  // Language change
  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      if (session) {
        const stub = session.question.default_code?.[lang];
        if (stub && !code.trim()) setCode(stub);
      }
    },
    [session, code]
  );

  // Run
  const handleRun = useCallback(
    async (customInput?: string) => {
      setIsRunning(true);
      setActiveTab("output");
      try {
        const result = await runCode(sessionId, code, language, customInput);
        setRunResult(result);
        setLastSubmissionId(result.submission_id);
      } catch (e) {
        console.error(e);
      } finally {
        setIsRunning(false);
      }
    },
    [sessionId, code, language]
  );

  // Submit
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setActiveTab("output");
    try {
      const result = await submitCode(sessionId, code, language);
      setRunResult(result);
      setLastSubmissionId(result.submission_id);
      // Refresh submissions list
      const subs = await listSubmissions(sessionId);
      setSubmissions(subs);
      if (result.verdict === "accepted") {
        setSession((prev) => (prev ? { ...prev, status: "completed" } : prev));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, code, language]);

  // Load next unsolved question
  const [loadingNext, setLoadingNext] = useState(false);
  const handleNextChallenge = useCallback(async () => {
    setLoadingNext(true);
    try {
      // 1. Fetch all questions
      const qRes = await apiFetch("/api/coding/questions");
      const questions = qRes.ok ? await qRes.json() : [];

      // 2. Fetch all user sessions
      const sRes = await apiFetch("/api/coding/sessions");
      const sessions = sRes.ok ? await sRes.json() : [];
      const completedQuestionIds = new Set(
        sessions
          .filter((s: any) => s.status === "completed")
          .map((s: any) => s.question_id)
      );

      // 3. Find the first unsolved question (or any random unsolved one)
      const unsolved = questions.find((q: any) => !completedQuestionIds.has(q.id));
      const targetQuestion = unsolved || (questions.length > 0 ? questions[Math.floor(Math.random() * questions.length)] : null);

      if (!targetQuestion) {
        alert("Congratulations! You have completed all active challenges.");
        return;
      }

      // 4. Create new coding session
      const startRes = await apiFetch("/api/coding/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: targetQuestion.id,
          language: language,
        }),
      });

      if (!startRes.ok) throw new Error("Failed to create new coding session.");
      const nextSession = await startRes.json();
      router.push(`/coding/${nextSession.id}`);
    } catch (e: any) {
      console.error(e);
      const errorMsg = e?.message || "";
      if (errorMsg.includes("Premium") || errorMsg.includes("upgrade") || errorMsg.includes("limit")) {
        setIsUpgradeOpen(true);
      } else {
        alert("Could not load next challenge.");
      }
    } finally {
      setLoadingNext(false);
    }
  }, [language, router]);

  // Load submissions on history tab open
  useEffect(() => {
    if (activeTab === "history") {
      listSubmissions(sessionId).then(setSubmissions).catch(console.error);
    }
  }, [activeTab, sessionId]);

  if (loading || !session) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Loading workspace…</p>
        </div>
      </div>
    );
  }

  const question = session.question;

  const RIGHT_TABS: Array<{ id: RightTab; label: string; icon: React.ReactNode }> = [
    { id: "testcases", label: "Cases", icon: <Play className="h-3.5 w-3.5" /> },
    { id: "output", label: "Output", icon: <Terminal className="h-3.5 w-3.5" /> },
    { id: "review", label: "AI Review", icon: <Bot className="h-3.5 w-3.5" /> },
    { id: "history", label: "History", icon: <History className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-neutral-950 select-none">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/20 px-4 py-2.5">
        <Link
          href="/coding"
          className="flex items-center gap-1 text-xs font-bold text-neutral-450 dark:text-neutral-500 transition hover:text-neutral-900 dark:hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mx-2 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

        <span className="text-sm font-bold text-neutral-900 dark:text-white">{question.title}</span>

        {session.status === "completed" && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Solved
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Save status */}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              saveStatus === "saved"
                ? "text-emerald-500/70"
                : saveStatus === "saving"
                  ? "text-violet-500/70"
                  : "text-neutral-400"
            }`}
          >
            {saveStatus === "saved" ? (
              <span className="flex items-center gap-1">
                <Save className="h-3 w-3" />
                Saved
              </span>
            ) : saveStatus === "saving" ? (
              "Saving…"
            ) : (
              "Unsaved"
            )}
          </span>

          {/* Timer */}
          <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            {formatTime(elapsed)}
          </div>

          {/* Run */}
          <button
            onClick={() => handleRun()}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            Run
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-violet-650 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-violet-550 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Submit
          </button>

          {/* Next Challenge */}
          {session.status === "completed" && (
            <button
              onClick={handleNextChallenge}
              disabled={loadingNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 px-3.5 py-1.5 text-xs font-bold text-white shadow transition-all duration-300 animate-pulse-glow"
            >
              {loadingNext ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              Next Challenge
            </button>
          )}
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Left: Question panel */}
        <div
          className={`flex flex-col border-r border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-950 transition-all duration-200 ${
            leftCollapsed ? "w-0 overflow-hidden" : "w-96 min-w-72 max-w-[35%]"
          }`}
        >
          {!leftCollapsed && session && (
            <QuestionPanel question={session.question} />
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setLeftCollapsed((c) => !c)}
          className="flex w-4 shrink-0 items-center justify-center border-r border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50 dark:bg-neutral-900/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
          title={leftCollapsed ? "Expand question" : "Collapse question"}
        >
          {leftCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Center: Editor */}
        <div className="flex min-w-0 flex-1 flex-col">
          <CodeEditor
            value={code}
            language={language}
            onChange={handleCodeChange}
            onLanguageChange={handleLanguageChange}
          />
        </div>

        {/* Right: Tabs */}
        <div className="flex w-96 min-w-72 max-w-[35%] flex-col border-l border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-950">
          {/* Tab header */}
          <div className="flex border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/20">
            {RIGHT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "border-b-2 border-violet-600 text-violet-600"
                    : "text-neutral-450 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-250"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "testcases" && (
              <TestCasePanel
                question={session.question}
                onRun={handleRun}
                isRunning={isRunning}
              />
            )}
            {activeTab === "output" && (
              <ExecutionResult result={runResult} isLoading={isRunning || isSubmitting} />
            )}
            {activeTab === "review" && (
              <AIReviewPanel submissionId={lastSubmissionId} />
            )}
            {activeTab === "history" && (
              <div className="flex flex-col gap-2 p-4">
                {submissions.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <History className="h-10 w-10 text-neutral-300 dark:text-neutral-800 animate-pulse" />
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold">No submissions yet.</p>
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/20 dark:bg-neutral-900/10 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider capitalize ${
                            VERDICT_BADGE[sub.verdict ?? ""] ?? "text-neutral-500 bg-neutral-100"
                          }`}
                        >
                          {sub.is_run ? "Run" : "Submit"} •{" "}
                          {sub.verdict?.replace(/_/g, " ") ?? "pending"}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(sub.submitted_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-neutral-450 dark:text-neutral-500">
                        <span className="capitalize">{sub.language}</span>
                        <span>
                          {sub.passed_tests}/{sub.total_tests} cases
                        </span>
                        {sub.runtime_ms != null && (
                          <span>{sub.runtime_ms.toFixed(1)}ms</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        title="Coding Practice Locked"
        description="Coding Practice is a Premium feature. Please upgrade to the Pro or Annual Pro plan to solve coding challenges!"
      />
    </div>
  );
}
