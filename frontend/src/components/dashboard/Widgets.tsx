"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Terminal,
  Play,
  FileText,
  Upload,
  Cpu,
  Brain,
  Code,
  Layers,
  CheckCircle2,
  HelpCircle,
  Activity,
  ArrowRight,
  Calendar,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

// 1. DashboardHero: Wide premium control panel with interactive session setup
export const DashboardHero: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const name = user?.full_name || "Candidate";
  const [submitting, setSubmitting] = useState(false);

  // Quick session launch configuration
  const [selectedTrack, setSelectedTrack] = useState("Technical");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Medium");

  const handleQuickLaunch = async () => {
    setSubmitting(true);
    try {
      const payload = {
        job_role: "Software Engineer",
        company: "InterviewX Sandbox",
        experience_level: "Mid-Level",
        interview_type: selectedTrack,
        difficulty: selectedDifficulty,
        question_count: 5,
        duration_minutes: 15,
        language: "English",
        resume_id: null,
      };

      const response = await apiFetch("/api/interview/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/interview/${data.id}`);
      } else {
        router.push("/interview");
      }
    } catch (err) {
      console.error(err);
      router.push("/interview");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-neutral-900 dark:bg-neutral-950 border border-neutral-800 p-8 shadow-2xl flex flex-col justify-between group">
      {/* Background glow meshes */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-[90px] pointer-events-none animate-radial-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none animate-radial-pulse [animation-delay:4s]" />
      
      {/* Luxury blueprint grid backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10 items-center">
        {/* Left greeting and telemetry info */}
        <div className="lg:col-span-3 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-wider border border-violet-500/20">
            <Cpu className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
            AI Simulation Engine Live
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Let&apos;s build your preparation, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-400">{name}</span>
            </h1>
            <p className="text-neutral-450 text-xs sm:text-sm max-w-md leading-relaxed font-medium">
              Configure and deploy a simulated sandbox session in seconds. Experience real-time feedback loops powered by advanced speech models and coding judges.
            </p>
          </div>
        </div>

        {/* Right mini session deployment controller */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800 shadow-xl space-y-5 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Quick Simulation Launch
          </h3>
          
          <div className="space-y-4">
            {/* Track Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Select Track</span>
              <div className="grid grid-cols-3 gap-2">
                {["Technical", "Behavioral", "System Design"].map((track) => (
                  <button
                    key={track}
                    onClick={() => setSelectedTrack(track)}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all duration-200 ${
                      selectedTrack === track
                        ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/10"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {track === "Technical" ? "Coding" : track === "Behavioral" ? "Behavioral" : "Sys Design"}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Difficulty</span>
              <div className="grid grid-cols-3 gap-2">
                {["Easy", "Medium", "Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all duration-200 ${
                      selectedDifficulty === diff
                        ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/10"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            <Button
              onClick={handleQuickLaunch}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold text-xs h-10 rounded-xl mt-2 active:scale-[0.98] transition-all shadow-md shadow-violet-600/10"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Deploying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Interview Simulation</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. TelemetryStrip: Sleek horizontal data bar
export const TelemetryStrip: React.FC<{
  interviewsConducted?: number;
  codingSolved?: number;
  avgScore?: number;
}> = ({ interviewsConducted = 0, codingSolved = 0, avgScore = 0.0 }) => {
  const metrics = [
    { label: "Completed Simulations", value: interviewsConducted, desc: "Evaluated by AI" },
    { label: "Algorithms Solved", value: `${codingSolved}/20`, desc: "Code exercises" },
    { label: "Current Average Score", value: `${avgScore}/10`, desc: "Readiness score" },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900/30 border border-neutral-150 dark:border-neutral-850 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200/50 dark:divide-neutral-850 gap-4 md:gap-0">
        {metrics.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between px-6 py-2 md:py-0 text-left">
            <div className="space-y-0.5">
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-extrabold uppercase tracking-widest">
                {item.label}
              </span>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                {item.desc}
              </p>
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-mono">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. PreparationRoadmap: Step-by-step visual preparation tracker
export const PreparationRoadmap: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Analyze Candidate Profile",
      desc: "Upload resume to parse technical highlights and locate skill gaps.",
      active: true,
      done: true,
      link: "/resume",
    },
    {
      num: "02",
      title: "Interactive Coding Mocks",
      desc: "Practice algorithmic runtime scenarios in our dark-adapted IDE workspace.",
      active: true,
      done: false,
      link: "/coding",
    },
    {
      num: "03",
      title: "Voice Interview Simulation",
      desc: "Run complete verbal evaluations with real-time feedback loops.",
      active: false,
      done: false,
      link: "/interview",
    },
    {
      num: "04",
      title: "Live 1:1 Tech Interview",
      desc: "Simulate a live 1:1 evaluation session with a senior engineer from top big tech companies.",
      active: false,
      done: false,
      link: "#",
      comingSoon: true,
    },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/60 rounded-3xl p-7 shadow-sm space-y-6 text-left">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          Preparation Journey
        </h3>
        <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20 uppercase tracking-widest">
          Recommended
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {steps.map((step, idx) => {
          const CardContent = (
            <div className="relative p-5 rounded-2xl border border-neutral-150 dark:border-neutral-850/80 bg-neutral-50/50 dark:bg-neutral-950/40 hover:bg-white dark:hover:bg-neutral-900/50 transition-all duration-300 hover:border-violet-500/30 hover:shadow-md h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-neutral-200 dark:text-neutral-800 font-mono group-hover:text-violet-500/30 transition-colors">
                    {step.num}
                  </span>
                  {step.comingSoon ? (
                    <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                      Coming Soon
                    </span>
                  ) : step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-violet-500 transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-neutral-450 dark:text-neutral-500 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>

              {step.comingSoon ? (
                <div className="text-[9px] font-bold text-neutral-400 dark:text-neutral-600 mt-4 uppercase tracking-wider">
                  Locked
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[9px] font-bold text-violet-600 dark:text-violet-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Navigate</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );

          if (step.comingSoon) {
            return (
              <div key={idx} className="block group cursor-not-allowed">
                {CardContent}
              </div>
            );
          }

          return (
            <a key={idx} href={step.link} className="block group">
              {CardContent}
            </a>
          );
        })}
      </div>
    </div>
  );
};

// 4. InteractiveTerminal: Real-time system activity log
interface ActivityLog {
  id: string;
  activity: string;
  description: string;
  time: string;
}

export const InteractiveTerminal: React.FC<{ logs?: ActivityLog[] }> = ({ logs = [] }) => {
  return (
    <div className="bg-neutral-950 border border-neutral-850 rounded-3xl p-6 shadow-xl space-y-4 text-left relative overflow-hidden font-mono">
      <div className="flex justify-between items-center pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-450">
            System Log Terminal
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
        </div>
      </div>

      <div className="space-y-3.5 max-h-[160px] overflow-y-auto text-[11px] leading-relaxed text-neutral-400">
        {logs.length === 0 ? (
          <p className="text-neutral-600">&gt;_ No active terminal reports.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="space-y-0.5 border-l-2 border-emerald-500/20 pl-3">
              <div className="flex items-center justify-between text-neutral-500 text-[9px]">
                <span>[LOG_REPORT]</span>
                <span>{log.time}</span>
              </div>
              <p className="text-neutral-300 font-semibold">{log.activity}</p>
              <p className="text-neutral-550">{log.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 5. ResumeStatusCard: Mini resume panel
export const ResumeStatusCard: React.FC = () => {
  const [resume, setResume] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const fetchResume = async () => {
      try {
        const res = await apiFetch("/api/resume/history");
        const data = await res.json();
        if (active && data && data.length > 0) {
          setResume(data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchResume();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full space-y-5 text-left">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-neutral-450 dark:text-neutral-500 font-bold uppercase tracking-wider">
          Profile Assessment
        </span>
        {resume ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
            Required
          </span>
        )}
      </div>

      <div className="space-y-4">
        {resume ? (
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-850">
            <FileText className="w-5 h-5 text-violet-500" />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                {resume.file_name}
              </p>
              <p className="text-[9px] text-neutral-550 dark:text-neutral-500">
                Extracted successfully
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-950/20 text-center text-xs text-neutral-500 font-medium">
            No resume profile detected
          </div>
        )}

        <a href="/resume" className="block">
          <Button
            variant="outline"
            className="w-full text-xs border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-950/80 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white rounded-xl h-10 shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 justify-center">
              <Upload className="w-3.5 h-3.5" />
              <span>{resume ? "Update Profile Data" : "Upload Resume Data"}</span>
            </div>
          </Button>
        </a>
      </div>
    </div>
  );
};

// 6. RecentInterviews Widget
export const RecentInterviews: React.FC<{ runs?: any[] }> = ({ runs = [] }) => {
  return (
    <div className="bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/60 rounded-3xl p-7 shadow-sm space-y-6">
      <div className="flex justify-between items-center text-left">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          Recent Interview Runs
        </h3>
        <a href="/interview">
          <Button variant="ghost" size="sm" className="text-xs text-violet-650 dark:text-violet-400 p-0 hover:bg-transparent">
            View history
          </Button>
        </a>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-950/20">
          <Calendar className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
          <p className="text-xs text-neutral-500 font-semibold">No mock run data found.</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50 space-y-2">
          {runs.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group cursor-pointer hover:px-2 rounded-xl transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
              <div className="space-y-1 text-left">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {item.role}
                </p>
                <p className="text-[10px] text-neutral-450 dark:text-neutral-500 font-medium">
                  {item.type} • {item.date}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-250 font-mono">
                  {item.score}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-550/10 text-emerald-600 dark:text-emerald-400 border border-emerald-550/20 uppercase tracking-widest">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
