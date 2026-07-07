"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Play } from "lucide-react";

import type { CodingQuestionDetail } from "@/types/coding";

interface TestCasePanelProps {
  question: CodingQuestionDetail;
  onRun: (customInput?: string) => void;
  isRunning: boolean;
}

export default function TestCasePanel({
  question,
  onRun,
  isRunning,
}: TestCasePanelProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [expandedCase, setExpandedCase] = useState<number | null>(0);

  const handleRun = () => {
    onRun(customMode && customInput.trim() ? customInput : undefined);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCustomMode(false)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            !customMode
              ? "bg-blue-500/20 text-blue-400"
              : "bg-white/5 text-white/50 hover:text-white/80"
          }`}
        >
          Sample Cases
        </button>
        <button
          onClick={() => setCustomMode(true)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            customMode
              ? "bg-blue-500/20 text-blue-400"
              : "bg-white/5 text-white/50 hover:text-white/80"
          }`}
        >
          Custom Input
        </button>
      </div>

      {/* Sample test cases */}
      {!customMode && (
        <div className="space-y-2">
          {question.test_cases_public.length === 0 ? (
            <p className="text-sm text-white/40">
              No sample test cases available.
            </p>
          ) : (
            question.test_cases_public.map((tc, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-white/8 bg-white/3"
              >
                <button
                  onClick={() =>
                    setExpandedCase(expandedCase === idx ? null : idx)
                  }
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-white/70 transition hover:text-white"
                >
                  <span>Case {idx + 1}</span>
                  {expandedCase === idx ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedCase === idx && (
                  <div className="border-t border-white/8 px-3 pb-3 pt-2 space-y-2">
                    <div>
                      <p className="text-xs text-white/40 mb-1">Input:</p>
                      <pre className="rounded-lg bg-black/30 px-3 py-2 text-xs text-green-300 whitespace-pre-wrap font-mono">
                        {tc.input}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">
                        Expected Output:
                      </p>
                      <pre className="rounded-lg bg-black/30 px-3 py-2 text-xs text-blue-300 font-mono">
                        {tc.output}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Custom input */}
      {customMode && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Custom Input (stdin)
          </label>
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter your custom input here…"
            rows={6}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={isRunning}
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRunning ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Running…
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-current" />
            Run Code
          </>
        )}
      </button>
    </div>
  );
}
