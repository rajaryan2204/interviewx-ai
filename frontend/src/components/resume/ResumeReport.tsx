"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  User,
  ListTodo,
  TrendingUp,
} from "lucide-react";

export interface ResumeAnalysis {
  candidate_info: {
    name: string;
    email: string;
    phone: string;
    skills: string[];
    education: string[];
    experience: string[];
    projects: string[];
    certifications: string[];
  };
  ats_score: number;
  overall_score: number;
  missing_skills: string[];
  grammar_suggestions: string[];
  formatting_suggestions: string[];
  recruiter_feedback: string;
  improvement_plan: string[];
}

interface ResumeReportProps {
  fileName: string;
  uploadedAt: string;
  analysis: ResumeAnalysis;
  parsedText: string;
}

export const ResumeReport: React.FC<ResumeReportProps> = ({
  fileName,
  uploadedAt,
  analysis,
  parsedText,
}) => {
  const [showFullText, setShowFullText] = useState(false);

  // SVG calculations for score ring
  const score = analysis.ats_score;
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const info = analysis.candidate_info;

  return (
    <div className="space-y-8 select-none">
      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ATS Score Gauge Card */}
        <div className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm relative overflow-hidden">
          <div className="w-full text-left space-y-1">
            <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              ATS Match Rating
            </h3>
            <p className="text-[10px] text-neutral-400">
              Evaluated against SaaS standard requirements
            </p>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <circle
                stroke="currentColor"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="text-neutral-200 dark:text-neutral-800"
              />
              <motion.circle
                stroke="currentColor"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="text-violet-500"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-white leading-none">
                {score}
              </span>
              <span className="text-[9px] text-neutral-450 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1">
                Score
              </span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-500 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/25">
              <TrendingUp className="w-3.5 h-3.5" />
              {score >= 80 ? "Premium Fit" : score >= 60 ? "Strong Fit" : "Action Required"}
            </span>
          </div>
        </div>

        {/* Recruiter Feedback Card */}
        <div className="md:col-span-2 bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Recruiter Screening Summary
              </h3>
            </div>
            <p className="text-xs text-neutral-550 dark:text-neutral-350 leading-relaxed italic border-l-2 border-violet-500 pl-4 py-1">
              &quot;{analysis.recruiter_feedback}&quot;
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-neutral-200/30 dark:border-neutral-800/30 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                Document Upload
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {fileName}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                Analyzed on
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {new Date(uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Candidate Info & Improvement plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Extracted Candidate Information */}
          <div className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Parsed Candidate Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-neutral-200/30 dark:border-neutral-800/30">
              <div className="flex items-center gap-2.5 text-xs">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/30 dark:border-neutral-800/20 text-neutral-500 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Name</p>
                  <p className="font-semibold text-neutral-850 dark:text-neutral-200 truncate">{info.name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/30 dark:border-neutral-800/20 text-neutral-500 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-neutral-850 dark:text-neutral-200 truncate">{info.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/30 dark:border-neutral-800/20 text-neutral-500 rounded-lg">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Phone</p>
                  <p className="font-semibold text-neutral-850 dark:text-neutral-200 truncate">{info.phone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Extracted Core Skills */}
            <div className="space-y-2">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Extracted Skills Profile
              </span>
              <div className="flex flex-wrap gap-1.5">
                {info.skills.length === 0 ? (
                  <span className="text-xs text-neutral-400">No skills parsed from document.</span>
                ) : (
                  info.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-850 text-neutral-700 dark:text-neutral-300 rounded-lg shadow-sm"
                    >
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Step-by-Step Improvement Plan */}
          <div className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Step-by-Step Improvement Plan
              </h3>
            </div>

            <div className="space-y-3">
              {analysis.improvement_plan.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/30 dark:border-neutral-800/30">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-500 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 column: Missing Skills & Formatting suggestions */}
        <div className="space-y-6">
          {/* Missing Skills Warning */}
          <div className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                ATS Missing Core Skills
              </h3>
            </div>

            <div className="flex flex-col gap-2">
              {analysis.missing_skills.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                  <CheckCircle className="w-4 h-4" />
                  <span>No missing core skills detected.</span>
                </div>
              ) : (
                analysis.missing_skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 border border-red-500/10 bg-red-500/5 dark:bg-red-950/10 rounded-xl"
                  >
                    <span className="text-xs font-semibold text-red-650 dark:text-red-400">
                      {skill}
                    </span>
                    <span className="text-[8px] font-bold text-red-500 border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">
                      High Impact
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grammar & Formatting Recommendations */}
          <div className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Layout & Language suggestions
            </h3>

            <div className="space-y-4">
              {/* Grammar */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  Grammar & Style checks
                </span>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                  {analysis.grammar_suggestions.map((s, i) => (
                    <p key={i} className="leading-relaxed pl-3 border-l border-neutral-350 dark:border-neutral-700">
                      {s}
                    </p>
                  ))}
                </div>
              </div>

              {/* Formatting */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-200/35 dark:border-neutral-800/35">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  Layout formatting rules
                </span>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
                  {analysis.formatting_suggestions.map((s, i) => (
                    <p key={i} className="leading-relaxed pl-3 border-l border-neutral-350 dark:border-neutral-700">
                      {s}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raw parsed text collapse view */}
      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden bg-white dark:bg-neutral-950">
        <button
          onClick={() => setShowFullText(!showFullText)}
          className="w-full flex items-center justify-between p-4 text-xs font-bold text-neutral-800 dark:text-neutral-250 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-neutral-400" />
            <span>Extracted Document Plain Text</span>
          </div>
          {showFullText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFullText && (
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs font-mono text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {parsedText}
          </div>
        )}
      </div>
    </div>
  );
};
