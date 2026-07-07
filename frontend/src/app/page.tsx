"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Terminal,
  Sun,
  Moon,
  Sparkles,
  Code,
  Briefcase,
  FileText,
  Users,
  BrainCircuit,
  Zap,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeDoc, setActiveDoc] = useState<"security" | "privacy" | "terms" | null>(null);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  const features = [
    {
      title: "Interactive Coding Sandbox",
      description:
        "Practice algorithmic coding in our dark-adapted IDE. Get evaluations on complexity, memory profiles, and runtime syntax.",
      icon: Code,
      color: "from-blue-600 to-cyan-500",
    },
    {
      title: "AI Voice Mock Interview",
      description:
        "Simulate technical, coding, or behavioral rounds with a real-time voice-interactive conversational AI interviewer.",
      icon: Briefcase,
      color: "from-violet-600 to-fuchsia-500",
    },
    {
      title: "Resume ATS Analyzer",
      description:
        "Upload your resume to parse technical skill gaps, evaluate key highlights, and align content with top-tier job requirements.",
      icon: FileText,
      color: "from-emerald-600 to-teal-500",
    },
    {
      title: "Live 1:1 Tech Matchup",
      description:
        "Book live mockup interview practice slots and get evaluations directly from senior software engineers at top big tech companies.",
      icon: Users,
      color: "from-amber-500 to-orange-500",
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-20 z-0">
        <div className="absolute top-10 left-10 w-[500px] h-[500px] rounded-full bg-violet-600/20 dark:bg-violet-500/25 blur-[120px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-indigo-600/20 dark:bg-indigo-500/25 blur-[120px] animate-pulse [animation-delay:3s]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-neutral-200/50 dark:border-neutral-900 bg-white/75 dark:bg-neutral-950/75 backdrop-blur-xl px-6 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold tracking-wider text-sm bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 to-neutral-500 dark:from-white dark:to-neutral-400 select-none">
            INTERVIEWX AI
          </span>
        </div>

        <div className="flex items-center gap-4">
          {mounted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 p-0 text-neutral-500 hover:text-neutral-950 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5" />
              ) : (
                <Moon className="w-4.5 h-4.5" />
              )}
            </Button>
          )}

          {!isLoading && user ? (
            <Link href="/dashboard">
              <Button className="text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-600/20 rounded-xl h-9.5 px-4 active:scale-[0.98] transition-all">
                Enter Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-350 dark:hover:text-white font-semibold"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="text-xs bg-neutral-950 hover:bg-neutral-850 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold rounded-xl h-9.5 px-4 shadow-md transition-all active:scale-[0.98]">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center max-w-6xl mx-auto px-6 py-20 lg:py-28 text-center gap-20 select-none">
        
        {/* Banner + Heading */}
        <div className="space-y-6 max-w-4xl">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-500" />
              Next-Gen Preparation Sandbox
            </motion.div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.05] bg-clip-text text-transparent bg-gradient-to-b from-neutral-950 to-neutral-500 dark:from-white dark:to-neutral-500">
            Master your technical interview loops.
          </h1>

          <p className="text-neutral-500 dark:text-neutral-450 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Practice mock coding challenges, system design topologies, and real-time verbal interview loops with our advanced sandbox simulator. Get scored on industry standards instantly.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-xl shadow-violet-500/25 h-12 px-8 rounded-2xl active:scale-[0.98] transition-all">
                  Open Workspace Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-xl shadow-violet-500/20 h-12 px-7 rounded-2xl active:scale-[0.98] transition-all">
                    Register Workspace Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="border-neutral-250 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-350 hover:text-neutral-950 dark:hover:text-white h-12 px-7 rounded-2xl shadow-sm transition-all active:scale-[0.98]"
                  >
                    Candidate Log In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left pt-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white/40 dark:bg-neutral-950/30 border border-neutral-200/50 dark:border-neutral-900 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative group hover:border-violet-500/40 dark:hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/[0.02] transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className={`p-3 bg-gradient-to-tr ${feat.color} text-white rounded-2xl inline-block shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {feat.title}
                      </h3>
                      {feat.comingSoon && (
                        <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed font-medium">
                      {feat.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mock Product Dashboard Panel preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full relative rounded-3xl border border-neutral-200 dark:border-neutral-855/80 bg-neutral-100/50 dark:bg-neutral-950/40 p-4 shadow-2xl z-10 overflow-hidden"
        >
          {/* Subtle glow border */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />

          <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 p-6 flex flex-col gap-6 shadow-inner text-left select-none">
            {/* Header bar mock */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800/50">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-violet-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  AI Evaluation Module
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Active Run</span>
              </div>
            </div>

            {/* Content mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-violet-500" />
                    Complexity Evaluation
                  </h4>
                  <p className="text-xs text-neutral-550 dark:text-neutral-450 leading-relaxed font-medium">
                    Analyzing active workspace file... Detected optimal runtime bounds. Target complexity: <code className="text-violet-500 font-bold">O(N log N)</code>. Recommendation: Keep using HashMaps for lookup maps to retain constant write.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[9px] font-bold border border-violet-500/20">
                    HashMap Cache
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold border border-indigo-500/20">
                    O(1) Lookup
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                    Optimized Space
                  </span>
                </div>
              </div>

              {/* Graphical mock metric */}
              <div className="flex items-center justify-center p-4 border border-neutral-200/40 dark:border-neutral-800/40 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-xl relative overflow-hidden">
                <div className="text-center space-y-1 z-10">
                  <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                    9.4 <span className="text-xs text-neutral-400">/ 10</span>
                  </span>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    Coding Complexity Score
                  </p>
                </div>
                {/* Background graphic */}
                <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-violet-500 animate-[spin_10s_linear_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-200/50 dark:border-neutral-900 bg-white dark:bg-neutral-950 px-6 py-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-xs gap-4 transition-colors">
        <div>© 2026 InterviewX AI. Built to the highest SaaS standards.</div>
        <div className="flex gap-6">
          <span onClick={() => setActiveDoc("security")} className="hover:text-neutral-800 dark:hover:text-white cursor-pointer transition-colors">Security</span>
          <span onClick={() => setActiveDoc("privacy")} className="hover:text-neutral-800 dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          <span onClick={() => setActiveDoc("terms")} className="hover:text-neutral-800 dark:hover:text-white cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </footer>

      {activeDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 text-left">
            {/* Close Button */}
            <button
              onClick={() => setActiveDoc(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-950 dark:hover:text-white rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 select-text">
              {activeDoc === "security" && (
                <>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    Security Protocols
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    InterviewX AI is engineered with rigorous data security measures to protect candidate information and code solutions.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Data Encryption</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        All information is encrypted in transit using TLS 1.3 protocols and securely stored at rest using AES-256 standards.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Zero Retention LLM Policy</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        Your resume documents and custom solutions sent to Gemini APIs are processed instantly and are never retained or used to train public LLM models.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Safe Sandbox Execution</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        User-submitted mock codes run in fully isolated, virtual sandbox environments to guarantee secure execution cycles.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeDoc === "privacy" && (
                <>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    Privacy Policy
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    This Privacy Policy outlines how InterviewX AI collects, processes, and protects your information.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Information We Collect</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        We collect your basic registration profile (email and name), active mock interview logs, and resume uploads to deliver scorecard evaluations.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">How We Use Your Data</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        Your data is solely used to calculate performance feedback metrics, generate mock coding diagnostics, and verify workspace session logins.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">No-Sharing Commitment</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        We do not sell or trade your data to marketing agencies. Essential billing flags are processed securely by Razorpay.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeDoc === "terms" && (
                <>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    Terms of Service
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    By registering an account and using the sandbox services of InterviewX AI, you agree to these Terms.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Acceptable Workspace Use</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        You agree to use coding workspaces for practice purposes only. Automated scrapers or high-concurrency loops on playground runtimes are prohibited.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Subscriptions & Limits</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        Premium access is subject to payment tiers managed via Razorpay. Limits reset on a rolling monthly cycle relative to subscription activation dates.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Limitation of Liability</h4>
                      <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal">
                        InterviewX AI provides simulated evaluation scorecards. We are not liable for direct hiring outcomes during your company recruiting loops.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
