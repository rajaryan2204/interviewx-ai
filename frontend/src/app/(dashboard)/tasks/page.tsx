"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, Trash2, Calendar, ClipboardList } from "lucide-react";
import { listTasks, createTask, updateTask, deleteTask } from "@/lib/productivity-api";
import type { TaskResponse } from "@/types/productivity";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [deadlineStr, setDeadlineStr] = useState("");
  const [isDaily, setIsDaily] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchTasks = () => {
    listTasks()
      .then(setTasks)
      .catch((err) => console.error("Error fetching tasks:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createTask({
        title,
        description: description || undefined,
        priority,
        deadline: deadlineStr ? new Date(deadlineStr).toISOString() : undefined,
        is_daily_checklist: isDaily,
      });
      setTitle("");
      setDescription("");
      setDeadlineStr("");
      setIsDaily(false);
      fetchTasks();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create task.";
      setError(errorMsg);
    }
  };

  const handleToggleComplete = async (task: TaskResponse) => {
    try {
      await updateTask(task.id, {
        is_completed: !task.is_completed,
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const checklistItems = tasks.filter((t) => t.is_daily_checklist);
  const customTasks = tasks.filter((t) => !t.is_daily_checklist);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <CheckSquare className="h-7 w-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Tasks & Checklist</h1>
          <p className="text-sm text-neutral-500">Track deadlines, prioritizations, and complete daily preparation items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Task Creator Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-850 dark:text-white">
              Create New Task
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                  Task Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Review LeetCode #206"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2.5 px-3 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                  Task Details
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or links..."
                  rows={2}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
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

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="isDaily"
                  checked={isDaily}
                  onChange={(e) => setIsDaily(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-350 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <label htmlFor="isDaily" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                  Add to Daily Practice Checklist
                </label>
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
                Add Checklist Item
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns: Tasks Console Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Daily Checklist Console */}
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/30 dark:border-neutral-800/30">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-neutral-850 dark:text-white uppercase tracking-wider">
                Daily Prep Checklist
              </h2>
            </div>

            {loading ? (
              <div className="h-20 animate-pulse bg-neutral-100 dark:bg-neutral-850 rounded-xl" />
            ) : checklistItems.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6 italic">No daily items configured.</p>
            ) : (
              <div className="space-y-3">
                {checklistItems.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-900 transition-all ${
                      task.is_completed ? "opacity-60 bg-neutral-50/20 dark:bg-neutral-950/10" : "bg-neutral-50/50 dark:bg-neutral-950/20"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={task.is_completed}
                        onChange={() => handleToggleComplete(task)}
                        className="w-4 h-4 rounded border-neutral-350 text-violet-600 focus:ring-violet-500 cursor-pointer mt-0.5"
                      />
                      <div>
                        <p className={`text-xs font-semibold ${task.is_completed ? "line-through text-neutral-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-neutral-400 hover:text-rose-500 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core Custom Tasks Console */}
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/30 dark:border-neutral-800/30">
              <CheckSquare className="w-5 h-5 text-violet-500" />
              <h2 className="text-sm font-bold text-neutral-850 dark:text-white uppercase tracking-wider">
                Custom Preparation Tasks
              </h2>
            </div>

            {loading ? (
              <div className="h-20 animate-pulse bg-neutral-100 dark:bg-neutral-850 rounded-xl" />
            ) : customTasks.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6 italic">No tasks. Use creator form on the left.</p>
            ) : (
              <div className="space-y-3">
                {customTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border border-neutral-100 dark:border-neutral-900 flex flex-col justify-between space-y-3 transition-all ${
                      task.is_completed ? "opacity-60 bg-neutral-50/20 dark:bg-neutral-950/10" : "bg-neutral-50/50 dark:bg-neutral-950/20"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={task.is_completed}
                          onChange={() => handleToggleComplete(task)}
                          className="w-4 h-4 rounded border-neutral-350 text-violet-600 focus:ring-violet-500 cursor-pointer mt-0.5"
                        />
                        <div>
                          <p className={`text-xs font-bold ${task.is_completed ? "line-through text-neutral-400" : "text-neutral-850 dark:text-neutral-200"}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[10px] text-neutral-450 mt-1 leading-relaxed">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-neutral-400 hover:text-rose-500 p-1 shrink-0 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-900 pt-2 text-[9px] font-mono text-neutral-450 uppercase tracking-wider">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        task.priority === "high"
                          ? "bg-rose-500/10 text-rose-500"
                          : task.priority === "medium"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {task.priority} Priority
                      </span>
                      {task.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
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
