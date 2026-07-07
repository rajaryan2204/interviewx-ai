"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Code2,
  Download,
  FileText,
} from "lucide-react";

import { getCandidateReports, downloadReportUrl } from "@/lib/recruiter-api";
import type { CandidateAggregateReports } from "@/types/recruiter";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = Number(params.id);

  const [reports, setReports] = useState<CandidateAggregateReports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) return;
    getCandidateReports(candidateId)
      .then(setReports)
      .catch((err) => console.error("Error loading candidate reports:", err))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-neutral-400">Loading candidate evaluation details…</p>
        </div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="p-6 text-center text-neutral-400">
        <p>Candidate report not found or database sync failed.</p>
        <button onClick={() => router.back()} className="text-violet-500 hover:underline mt-2">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100">
      {/* Top Header Controls */}
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </button>
        <a
          href={downloadReportUrl(candidateId)}
          download={`evaluation_${candidateId}.txt`}
          className="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
        >
          <Download className="h-4 w-4" />
          Download Evaluation File
        </a>
      </div>

      {/* Main Candidate Card */}
      <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-violet-500/10 flex items-center justify-center font-bold text-violet-500 text-2xl border border-violet-500/20">
            C
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-850 dark:text-white">
              Evaluation Portfolio
            </h1>
            <p className="text-sm text-neutral-500">Candidate ID: #{candidateId}</p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Resumes and Mock Interviews (Col Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Resume ATS Details */}
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-850 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-900 pb-3">
              <FileText className="h-5 w-5 text-neutral-400" />
              Resume Analysis Reports
            </h2>
            {reports.resumes.length === 0 ? (
              <p className="text-sm text-neutral-400">No resumes uploaded yet.</p>
            ) : (
              <div className="space-y-4">
                {reports.resumes.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-neutral-100 dark:border-neutral-900 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-neutral-850 dark:text-neutral-200">
                          {r.filename}
                        </p>
                        <p className="text-xs text-neutral-400">
                          Uploaded: {new Date(r.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                        ATS Score: {r.ats_score}
                      </span>
                    </div>
                    {r.missing_skills.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Missing Skills identified
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {r.missing_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-450"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mock Interview History */}
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-850 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-900 pb-3">
              <Briefcase className="h-5 w-5 text-neutral-400" />
              Mock Interview Ratings
            </h2>
            {reports.interviews.length === 0 ? (
              <p className="text-sm text-neutral-400">No mock interview sessions completed.</p>
            ) : (
              <div className="space-y-4">
                {reports.interviews.map((i) => (
                  <div
                    key={i.id}
                    className="rounded-xl border border-neutral-100 dark:border-neutral-900 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-neutral-850 dark:text-neutral-200">
                          {i.job_role} ({i.difficulty})
                        </p>
                        <p className="text-xs text-neutral-500">
                          Type: {i.interview_type} | Date: {new Date(i.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Score: {i.feedback ? `${i.feedback.overall_score} / 10` : "—"}
                      </span>
                    </div>
                    {i.feedback && (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-white/5 dark:bg-black/10 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-900">
                          <span className="text-neutral-450 block mb-0.5">Technical Skill</span>
                          <span className="font-bold font-mono">{i.feedback.technical_score} / 10</span>
                        </div>
                        <div className="bg-white/5 dark:bg-black/10 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-900">
                          <span className="text-neutral-450 block mb-0.5">Communication</span>
                          <span className="font-bold font-mono">{i.feedback.communication_score} / 10</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Coding Practice Stats */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/40 p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-850 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-900 pb-3">
              <Code2 className="h-5 w-5 text-neutral-400" />
              Coding Exercises
            </h2>
            {reports.coding.length === 0 ? (
              <p className="text-sm text-neutral-400">No coding exercises attempted.</p>
            ) : (
              <div className="space-y-3">
                {reports.coding.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center p-3 rounded-xl border border-neutral-100 dark:border-neutral-900 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-neutral-850 dark:text-neutral-200">
                        {c.question_title}
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">{c.language}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {c.status}
                    </span>
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
