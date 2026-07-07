"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";

import type { CodingQuestionDetail } from "@/types/coding";

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  hard: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
};

interface QuestionPanelProps {
  question: CodingQuestionDetail;
}

export default function QuestionPanel({ question }: QuestionPanelProps) {
  const [hintsOpen, setHintsOpen] = useState(false);
  const [shownHints, setShownHints] = useState(0);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              DIFFICULTY_STYLES[question.difficulty]
            }`}
          >
            {question.difficulty}
          </span>
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/50 ring-1 ring-white/10">
            {question.category}
          </span>
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-xl font-bold text-white">{question.title}</h1>
      </div>

      {/* Description */}
      <div className="prose prose-invert prose-sm max-w-none text-white/80">
        <ReactMarkdown>{question.description}</ReactMarkdown>
      </div>

      {/* Examples */}
      {question.examples.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Examples
          </h3>
          {question.examples.map((ex, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2"
            >
              <div>
                <span className="text-xs font-semibold text-white/40">Input:</span>
                <pre className="mt-0.5 rounded bg-black/30 px-2 py-1 text-xs text-green-300 whitespace-pre-wrap">
                  {ex.input}
                </pre>
              </div>
              <div>
                <span className="text-xs font-semibold text-white/40">Output:</span>
                <pre className="mt-0.5 rounded bg-black/30 px-2 py-1 text-xs text-blue-300">
                  {ex.output}
                </pre>
              </div>
              {ex.explanation && (
                <p className="text-xs text-white/50 italic">{ex.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Constraints */}
      {question.constraints.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
            Constraints
          </h3>
          <ul className="space-y-1">
            {question.constraints.map((c, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-0.5 text-blue-400">•</span>
                <code className="font-mono text-xs">{c}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Complexity */}
      {(question.optimal_time_complexity || question.optimal_space_complexity) && (
        <div className="rounded-xl border border-white/8 bg-white/3 p-3">
          <h3 className="mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Optimal Complexity
          </h3>
          <div className="flex gap-4 text-sm">
            {question.optimal_time_complexity && (
              <div>
                <span className="text-white/40 text-xs">Time</span>
                <p className="font-mono text-emerald-400">
                  {question.optimal_time_complexity}
                </p>
              </div>
            )}
            {question.optimal_space_complexity && (
              <div>
                <span className="text-white/40 text-xs">Space</span>
                <p className="font-mono text-blue-400">
                  {question.optimal_space_complexity}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hints */}
      {question.hints.length > 0 && (
        <div>
          <button
            onClick={() => setHintsOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-amber-400 transition hover:text-amber-300"
          >
            <Lightbulb className="h-4 w-4" />
            {hintsOpen ? "Hide Hints" : "Show Hints"}
          </button>
          {hintsOpen && (
            <div className="mt-2 space-y-2">
              {question.hints.slice(0, shownHints + 1).map((hint, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200/80"
                >
                  <span className="text-xs text-amber-400/60 mr-2">
                    Hint {idx + 1}:
                  </span>
                  {hint}
                </div>
              ))}
              {shownHints < question.hints.length - 1 && (
                <button
                  onClick={() => setShownHints((n) => n + 1)}
                  className="text-xs text-white/40 transition hover:text-white/70"
                >
                  Show next hint →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
