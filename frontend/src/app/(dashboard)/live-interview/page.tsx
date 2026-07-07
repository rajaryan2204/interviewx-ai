"use client";

import React, { useState } from "react";
import { Users, Calendar, Clock, Star, ShieldAlert, Sparkles, Send, CheckCircle2, UserCheck } from "lucide-react";

export default function LiveInterviewComingSoonPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  const mockMentors = [
    {
      name: "Siddharth Sharma",
      role: "Staff Software Engineer",
      company: "Google",
      rating: "4.9",
      reviews: 142,
      tags: ["System Design", "Scalability", "Go/C++"],
      avatarBg: "bg-red-500/10 text-red-500 border-red-500/20",
    },
    {
      name: "Jessica Chen",
      role: "Tech Lead Manager",
      company: "Meta",
      rating: "5.0",
      reviews: 98,
      tags: ["Frontend Architecture", "React", "Behavioral"],
      avatarBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      name: "Arnav Goel",
      role: "Principal Engineer",
      company: "Amazon",
      rating: "4.8",
      reviews: 210,
      tags: ["Mock Interviews", "Distributed Systems", "Java"],
      avatarBg: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    },
  ];

  const mockSlots = [
    { day: "Today", date: "July 7", slots: ["04:00 PM", "07:30 PM"] },
    { day: "Tomorrow", date: "July 8", slots: ["10:00 AM", "02:00 PM", "06:00 PM"] },
    { day: "Thursday", date: "July 9", slots: ["09:00 AM", "03:30 PM"] },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-6 lg:p-10 select-none relative min-h-[calc(100vh-6rem)]">
      {/* Background Decorative Gradients */}
      <div className="absolute top-12 right-12 w-[350px] h-[350px] rounded-full bg-violet-600/5 dark:bg-violet-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-12 left-12 w-[350px] h-[350px] rounded-full bg-indigo-600/5 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto space-y-8 relative z-10 filter blur-[1px] pointer-events-none select-none opacity-40">
        
        {/* Header Dashboard section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-500" />
              1:1 Big Tech Matchup
            </h1>
            <p className="text-xs text-neutral-450 dark:text-neutral-500">
              Schedule direct face-to-face mock runs with staff engineers and verify your readiness.
            </p>
          </div>
          <button className="px-4 py-2 bg-neutral-200 dark:bg-neutral-850 text-xs font-semibold rounded-xl text-neutral-500">
            View Match History
          </button>
        </div>

        {/* Outer Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Mentors selection list */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white uppercase tracking-wider">
              Available Big Tech Interviewers
            </h3>

            <div className="space-y-4">
              {mockMentors.map((mentor, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-850/80 bg-white dark:bg-neutral-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border ${mentor.avatarBg}`}>
                      {mentor.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-neutral-950 dark:text-white">
                          {mentor.name}
                        </h4>
                        <span className="text-[10px] font-black text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/10 uppercase">
                          {mentor.company}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-450">
                        {mentor.role} @ {mentor.company}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {mentor.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[9px] font-medium text-neutral-450 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-2 justify-between sm:justify-start border-t sm:border-t-0 border-neutral-100 dark:border-neutral-900 pt-3 sm:pt-0">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{mentor.rating}</span>
                      <span className="text-neutral-400 font-medium">({mentor.reviews})</span>
                    </div>
                    <button className="px-3.5 py-1.5 bg-violet-600 text-white rounded-xl text-[10px] font-bold">
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Calendar slots mockup */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white uppercase tracking-wider">
              Time Slot Availability
            </h3>

            <div className="p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-850/80 bg-white dark:bg-neutral-950/40 space-y-6">
              {mockSlots.map((daySlot, idx) => (
                <div key={idx} className="space-y-2.5 text-left pb-4 border-b border-neutral-100 dark:border-neutral-900 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {daySlot.day}
                    </span>
                    <span className="text-[10px] text-neutral-450 font-medium">
                      {daySlot.date}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {daySlot.slots.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-850 text-[10px] text-neutral-450 dark:text-neutral-400 font-medium bg-neutral-50/50 dark:bg-neutral-950/60"
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Foreground Coming Soon Overlay Panel */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 backdrop-blur-xl rounded-3xl p-8 w-full max-w-xl shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-250">
          
          {/* Logo & Headline */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/25 uppercase tracking-widest">
              ⚡ COMING SOON ⚡
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white pt-1">
              Live 1:1 Big Tech Matchups
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed max-w-sm">
              We are currently onboarding staff engineers and tech leads from Google, Meta, Amazon, and Netflix to deliver high-fidelity live simulated interviews.
            </p>
          </div>

          {/* Waitlist Subscription Section */}
          <div className="bg-neutral-50/50 dark:bg-neutral-950/40 border border-neutral-150 dark:border-neutral-850 p-6 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-neutral-950 dark:text-white">
                Join the Early Access Waiting List
              </h4>
              <p className="text-[10px] text-neutral-450 dark:text-neutral-500">
                Get notified as soon as matchmaking starts and secure special early adopter pricing.
              </p>
            </div>

            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[11px] font-bold">You've successfully joined the waitlist!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 text-xs text-neutral-950 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-550 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition shadow-lg shadow-violet-600/20 flex items-center gap-1 shrink-0"
                >
                  Join List
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>

          {/* Hiring Call-to-action */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdHZDbvkPOF4HtLPkrqiMdXSuiiORPgQzz9sTZnCrOxUI6kJw/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500 hover:underline transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Are you a senior engineer? Join as an interviewer</span>
          </a>

        </div>
      </div>
    </div>
  );
}
