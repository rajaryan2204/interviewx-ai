"use client";

import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, Link as LinkIcon, Plus, Trash2, Edit2, X } from "lucide-react";
import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  cancelCalendarEvent,
} from "@/lib/productivity-api";
import type { CalendarEventResponse } from "@/types/productivity";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "agenda">("month");

  // Form states for Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [startTimeStr, setStartTimeStr] = useState("10:00");
  const [endTimeStr, setEndTimeStr] = useState("11:00");
  const [eventType, setEventType] = useState<"interview" | "practice" | "custom">("interview");
  const [meetingLink, setMeetingLink] = useState("");

  const [error, setError] = useState<string | null>(null);

  const fetchEvents = () => {
    listCalendarEvents()
      .then(setEvents)
      .catch((err) => console.error("Error loading events:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedEventId(null);
    setTitle("");
    setDescription("");
    const today = new Date();
    setDateStr(today.toISOString().split("T")[0]);
    setStartTimeStr("10:00");
    setEndTimeStr("11:00");
    setEventType("interview");
    setMeetingLink("");
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (event: CalendarEventResponse) => {
    setIsEditing(true);
    setSelectedEventId(event.id);
    setTitle(event.title);
    setDescription(event.description || "");
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    setDateStr(start.toISOString().split("T")[0]);
    setStartTimeStr(start.toTimeString().split(" ")[0].slice(0, 5));
    setEndTimeStr(end.toTimeString().split(" ")[0].slice(0, 5));
    setEventType(event.type);
    setMeetingLink(event.meeting_link || "");
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const startDateTime = new Date(`${dateStr}T${startTimeStr}`);
    const endDateTime = new Date(`${dateStr}T${endTimeStr}`);

    if (endDateTime <= startDateTime) {
      setError("End time must be after start time.");
      return;
    }

    try {
      if (isEditing && selectedEventId) {
        await updateCalendarEvent(selectedEventId, {
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          type: eventType,
          meeting_link: meetingLink || undefined,
        });
      } else {
        await createCalendarEvent({
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          type: eventType,
          meeting_link: meetingLink,
        });
      }
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save event.";
      setError(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this event?")) return;
    try {
      await cancelCalendarEvent(id);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper arrays for calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    // Pad previous month days
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
            <CalendarIcon className="h-7 w-7 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Interview Calendar</h1>
            <p className="text-sm text-neutral-500">Coordinate scheduled recruiter evaluations and daily prep agendas</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Schedule Session
        </button>
      </div>

      {/* Control panel view selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700">Prev</button>
          <span className="font-bold text-sm min-w-[120px] text-center">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button onClick={nextMonth} className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700">Next</button>
        </div>

        <div className="flex items-center bg-neutral-100 dark:bg-neutral-850 p-1 rounded-xl">
          {(["month", "week", "agenda"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                view === v
                  ? "bg-white dark:bg-neutral-900 shadow text-violet-600"
                  : "text-neutral-450 hover:text-neutral-850"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Container */}
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6">
          {view === "month" && (
            <div>
              {/* Days header */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-neutral-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>
              {/* Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), day));
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={idx}
                      className={`min-h-[100px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                        isCurrentMonth
                          ? "bg-neutral-50/50 dark:bg-neutral-950/20 border-neutral-200/40 dark:border-neutral-800/40"
                          : "bg-neutral-100/10 dark:bg-neutral-900/10 border-neutral-200/10 dark:border-neutral-800/10 opacity-40"
                      }`}
                    >
                      <span className="text-xs font-bold font-mono text-neutral-400">{day.getDate()}</span>
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            onClick={() => handleOpenEdit(e)}
                            className={`text-[10px] p-1 rounded font-semibold truncate cursor-pointer ${
                              e.type === "interview"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : e.type === "practice"
                                ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                                : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-neutral-400 text-center italic">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "week" && (
            <div className="space-y-6">
              {/* Render horizontal days of current week */}
              <div className="grid grid-cols-7 gap-4">
                {days.slice(0, 7).map((day, idx) => {
                  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), day));
                  return (
                    <div key={idx} className="border border-neutral-200/40 dark:border-neutral-800/40 rounded-2xl p-3 bg-neutral-50/30 dark:bg-neutral-950/20 space-y-3 min-h-[250px]">
                      <p className="font-bold text-xs text-neutral-400 uppercase font-mono tracking-wider">
                        {day.toLocaleDateString("default", { weekday: "short" })} {day.getDate()}
                      </p>
                      <div className="space-y-2">
                        {dayEvents.length === 0 ? (
                          <p className="text-[10px] text-neutral-400 italic">No events</p>
                        ) : (
                          dayEvents.map((e) => (
                            <div
                              key={e.id}
                              onClick={() => handleOpenEdit(e)}
                              className={`p-2.5 rounded-xl border cursor-pointer space-y-1 hover:scale-[1.02] transition-all ${
                                e.type === "interview"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                  : e.type === "practice"
                                  ? "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400"
                                  : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              <p className="font-bold text-xs truncate">{e.title}</p>
                              <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-mono">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(e.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "agenda" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-neutral-850 dark:text-white uppercase tracking-wider mb-4">
                Upcoming Preparation Agenda
              </h2>
              {events.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-12">No scheduled events found.</p>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                  {events.map((e) => (
                    <div key={e.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`rounded-xl p-3 shrink-0 ${
                          e.type === "interview"
                            ? "bg-emerald-500/15 text-emerald-500"
                            : e.type === "practice"
                            ? "bg-violet-500/15 text-violet-500"
                            : "bg-blue-500/15 text-blue-500"
                        }`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-neutral-850 dark:text-neutral-200">{e.title}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{e.description || "No description provided."}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-550 font-mono">
                            <span>Date: {new Date(e.start_time).toLocaleDateString()}</span>
                            <span>Time: {new Date(e.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(e.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {e.meeting_link && (
                              <a href={e.meeting_link} target="_blank" rel="noreferrer" className="text-violet-500 flex items-center gap-1 hover:underline">
                                <LinkIcon className="w-3 h-3" /> Join
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-2 text-neutral-450 hover:text-indigo-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
                          title="Reschedule Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-2 text-neutral-450 hover:text-rose-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
                          title="Cancel Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold">{isEditing ? "Reschedule Session" : "Schedule Preparation Session"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Session Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. System Design Mock w/ Recruiter"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes, prep syllabus, or links..."
                  rows={2}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as "interview" | "practice" | "custom")}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm"
                  >
                    <option value="interview">Recruiter Mock</option>
                    <option value="practice">Custom Practice</option>
                    <option value="custom">General prep</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Meeting Link</label>
                  <input
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="Zoom or Google Meet link..."
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 px-3 text-sm"
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                {isEditing ? "Apply Rescheduling" : "Schedule Event"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
