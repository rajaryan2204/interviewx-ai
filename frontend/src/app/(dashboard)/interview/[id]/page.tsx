"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Save,
  Flag,
  CornerDownRight,
  Mic,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AnswerSummary {
  id: number;
  user_answer: string;
  time_taken_seconds: number;
}

interface QuestionDetail {
  id: number;
  question_text: string;
  question_order: number;
  topic: string | null;
  correct_answer_guideline: string | null;
  answer: AnswerSummary | null;
}

interface InterviewSession {
  id: number;
  job_role: string;
  company: string | null;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  question_count: number;
  duration_minutes: number;
  status: string;
  current_question_index: number;
  time_remaining_seconds: number;
  questions: QuestionDetail[];
}

export default function ActiveInterviewBoard() {
  const params = useParams();
  const router = useRouter();
  const interviewId = Number(params.id);

  // Core Session State
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // Mapping question_id to response string
  const [timeRemaining, setTimeRemaining] = useState(900); // Default 15m
  const [isPaused, setIsPaused] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Metrics
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time tracker for active question
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load state and restore session
  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/api/interview/${interviewId}`);
        if (!response.ok) {
          throw new Error("Failed to load mock session details.");
        }
        const data: InterviewSession = await response.json();
        setSession(data);
        setCurrentIndex(data.current_question_index);
        setTimeRemaining(data.time_remaining_seconds || data.duration_minutes * 60);
        setIsPaused(data.status === "paused");

        // Prepopulate already answered questions
        const initialAnswers: Record<number, string> = {};
        data.questions.forEach((q) => {
          if (q.answer) {
            initialAnswers[q.id] = q.answer.user_answer;
          }
        });
        setAnswers(initialAnswers);
        setQuestionStartTime(Date.now());
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load session details.");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [interviewId]);

  const handleAutoEndInterview = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      await apiFetch(`/api/interview/${interviewId}/end`, { method: "POST" });
      router.push(`/interview/${interviewId}/feedback`);
    } catch (err) {
      console.error("Failed auto-ending interview:", err);
    }
  }, [isEnding, interviewId, router]);

  // Countdown timer logic
  useEffect(() => {
    if (loading || isPaused || isEnding || !session) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isPaused, isEnding, session, handleAutoEndInterview]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getActiveQuestion = () => {
    if (!session || !session.questions || session.questions.length === 0) return null;
    return session.questions[currentIndex];
  };

  // Auto-save core answer response
  async function saveCurrentAnswer() {
    const activeQ = getActiveQuestion();
    if (!activeQ || !session) return;

    const text = answers[activeQ.id] || "";
    if (!text.trim() && !activeQ.answer) {
      // Don't auto-save empty if no answer was previously saved
      return;
    }

    setSavingAnswer(true);
    const elapsedSeconds = Math.round((Date.now() - questionStartTime) / 1000);

    const payload = {
      question_id: activeQ.id,
      user_answer: text,
      time_taken_seconds: elapsedSeconds > 0 ? elapsedSeconds : 10,
    };

    try {
      await apiFetch(`/api/interview/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Update local question answer summary to mark as complete
      setSession((prev) => {
        if (!prev) return null;
        const updatedQs = prev.questions.map((q) => {
          if (q.id === activeQ.id) {
            return {
              ...q,
              answer: {
                id: q.answer?.id || 999,
                user_answer: text,
                time_taken_seconds: payload.time_taken_seconds,
              },
            };
          }
          return q;
        });
        return { ...prev, questions: updatedQs };
      });
    } catch (err) {
      console.error("Failed to auto-save answer:", err);
    } finally {
      setSavingAnswer(false);
    }
  }

  // Handle previous navigation
  async function handlePrev() {
    if (currentIndex > 0) {
      await saveCurrentAnswer();
      setCurrentIndex((prev) => prev - 1);
      setQuestionStartTime(Date.now());
    }
  }

  // Handle next navigation
  async function handleNext() {
    if (!session) return;
    await saveCurrentAnswer();
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
    }
  }

  // Handle skip question
  async function handleSkip() {
    if (!session) return;
    // Mark as skipped (empty answer)
    const activeQ = getActiveQuestion();
    if (activeQ) {
      setAnswers((prev) => ({ ...prev, [activeQ.id]: "[Question Skipped]" }));
    }
    await saveCurrentAnswer();
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
    }
  }

  // Handle Pause Interview
  async function handlePause() {
    if (!session || isPaused) return;
    await saveCurrentAnswer();
    setIsPaused(true);

    try {
      await apiFetch(`/api/interview/${interviewId}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_question_index: currentIndex,
          time_remaining_seconds: timeRemaining,
        }),
      });
    } catch (err) {
      console.error("Failed to commit pause state:", err);
    }
  }

  // Handle Resume Interview
  async function handleResume() {
    if (!session || !isPaused) return;
    setIsPaused(false);
    setQuestionStartTime(Date.now());

    try {
      await apiFetch(`/api/interview/${interviewId}/resume`, { method: "POST" });
    } catch (err) {
      console.error("Failed to commit resume state:", err);
    }
  }

  // End Interview and route to feedback
  async function handleEndInterview() {
    if (!session || isEnding) return;
    if (!confirm("Are you sure you want to end this mock interview session and view feedback?")) return;

    await saveCurrentAnswer();
    setIsEnding(true);

    try {
      const response = await apiFetch(`/api/interview/${interviewId}/end`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to compile feedback.");
      router.push(`/interview/${interviewId}/feedback`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to generate AI evaluation report.");
      setIsEnding(false);
    }
  }



  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-black dark:border-white"></div>
        <p className="text-neutral-500 mt-4 text-sm">Resuming mock interview session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900">
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm max-w-md text-center">
          {error || "Session configuration failure."}
        </div>
        <Button onClick={() => router.push("/interview")} className="mt-4">
          Back to Setup
        </Button>
      </div>
    );
  }

  const activeQ = getActiveQuestion();
  const isLastQuestion = currentIndex === session.questions.length - 1;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-neutral-900 select-none">
      
      {/* Sidebar Progress Panel */}
      <div className="w-full md:w-80 border-r border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 space-y-4">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Mock Session</p>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
              {session.job_role}
            </h3>
            {session.company && (
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <CornerDownRight className="h-3 w-3" />
                {session.company}
              </p>
            )}
          </div>
        </div>

        {/* Question Index Progress List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {session.questions.map((q, idx) => {
            const isActive = idx === currentIndex;
            const isCompleted = !!q.answer || !!answers[q.id];

            return (
              <div
                key={q.id}
                onClick={async () => {
                  if (isPaused || isEnding) return;
                  await saveCurrentAnswer();
                  setCurrentIndex(idx);
                  setQuestionStartTime(Date.now());
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  isActive
                    ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black font-semibold shadow-sm"
                    : "bg-transparent border-neutral-100 dark:border-neutral-850 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-350"
                }`}
              >
                <span
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black"
                      : isCompleted
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="text-xs truncate flex-1">{q.topic || `Question ${idx + 1}`}</span>
              </div>
            );
          })}
        </div>

        {/* End Interview Trigger */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-850">
          <Button
            onClick={handleEndInterview}
            disabled={isEnding}
            className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-red-600 dark:text-red-400 font-semibold text-xs hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-2"
          >
            <Flag className="h-3.5 w-3.5" />
            Submit & End Mock Run
          </Button>
        </div>
      </div>

      {/* Main Focus Question Card Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-850">
          
          {/* Timer Display */}
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${timeRemaining < 120 ? "text-red-500 animate-pulse" : "text-neutral-500"}`} />
            <span className={`text-sm font-semibold tracking-wider ${timeRemaining < 120 ? "text-red-600 font-bold" : "text-neutral-700 dark:text-neutral-200"}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Session Controller Pause / Play & Voice Mode */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push(`/interview/${interviewId}/voice`)}
              className="px-4 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/20"
            >
              <Mic className="h-3 w-3" />
              Switch to Voice Mode
            </Button>

            {isPaused ? (
              <Button
                onClick={handleResume}
                className="px-4 py-1.5 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold flex items-center gap-1.5"
              >
                <Play className="h-3 w-3 fill-current" />
                Resume Session
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                className="px-4 py-1.5 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-semibold flex items-center gap-1.5"
              >
                <Pause className="h-3 w-3" />
                Pause Mock Run
              </Button>
            )}
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-neutral-50/50 dark:bg-neutral-900/10 relative">
          
          {/* Paused Overlay Screen */}
          {isPaused && (
            <div className="absolute inset-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 space-y-4">
              <Pause className="h-12 w-12 text-yellow-500 animate-pulse" />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Mock Run Paused</h2>
              <p className="text-sm text-neutral-500 max-w-xs text-center">
                Remaining session duration and current index markers saved. Click below to resume your assessment.
              </p>
              <Button onClick={handleResume} className="px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm">
                Resume Interview
              </Button>
            </div>
          )}

          {activeQ && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Active Question Box */}
              <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm p-6 space-y-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold tracking-wider">
                  {activeQ.topic || "Technical Assessment"}
                </span>
                <h2 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-white leading-relaxed">
                  {activeQ.question_text}
                </h2>
              </div>

              {/* Text Answer Input Area */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                    Your Response
                  </label>
                  
                  {/* Visual Recorders block */}
                  <button className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                    <Mic className="h-3.5 w-3.5" />
                    Record Audio Response
                  </button>
                </div>
                
                <textarea
                  value={answers[activeQ.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [activeQ.id]: e.target.value }))}
                  placeholder="Formulate your response here. Try to use technical metrics, system models, and STAR structure format."
                  className="w-full h-64 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none leading-relaxed resize-none shadow-inner"
                />
              </div>

              {/* Status Saver Indicator */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-2">
                <div className="flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {savingAnswer ? "Committing save..." : "Response auto-saved on navigation."}
                </div>
                <div>
                  Question {currentIndex + 1} of {session.questions.length}
                </div>
              </div>

              {/* Navigation Controllers */}
              <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-350 text-sm font-semibold flex items-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSkip}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-500 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Skip
                  </Button>

                  {isLastQuestion ? (
                    <Button
                      onClick={handleEndInterview}
                      disabled={isEnding}
                      className="px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      {isEnding ? "Ending Interview..." : "Finish Run"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      Next Question
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
