"use client";

import React, { useEffect, useState } from "react";
import { Target, Plus, CheckCircle2, Trash2, ArrowRight } from "lucide-react";
import { listGoals, createGoal, updateGoalProgress, deleteGoal } from "@/lib/productivity-api";
import type { GoalResponse } from "@/types/productivity";

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"weekly" | "monthly" | "company" | "coding" | "communication">("weekly");
  const [targetVal, setTargetVal] = useState(5);
  const [deadlineStr, setDeadlineStr] = useState("");

  const [error, setError] = useState<string | null>(null);

  const fetchGoals = () => {
    listGoals()
      .then(setGoals)
      .catch((err) => console.error("Error fetching goals:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createGoal({
        title,
        type,
        target_value: targetVal,
        deadline: deadlineStr ? new Date(deadlineStr).toISOString() : undefined,
      });
      setTitle("");
      setDeadlineStr("");
      fetchGoals();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create goal.";
      setError(errorMsg);
    }
  };

  const handleIncrement = async (goal: GoalResponse) => {
    const nextVal = goal.current_value + 1;
    try {
      await updateGoalProgress(goal.id, {
        current_value: nextVal,
      });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteGoal(id);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <Target className="h-7 w-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Preparation Goals</h1>
          <p className="text-sm text-neutral-500">Track milestones and configure target readiness scoring across metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Goal Builder */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-850 dark:text-white">
              Create New Goal
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                  Goal Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete 10 sliding window questions"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                  Goal Domain
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "weekly" | "monthly" | "company" | "coding" | "communication")}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="weekly">Weekly Target</option>
                  <option value="monthly">Monthly Milestone</option>
                  <option value="company">Company Specific Target</option>
                  <option value="coding">Coding challenges count</option>
                  <option value="communication">Speech scoring goal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                    Target Score / Unit
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={targetVal}
                    onChange={(e) => setTargetVal(Number(e.target.value))}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={deadlineStr}
                    onChange={(e) => setDeadlineStr(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-2 text-xs outline-none focus:ring-1 focus:ring-violet-500 font-mono"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 shadow-md"
              >
                <Plus className="h-4 w-4" />
                Add Goal Target
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Goals Progress Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-850 dark:text-white mb-4">
              Goal Tracking Console
            </h2>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-850" />
                ))}
              </div>
            ) : goals.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-12">No active goals configured. Setup one on the left!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                  const isCompleted = goal.status === "completed" || percent >= 100;

                  return (
                    <div
                      key={goal.id}
                      className="rounded-2xl border border-neutral-100 dark:border-neutral-900 p-5 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-4 relative flex flex-col justify-between"
                    >
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="absolute top-3 right-3 text-neutral-400 hover:text-rose-500 p-1"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="space-y-1 pr-6">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          goal.type === "weekly"
                            ? "bg-violet-500/10 text-violet-500"
                            : goal.type === "monthly"
                            ? "bg-blue-500/10 text-blue-500"
                            : goal.type === "coding"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {goal.type} Goal
                        </span>
                        <p className="font-bold text-sm text-neutral-850 dark:text-neutral-200 mt-1.5">{goal.title}</p>
                      </div>

                      {/* Progress meter */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-450 font-semibold">{percent}% Complete</span>
                          <span className="font-mono text-neutral-400">{goal.current_value} / {goal.target_value}</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-850 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : "bg-gradient-to-r from-violet-500 to-indigo-500"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-between items-center pt-2">
                        <p className="text-[10px] text-neutral-450 font-mono">
                          {goal.deadline ? `Due: ${new Date(goal.deadline).toLocaleDateString()}` : "No deadline"}
                        </p>
                        {isCompleted ? (
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleIncrement(goal)}
                            className="text-xs font-semibold text-violet-600 hover:text-violet-500 flex items-center gap-1 border border-violet-500/20 hover:border-violet-500/50 px-2.5 py-1 rounded-lg"
                          >
                            Update Progress <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
