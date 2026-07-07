"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Award,
  Compass,
  ListTodo,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  BookOpen,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface VoiceMetrics {
  speaking_speed: number;
  pronunciation_score: number;
  confidence_score: number;
  filler_words?: Record<string, number>;
  coaching_suggestions?: string[];
}

interface FeedbackDetail {
  id: number;
  overall_score: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  grammar_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_plan: string[];
  learning_roadmap: string[];
  suggested_answers: Record<string, string>;
  voice_metrics?: VoiceMetrics | null;
  created_at: string;
}

interface QuestionDetail {
  id: number;
  question_text: string;
  topic: string | null;
}

interface InterviewSession {
  id: number;
  job_role: string;
  company: string | null;
  questions: QuestionDetail[];
  feedback: FeedbackDetail | null;
}

export default function InterviewFeedbackReport() {
  const params = useParams();
  const router = useRouter();
  const interviewId = Number(params.id);

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tabs: summary, suggestions, roadmap
  const [activeTab, setActiveTab] = useState<"summary" | "suggestions" | "roadmap">("summary");

  useEffect(() => {
    async function loadFeedback() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/api/interview/${interviewId}`);
        if (!response.ok) throw new Error("Failed to load feedback details.");

        const data: InterviewSession = await response.json();
        setSession(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load mock feedback.");
      } finally {
        setLoading(false);
      }
    }

    loadFeedback();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-black dark:border-white"></div>
        <p className="text-neutral-500 mt-4 text-sm">Compiling AI feedback report...</p>
      </div>
    );
  }

  if (error || !session || !session.feedback) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900">
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm max-w-md text-center">
          {error || "Feedback report not available for this session."}
        </div>
        <Button onClick={() => router.push("/interview")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const fb = session.feedback;

  // Circular ring calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (fb.overall_score / 10) * circumference;

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-6 lg:p-10 select-none">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back */}
        <button
          onClick={() => router.push("/interview")}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Sessions
        </button>

        {/* Header Summary */}
        <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 font-semibold tracking-wider">
              Completed mock run
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {session.job_role} Feedback Report
            </h1>
            {session.company && (
              <p className="text-sm text-neutral-500">
                Target Company: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{session.company}</span>
              </p>
            )}
          </div>

          {/* Overall Circular Score Ring */}
          <div className="relative flex items-center justify-center">
            <svg className="h-28 w-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-neutral-100 dark:stroke-neutral-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-black dark:stroke-white transition-all duration-500"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {fb.overall_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold tracking-wider">
                OVERALL
              </span>
            </div>
          </div>
        </div>

        {/* Category Scores Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Technical capability", score: fb.technical_score },
            { label: "Communication skill", score: fb.communication_score },
            { label: "Confidence index", score: fb.confidence_score },
            { label: "Grammar & vocabulary", score: fb.grammar_score },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 p-4 space-y-2 shadow-sm"
            >
              <p className="text-xs text-neutral-400 font-medium truncate">{item.label}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {item.score.toFixed(1)}
                </span>
                <span className="text-xs text-neutral-400">/ 10</span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-neutral-700 dark:bg-neutral-350 h-full rounded-full"
                  style={{ width: `${item.score * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Voice & Communication Analysis (If available) */}
        {fb.voice_metrics && (
          <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-6 space-y-6 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
              <span className="text-blue-500">🎙️</span> Voice & Speaking Performance
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Speed WPM */}
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">Speaking Pace</span>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {fb.voice_metrics.speaking_speed} <span className="text-xs font-normal text-neutral-400">WPM</span>
                </p>
                <span className="text-[10px] text-neutral-400 block">Optimal: 120-150 WPM</span>
              </div>

              {/* Pronunciation */}
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">Pronunciation Index</span>
                <p className="text-2xl font-bold text-neutral-950 dark:text-white">
                  {fb.voice_metrics.pronunciation_score}%
                </p>
                <span className="text-[10px] text-neutral-400 block">Articulation and clarity</span>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">Speech Fluency</span>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {fb.voice_metrics.confidence_score}%
                </p>
                <span className="text-[10px] text-neutral-400 block">Fluency without hesitation</span>
              </div>
            </div>

            {/* Filler Words Pill list */}
            {fb.voice_metrics.filler_words && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Filler Word Frequencies</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(fb.voice_metrics.filler_words).map(([word, count]) => {
                    const countNum = Number(count);
                    return (
                      <span
                        key={word}
                        className={`text-xs px-3 py-1 rounded-full border ${
                          countNum > 2
                            ? "bg-red-50 dark:bg-red-950/25 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
                            : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-750 text-neutral-600 dark:text-neutral-350"
                        }`}
                      >
                        <span className="font-semibold">{word}</span>: {countNum} {countNum === 1 ? "time" : "times"}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coaching suggestions */}
            {fb.voice_metrics.coaching_suggestions && fb.voice_metrics.coaching_suggestions.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Voice Coaching Suggestions</h3>
                <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-350">
                  {fb.voice_metrics.coaching_suggestions.map((suggestion: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab Headers */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-850 gap-6 text-sm font-semibold">
          {[
            { id: "summary", label: "Performance Summary", icon: Award },
            { id: "suggestions", label: "Suggested Answers", icon: ListTodo },
            { id: "roadmap", label: "Learning Roadmap", icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "summary" | "suggestions" | "roadmap")}
                className={`pb-3 flex items-center gap-1.5 transition-colors relative ${
                  isActive ? "text-black dark:text-white" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          
          {/* Tab 1: Summary (Strengths, Weaknesses, Improvement Plan) */}
          {activeTab === "summary" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Strengths */}
              <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Key Strengths
                </h3>
                <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-350 list-disc list-inside leading-relaxed">
                  {fb.strengths.map((item, idx) => (
                    <li key={idx} className="pl-1">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  Areas to Optimize
                </h3>
                <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-350 list-disc list-inside leading-relaxed">
                  {fb.weaknesses.map((item, idx) => (
                    <li key={idx} className="pl-1">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Action Plan */}
              <div className="md:col-span-2 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-neutral-500" />
                  Actionable Improvement Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fb.improvement_plan.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-start gap-3"
                    >
                      <span className="h-5 w-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-neutral-600 dark:text-neutral-350 leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Suggested Answers */}
          {activeTab === "suggestions" && (
            <div className="space-y-4 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <ListTodo className="h-5 w-5 text-neutral-500" />
                Model Guidelines & Suggestions
              </h3>
              
              <div className="space-y-6 pt-2">
                {session.questions.map((q, idx) => {
                  const suggested = fb.suggested_answers[q.id.toString()] || fb.suggested_answers[idx.toString()] || "Guideline not generated.";
                  return (
                    <div key={q.id} className="space-y-2 border-b border-neutral-100 dark:border-neutral-800 pb-6 last:border-b-0 last:pb-0">
                      <p className="text-sm font-semibold text-neutral-850 dark:text-white">
                        Question {idx + 1}: {q.question_text}
                      </p>
                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/50 space-y-1.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          Suggested model answer
                        </span>
                        <p className="text-sm text-neutral-600 dark:text-neutral-350 leading-relaxed">
                          {suggested}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Roadmap */}
          {activeTab === "roadmap" && (
            <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-6 space-y-6 shadow-sm">
              <div className="space-y-1 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Compass className="h-5 w-5 text-neutral-500" />
                  Targeted Learning Roadmap
                </h3>
                <p className="text-xs text-neutral-400">Recommended syllabus blocks curated by AI based on weak parameters identified during mock assessment.</p>
              </div>

              <div className="space-y-4">
                {fb.learning_roadmap.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-start gap-4"
                  >
                    <span className="h-8 w-8 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Roadmap Milestone</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-350 leading-relaxed">
                        {item}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
