"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Calendar,
  ShieldAlert,
  Award,
  Code,
  Layers,
  HeartHandshake,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  const skillMetrics = [
    { name: "Coding Problems & Algos", score: 85, icon: Code, color: "bg-violet-500" },
    { name: "System Design & Topologies", score: 72, icon: Layers, color: "bg-indigo-500" },
    { name: "Behavioral Alignment", score: 68, icon: HeartHandshake, color: "bg-emerald-500" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm select-none"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center border-4 border-white dark:border-neutral-900 shadow-xl shrink-0">
          {(user?.full_name || user?.email || "C").charAt(0).toUpperCase()}
        </div>

        <div className="space-y-3 flex-1 text-center md:text-left overflow-hidden">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
              {user?.full_name || "Technical Candidate"}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-450 dark:text-neutral-500 font-medium">
              Lead Software Architect track
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-neutral-400" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>
                Joined {user ? new Date(user.created_at).toLocaleDateString() : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
          <Award className="w-4 h-4" />
          Workspace Verified
        </div>
      </motion.div>

      {/* Grid details section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 columns: Skill metrics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Technical Competence Map
            </h3>
            <p className="text-xs text-neutral-450 dark:text-neutral-500">
              Readiness values compiled dynamically from your mock sessions.
            </p>
          </div>

          <div className="space-y-5">
            {skillMetrics.map((skill, idx) => {
              const Icon = skill.icon;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                      <Icon className="w-4 h-4 text-violet-500" />
                      <span>{skill.name}</span>
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {skill.score}%
                    </span>
                  </div>
                  {/* Progress bar container */}
                  <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${skill.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right 1 column: Account Metadata details */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full"
        >
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            Security & Session status
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-neutral-200/30 dark:border-neutral-800/30">
              <span className="text-neutral-450 dark:text-neutral-500">Account Type</span>
              <span className="font-semibold text-neutral-850 dark:text-neutral-200">SaaS Candidate</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-neutral-200/30 dark:border-neutral-800/30">
              <span className="text-neutral-450 dark:text-neutral-500">User Identity</span>
              <span className="font-mono text-neutral-850 dark:text-neutral-200">UID: {user?.id}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-neutral-200/30 dark:border-neutral-800/30">
              <span className="text-neutral-450 dark:text-neutral-500">Workspace status</span>
              <span className="font-semibold text-emerald-500">Active</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-450 dark:text-neutral-500">CORS Handshake</span>
              <span className="font-semibold text-emerald-500">Verified</span>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-[10px] text-neutral-400 leading-normal flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            Your credentials are encrypted using SHA-256 JWT sessions and bcrypt password hashing values.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
