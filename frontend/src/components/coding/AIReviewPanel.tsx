"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Gauge,
  Info,
  Sparkles,
  Zap,
} from "lucide-react";

import { generateReview } from "@/lib/coding-api";
import type { CodingFeedback } from "@/types/coding";

const SEVERITY_STYLES = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  major: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  minor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

const SEVERITY_ICON = {
  critical: <AlertCircle className="h-3.5 w-3.5" />,
  major: <AlertCircle className="h-3.5 w-3.5" />,
  minor: <Info className="h-3.5 w-3.5" />,
};

function QualityGauge({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "#10b981"
      : score >= 60
        ? "#f59e0b"
        : "#f43f5e";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {Math.round(score)}
          </span>
          <span className="text-[10px] text-white/40">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-white/50">Code Quality</span>
    </div>
  );
}

interface AIReviewPanelProps {
  submissionId: number | null;
  existingReview?: CodingFeedback | null;
}

export default function AIReviewPanel({
  submissionId,
  existingReview,
}: AIReviewPanelProps) {
  const [review, setReview] = useState<CodingFeedback | null>(
    existingReview ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedBug, setExpandedBug] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!submissionId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateReview(submissionId);
      setReview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate review");
    } finally {
      setLoading(false);
    }
  };

  if (!submissionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <Bot className="h-14 w-14 text-white/10" />
        <p className="text-sm text-white/40">
          Run or submit your code first to request an AI review.
        </p>
      </div>
    );
  }

  if (!review && !loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 ring-1 ring-white/10">
          <Sparkles className="h-10 w-10 text-blue-400" />
        </div>
        <div>
          <p className="font-semibold text-white">AI Code Review</p>
          <p className="mt-1 text-sm text-white/50">
            Get a comprehensive analysis of your code quality, complexity, and
            bugs.
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
            {error}
          </p>
        )}
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          Generate AI Review
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <Bot className="absolute inset-0 m-auto h-7 w-7 text-purple-400" />
        </div>
        <p className="text-sm text-white/50">AI is reviewing your code…</p>
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      {/* Quality Score + Complexities */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-gradient-to-br from-white/5 to-white/2 p-4">
        <QualityGauge score={review.quality_score} />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-white/40">Time Complexity</p>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="font-mono font-semibold text-amber-300">
                {review.time_complexity}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-white/40">Space Complexity</p>
            <div className="flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-blue-400" />
              <span className="font-mono font-semibold text-blue-300">
                {review.space_complexity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bugs */}
      {review.bugs.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Issues Detected ({review.bugs.length})
          </h4>
          <div className="space-y-2">
            {review.bugs.map((bug, idx) => {
              const sev =
                (bug.severity as keyof typeof SEVERITY_STYLES) in SEVERITY_STYLES
                  ? (bug.severity as keyof typeof SEVERITY_STYLES)
                  : "minor";
              return (
                <div
                  key={idx}
                  className={`overflow-hidden rounded-xl border ${SEVERITY_STYLES[sev]}`}
                >
                  <button
                    onClick={() =>
                      setExpandedBug(expandedBug === idx ? null : idx)
                    }
                    className="flex w-full items-center gap-2 px-3 py-2 text-left"
                  >
                    {SEVERITY_ICON[sev]}
                    <span className="flex-1 text-sm font-medium capitalize">
                      {sev} issue
                    </span>
                    {expandedBug === idx ? (
                      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    )}
                  </button>
                  {expandedBug === idx && (
                    <div className="border-t border-current/20 px-3 pb-3 pt-2 space-y-1">
                      <p className="text-sm opacity-80">{bug.description}</p>
                      {bug.line_hint && (
                        <p className="text-xs opacity-50 font-mono">
                          {bug.line_hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {review.suggestions.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Optimization Suggestions
          </h4>
          <ul className="space-y-1.5">
            {review.suggestions.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-0.5 text-blue-400 shrink-0">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Best practices */}
      {review.best_practices.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Best Practices
          </h4>
          <ul className="space-y-1.5">
            {review.best_practices.map((bp, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0" />
                {bp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interview notes */}
      {review.interview_notes && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Bot className="h-3.5 w-3.5" />
            Interviewer&apos;s Perspective
          </h4>
          <p className="text-sm leading-relaxed text-blue-200/70">
            {review.interview_notes}
          </p>
        </div>
      )}
    </div>
  );
}
