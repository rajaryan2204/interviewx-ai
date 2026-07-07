"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";

import {
  DashboardHero,
  TelemetryStrip,
  PreparationRoadmap,
  InteractiveTerminal,
  ResumeStatusCard,
  RecentInterviews,
} from "@/components/dashboard/Widgets";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CandidateDashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        const res = await apiFetch("/api/productivity/dashboard-stats");
        const data = await res.json();
        if (active) setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
        <div className="h-64 bg-neutral-100 dark:bg-neutral-900 rounded-3xl" />
        <div className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-neutral-150 dark:bg-neutral-900 rounded-3xl" />
          <div className="h-64 bg-neutral-150 dark:bg-neutral-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative min-h-[calc(100vh-6rem)]"
    >
      {/* Background Decorative Gradients */}
      <div className="absolute top-12 right-12 w-[350px] h-[350px] rounded-full bg-violet-600/5 dark:bg-violet-500/10 blur-[100px] pointer-events-none animate-radial-pulse" />
      <div className="absolute bottom-12 left-12 w-[350px] h-[350px] rounded-full bg-indigo-600/5 dark:bg-indigo-500/10 blur-[100px] pointer-events-none animate-radial-pulse [animation-delay:4s]" />

      {/* 1. Hero Hub Control Console */}
      <motion.div variants={itemVariants} className="relative z-10">
        <DashboardHero />
      </motion.div>

      {/* 2. Telemetry Metrics strip */}
      <motion.div variants={itemVariants} className="relative z-10">
        <TelemetryStrip
          interviewsConducted={stats?.interviews_conducted}
          codingSolved={stats?.coding_solved}
          avgScore={stats?.avg_score}
        />
      </motion.div>

      {/* 3. Interactive Preparation steps roadmap */}
      <motion.div variants={itemVariants} className="relative z-10">
        <PreparationRoadmap />
      </motion.div>

      {/* 4. Split panel bottom view */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10"
      >
        {/* Left: Recent history and active developer terminal logs */}
        <div className="lg:col-span-2 space-y-6">
          <RecentInterviews runs={stats?.recent_runs} />
          <InteractiveTerminal logs={stats?.activities} />
        </div>

        {/* Right: Assessment parser cards */}
        <div className="space-y-6">
          <ResumeStatusCard />
        </div>
      </motion.div>
    </motion.div>
  );
}
