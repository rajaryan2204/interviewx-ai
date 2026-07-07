"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Filter,
  Search,
  Zap,
} from "lucide-react";

import { createSession, listQuestions, listSessions } from "@/lib/coding-api";
import UpgradeModal from "@/components/UpgradeModal";
import type {
  CodingQuestionListItem,
  CodingSessionDetail,
  Difficulty,
  Language,
} from "@/types/coding";

const DIFFICULTY_BADGE = {
  easy: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  hard: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
};

const DIFFICULTIES: Array<{ value: Difficulty | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const DEFAULT_LANGUAGE: Language = "python";

export default function CodingDashboardPage() {
  const [questions, setQuestions] = useState<CodingQuestionListItem[]>([]);
  const [sessions, setSessions] = useState<CodingSessionDetail[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "all">("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [starting, setStarting] = useState<number | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    Promise.all([listQuestions(), listSessions()])
      .then(([qs, ss]) => {
        setQuestions(qs);
        setSessions(ss);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(questions.map((q) => q.category));
    return ["all", ...Array.from(cats).sort()];
  }, [questions]);

  const filtered = useMemo(
    () =>
      questions.filter((q) => {
        const matchSearch =
          !search ||
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          q.category.toLowerCase().includes(search.toLowerCase()) ||
          q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
        const matchDiff = diffFilter === "all" || q.difficulty === diffFilter;
        const matchCat = catFilter === "all" || q.category === catFilter;
        return matchSearch && matchDiff && matchCat;
      }),
    [questions, search, diffFilter, catFilter]
  );

  const solved = useMemo(
    () =>
      new Set(
        sessions
          .filter((s) => s.status === "completed")
          .map((s) => s.question_id)
      ),
    [sessions]
  );

  const inProgress = useMemo(
    () =>
      new Set(
        sessions
          .filter((s) => s.status === "in_progress")
          .map((s) => s.question_id)
      ),
    [sessions]
  );

  const handleStart = async (questionId: number) => {
    setStarting(questionId);
    try {
      const session = await createSession(questionId, DEFAULT_LANGUAGE);
      router.push(`/coding/${session.id}`);
    } catch (err: any) {
      const errorMsg = err?.message || "";
      if (errorMsg.includes("Premium") || errorMsg.includes("upgrade") || errorMsg.includes("limit")) {
        setIsUpgradeOpen(true);
      } else {
        // If session creation fails, try navigating to existing
        const existing = sessions.find((s) => s.question_id === questionId);
        if (existing) {
          router.push(`/coding/${existing.id}`);
        } else {
          alert(errorMsg || "An error occurred starting this coding session.");
        }
      }
    } finally {
      setStarting(null);
    }
  };

  const stats = {
    total: questions.length,
    solved: solved.size,
    easy: questions.filter((q) => q.difficulty === "easy" && solved.has(q.id)).length,
    medium: questions.filter((q) => q.difficulty === "medium" && solved.has(q.id)).length,
    hard: questions.filter((q) => q.difficulty === "hard" && solved.has(q.id)).length,
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 ring-1 ring-neutral-200 dark:ring-white/10">
          <Code2 className="h-7 w-7 text-blue-500 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Coding Practice</h1>
          <p className="text-sm text-neutral-500 dark:text-white/50">
            LeetCode-style problems with AI review
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Solved",
              value: `${stats.solved}/${stats.total}`,
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />,
              color: "from-emerald-500/10",
            },
            {
              label: "Easy",
              value: stats.easy,
              icon: <Zap className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />,
              color: "from-emerald-500/10",
            },
            {
              label: "Medium",
              value: stats.medium,
              icon: <Zap className="h-5 w-5 text-amber-500 dark:text-amber-400" />,
              color: "from-amber-500/10",
            },
            {
              label: "Hard",
              value: stats.hard,
              icon: <Zap className="h-5 w-5 text-rose-500 dark:text-rose-400" />,
              color: "from-rose-500/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border border-neutral-200 dark:border-white/8 bg-neutral-50/50 dark:bg-neutral-900/30 bg-gradient-to-br ${stat.color} to-transparent p-4`}
            >
              <div className="flex items-center gap-2 mb-1">
                {stat.icon}
                <span className="text-xs text-neutral-500 dark:text-white/50">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 p-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDiffFilter(d.value)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                diffFilter === d.value
                  ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-0"
                  : "text-neutral-500 dark:text-white/50 hover:text-neutral-800 dark:hover:text-white/80"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-white/50">
          <Filter className="h-4 w-4" />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] py-2 pl-2 pr-6 text-sm text-neutral-750 dark:text-white/80 outline-none focus:border-blue-500/50"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-neutral-200/50 dark:bg-white/5"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BookOpen className="h-12 w-12 text-neutral-300 dark:text-white/10" />
            <p className="text-neutral-500 dark:text-white/40">No questions match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((q, idx) => {
              const isSolved = solved.has(q.id);
              const isActive = inProgress.has(q.id);
              const existingSession = sessions.find(
                (s) => s.question_id === q.id
              );
              return (
                <div
                  key={q.id}
                  className={`group flex items-center gap-4 rounded-2xl border p-4 transition hover:border-neutral-350 dark:hover:border-white/15 hover:bg-neutral-150/30 dark:hover:bg-white/5 ${
                    isSolved
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-neutral-200 dark:border-white/8 bg-white dark:bg-white/2"
                  }`}
                >
                  {/* Index / check */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 text-xs font-semibold text-neutral-450 dark:text-white/30">
                    {isSolved ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Title + category */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition">
                        {q.title}
                      </span>
                      {isActive && !isSolved && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-neutral-500 dark:text-white/40">{q.category}</span>
                      {q.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 text-xs text-neutral-500 dark:text-white/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty + complexity */}
                  <div className="hidden sm:flex items-center gap-3">
                    {q.optimal_time_complexity && (
                      <span className="font-mono text-xs text-neutral-400 dark:text-white/30">
                        {q.optimal_time_complexity}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        DIFFICULTY_BADGE[q.difficulty]
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  {/* Action */}
                  {existingSession ? (
                    <Link
                      href={`/coding/${existingSession.id}`}
                      className="flex items-center gap-1 rounded-xl bg-neutral-100 dark:bg-white/8 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-white/70 transition hover:bg-neutral-200 dark:hover:bg-white/15 hover:text-neutral-900 dark:hover:text-white shrink-0"
                    >
                      {isSolved ? "Review" : "Continue"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleStart(q.id)}
                      disabled={starting === q.id}
                      className="flex items-center gap-1 rounded-xl bg-blue-600/90 hover:bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 shrink-0"
                    >
                      {starting === q.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                      ) : (
                        <>
                          Start
                          <ChevronRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
