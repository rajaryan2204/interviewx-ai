"use client";

import { CheckCircle, Clock, Cpu, Terminal, XCircle } from "lucide-react";
import type { CodeRunResponse } from "@/types/coding";

const VERDICT_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  accepted: {
    label: "Accepted",
    className: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
    icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
  },
  wrong_answer: {
    label: "Wrong Answer",
    className: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
    icon: <XCircle className="h-5 w-5 text-rose-400" />,
  },
  runtime_error: {
    label: "Runtime Error",
    className: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30",
    icon: <XCircle className="h-5 w-5 text-orange-400" />,
  },
  time_limit_exceeded: {
    label: "Time Limit Exceeded",
    className: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
    icon: <Clock className="h-5 w-5 text-yellow-400" />,
  },
  compilation_error: {
    label: "Compilation Error",
    className: "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30",
    icon: <XCircle className="h-5 w-5 text-purple-400" />,
  },
};

interface ExecutionResultProps {
  result: CodeRunResponse | null;
  isLoading?: boolean;
}

export default function ExecutionResult({
  result,
  isLoading,
}: ExecutionResultProps) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-sm text-white/50">Executing your code…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <Terminal className="h-12 w-12 text-white/10" />
        <p className="text-sm text-white/40">
          Run or submit your code to see results here.
        </p>
      </div>
    );
  }

  const vc = VERDICT_CONFIG[result.verdict] ?? {
    label: result.verdict,
    className: "bg-white/10 text-white/70",
    icon: null,
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Verdict banner */}
      <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${vc.className}`}>
        {vc.icon}
        <span className="font-semibold">{vc.label}</span>
        {result.total_tests > 0 && (
          <span className="ml-auto text-sm opacity-70">
            {result.passed_tests}/{result.total_tests} cases
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="flex gap-3">
        {result.runtime_ms != null && (
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 p-3">
            <Clock className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-white/40">Runtime</p>
              <p className="text-sm font-semibold text-white">
                {result.runtime_ms.toFixed(1)} ms
              </p>
            </div>
          </div>
        )}
        {result.memory_kb != null && (
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 p-3">
            <Cpu className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-xs text-white/40">Memory</p>
              <p className="text-sm font-semibold text-white">
                {result.memory_kb.toFixed(1)} KB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Test case results */}
      {result.test_results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Test Cases
          </h4>
          {result.test_results.map((tc, idx) => (
            <div
              key={idx}
              className={`overflow-hidden rounded-xl border ${
                tc.passed
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-rose-500/20 bg-rose-500/5"
              }`}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                {tc.passed ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span className="text-sm font-medium text-white/80">
                  Case {tc.test_case_index + 1}
                </span>
                {tc.runtime_ms != null && (
                  <span className="ml-auto text-xs text-white/30">
                    {tc.runtime_ms.toFixed(1)}ms
                  </span>
                )}
              </div>
              <div className="border-t border-white/5 px-3 pb-3 pt-2 space-y-1.5 text-xs font-mono">
                {tc.input && (
                  <div>
                    <span className="text-white/30">Input: </span>
                    <span className="text-white/70">{tc.input.replace(/\n/g, " | ")}</span>
                  </div>
                )}
                <div>
                  <span className="text-white/30">Expected: </span>
                  <span className="text-emerald-400 dark:text-emerald-300">{tc.expected_output}</span>
                </div>
                <div>
                  <span className="text-white/30">Got: </span>
                  <span className={tc.passed ? "text-emerald-400 dark:text-emerald-300 font-semibold" : "text-rose-400 dark:text-rose-300 font-semibold"}>
                    {tc.actual_output || "(empty)"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* stdout */}
      {result.stdout && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
            Output
          </h4>
          <pre className="max-h-40 overflow-y-auto rounded-xl border border-white/8 bg-black/40 p-3 text-xs text-green-300 font-mono whitespace-pre-wrap">
            {result.stdout}
          </pre>
        </div>
      )}

      {/* stderr */}
      {result.stderr && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400/60">
            Error
          </h4>
          <pre className="max-h-40 overflow-y-auto rounded-xl border border-rose-500/20 bg-rose-950/30 p-3 text-xs text-rose-300 font-mono whitespace-pre-wrap">
            {result.stderr}
          </pre>
        </div>
      )}
    </div>
  );
}
