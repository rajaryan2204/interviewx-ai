"use client";

import React, { useState } from "react";
import { Star, Send, ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function CandidateFeedbackPage() {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating of at least 1 star.");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a short comment about your experience.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch("/api/productivity/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback. Please try again.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-neutral-850 dark:text-white">
              Thank You!
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Your feedback helps us make InterviewX AI better for everyone. It has been shared directly with the team.
            </p>
          </div>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 justify-center w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg p-6 md:p-8 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            Platform Feedback
          </div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-300 dark:to-neutral-500">
            Share Your Experience
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            How is your preparation going? We appreciate your honest comments and ratings.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-3 text-center">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Your overall rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform active:scale-95 duration-100"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-amber-500 fill-amber-500"
                        : "text-neutral-300 dark:text-neutral-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment Area */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Tell us more
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What do you love? What can we improve? Let us know..."
              maxLength={1000}
              rows={4}
              className="w-full p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed transition-all resize-none"
            />
            <div className="text-right text-[10px] text-neutral-400">
              {comment.length}/1000 characters
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-rose-500 text-center font-medium bg-rose-500/10 py-2.5 px-4 rounded-xl border border-rose-500/20">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="/dashboard"
              className="flex-1 inline-flex items-center gap-2 justify-center px-5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 text-neutral-700 dark:text-neutral-300 font-semibold transition-all active:scale-[0.98]"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center gap-2 justify-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/55 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
