"use client";

import React, { useEffect, useState } from "react";
import { Bell, Flame, Sparkles, Check, CheckCheck, Clock, RefreshCw } from "lucide-react";
import {
  listNotifications,
  markNotificationRead,
  clearAllNotifications,
  listReminders,
  triggerStreakReminder,
  generateSmartReminder,
} from "@/lib/productivity-api";
import type { NotificationResponse, ReminderResponse } from "@/types/productivity";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [reminders, setReminders] = useState<ReminderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Smart AI suggestion states
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [streakCount, setStreakCount] = useState(3); // Mock streak count

  const fetchData = () => {
    Promise.all([listNotifications(), listReminders()])
      .then(([n, r]) => {
        setNotifications(n);
        setReminders(r);

        // Find latest AI suggestion if any exists in reminders history
        const smartRem = r.filter((rem) => rem.reminder_type === "smart" && rem.ai_suggestion);
        if (smartRem.length > 0) {
          setAiSuggestion(smartRem[smartRem.length - 1].ai_suggestion);
        }
      })
      .catch((err) => console.error("Error loading notifications data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAISuggestion = async () => {
    setAiLoading(true);
    try {
      const res = await generateSmartReminder();
      setAiSuggestion(res.ai_suggestion);
      // Refresh reminders list
      const updated = await listReminders();
      setReminders(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleTriggerStreak = async () => {
    try {
      await triggerStreakReminder();
      setStreakCount((prev) => prev + 1);
      const updated = await listReminders();
      setReminders(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <Bell className="h-7 w-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Inbox & Reminders</h1>
          <p className="text-sm text-neutral-500">Examine in-app message logs and review smart preparation prompts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Notification Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/30 dark:border-neutral-800/30">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-neutral-850 dark:text-white">In-App Alerts</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white font-mono">
                    {unreadCount} New
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-500 flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-850" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-12">No notifications found.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all ${
                      notif.is_read
                        ? "bg-neutral-50/20 dark:bg-neutral-950/10 border-neutral-100/30 dark:border-neutral-900/30 opacity-70"
                        : "bg-neutral-50/70 dark:bg-neutral-950/30 border-neutral-150 dark:border-neutral-900"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`text-xs font-bold ${notif.is_read ? "text-neutral-500" : "text-neutral-850 dark:text-neutral-200"}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-neutral-450 leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-neutral-400 font-mono block pt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>

                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-neutral-400 hover:text-violet-500 p-1 shrink-0 transition"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reminder Center & Streak Widget */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Daily Streak Card */}
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm text-center space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-amber-500/10 p-4 ring-4 ring-amber-500/5">
                <Flame className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />
              </div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-neutral-400">Daily Prep Streak</h2>
              <h1 className="text-3xl font-extrabold font-mono text-neutral-850 dark:text-white">
                {streakCount} Days Active
              </h1>
              <p className="text-[11px] text-neutral-400 max-w-[200px]">
                Maintain your momentum! Click below to confirm today&apos;s task activity.
              </p>
            </div>
            <button
              onClick={handleTriggerStreak}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 transition"
            >
              Verify Daily Streak Activity
            </button>
          </div>

          {/* AI Coach Suggestion Card */}
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 backdrop-blur-md p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-violet-500/10">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <h3 className="text-xs font-bold text-neutral-850 dark:text-neutral-200 uppercase tracking-wider">
                AI Coach Smart Planner
              </h3>
            </div>

            {aiSuggestion ? (
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
                <p className="text-xs italic text-neutral-750 dark:text-neutral-350 leading-relaxed font-medium">
                  &ldquo;{aiSuggestion}&rdquo;
                </p>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No AI recommendation targets established yet.</p>
            )}

            <button
              onClick={handleGenerateAISuggestion}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
              {aiLoading ? "Consulting AI Coach..." : "Generate AI Prep Targets"}
            </button>
          </div>

          {/* Reminders Queue */}
          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-850 dark:text-neutral-300 uppercase tracking-wider">
              Reminders Queue ({reminders.length})
            </h3>
            {loading ? (
              <div className="h-10 animate-pulse bg-neutral-100 dark:bg-neutral-850 rounded-xl" />
            ) : reminders.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No pending smart reminders.</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20 flex items-start gap-2.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{rem.title}</p>
                      <p className="text-[9px] text-neutral-450 font-mono mt-0.5">
                        Trigger: {new Date(rem.trigger_time).toLocaleString()}
                      </p>
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
