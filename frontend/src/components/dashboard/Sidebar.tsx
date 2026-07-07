"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Terminal,
  FileText,
  Briefcase,
  Code2,
  Calendar,
  Target,
  CheckSquare,
  Bell,
  CreditCard,
  Sparkles,
  ChevronDown,
  Layers,
  MessageSquare,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
}) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const getMenuSections = () => {
    if (user?.role === "admin") {
      return [
        {
          group: "Administration",
          items: [
            { name: "Admin Home", icon: LayoutDashboard, path: "/dashboard" },
            { name: "User Management", icon: User, path: "/admin/users" },
            { name: "System Settings", icon: SettingsIcon, path: "/admin/settings" },
            { name: "Audit Logs", icon: Terminal, path: "/admin/logs" },
          ],
        },
      ];
    }
    if (user?.role === "recruiter") {
      return [
        {
          group: "Recruiter Portal",
          items: [
            { name: "Recruiter Home", icon: LayoutDashboard, path: "/dashboard" },
            { name: "Candidates", icon: User, path: "/recruiter/candidates" },
            { name: "Templates", icon: Code2, path: "/recruiter/templates" },
            { name: "Company Profile", icon: Briefcase, path: "/recruiter/company" },
            { name: "Settings", icon: SettingsIcon, path: "/settings" },
          ],
        },
      ];
    }

    // Default candidate
    return [
      {
        group: "Preparation",
        items: [
          { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
          { name: "Resume Analyzer", icon: FileText, path: "/resume" },
          { name: "Mock Interview", icon: Briefcase, path: "/interview" },
          { name: "Coding Practice", icon: Code2, path: "/coding" },
          { name: "Live 1:1 Matchup", icon: User, path: "/live-interview" },
        ],
      },
      {
        group: "Productivity",
        items: [
          { name: "Calendar", icon: Calendar, path: "/calendar" },
          { name: "Goals", icon: Target, path: "/goals" },
          { name: "Tasks", icon: CheckSquare, path: "/tasks" },
          { name: "Notifications", icon: Bell, path: "/notifications" },
        ],
      },
      {
        group: "Billing & Pricing",
        items: [
          { name: "Billing", icon: CreditCard, path: "/billing" },
          { name: "Pricing", icon: Sparkles, path: "/pricing" },
        ],
      },
      {
        group: "Preferences",
        items: [
          { name: "Profile", icon: User, path: "/profile" },
          { name: "Settings", icon: SettingsIcon, path: "/settings" },
          { name: "Share Feedback", icon: MessageSquare, path: "/feedback" },
        ],
      },
    ];
  };

  const sections = getMenuSections();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 76 : 260 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="hidden md:flex flex-col h-[calc(100vh-24px)] my-3 ml-3 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl justify-between select-none z-30 shadow-2xl relative"
    >
      <div className="flex flex-col gap-4 pt-6 overflow-hidden">
        {/* Workspace Switcher */}
        <div className="px-4 relative">
          <div
            onClick={() => !isCollapsed && setShowWorkspaceMenu(!showWorkspaceMenu)}
            className={`flex items-center gap-2.5 p-2 rounded-2xl cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors justify-between ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
                <Layers className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    InterviewX
                  </p>
                  <p className="text-[9px] text-neutral-500 font-medium">
                    Personal Workspace
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
          </div>

          {/* Workspace Dropdown */}
          <AnimatePresence>
            {showWorkspaceMenu && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute left-4 right-4 mt-2 p-1.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 text-xs"
              >
                <div className="p-2 font-bold text-neutral-500 text-[10px] uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-900 mb-1">
                  Switch Workspace
                </div>
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold">
                  Personal Workspace
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator line */}
        <div className="h-[1px] bg-neutral-200/40 dark:bg-neutral-800/40 mx-4" />

        {/* Navigation Section Groupings */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 custom-scrollbar">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              {!isCollapsed && (
                <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-extrabold uppercase tracking-widest pl-3 mb-1">
                  {sec.group}
                </p>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;

                  return (
                    <Link key={item.path} href={item.path} passHref>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all duration-200 relative group ${
                          isActive
                            ? "text-neutral-950 dark:text-white bg-neutral-250/50 dark:bg-neutral-800/50 shadow-inner"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100 hover:bg-neutral-100/40 dark:hover:bg-neutral-900/30"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="active-indicator"
                            className="absolute left-0 w-1 h-5 bg-violet-600 rounded-full"
                          />
                        )}
                        <Icon className="w-4 h-4 shrink-0 text-current" />
                        {!isCollapsed && (
                          <span className="whitespace-nowrap truncate">{item.name}</span>
                        )}

                        {/* Collapsed Tooltip */}
                        {isCollapsed && (
                          <div className="absolute left-16 opacity-0 group-hover:opacity-100 bg-neutral-950 text-white text-[10px] py-1.5 px-3 rounded-xl pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-xl z-40 border border-neutral-800">
                            {item.name}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer User Profile Card */}
      <div className="flex flex-col gap-2 p-3 bg-neutral-50/50 dark:bg-neutral-950/20 border-t border-neutral-200/40 dark:border-neutral-800/40 rounded-b-3xl shrink-0">
        {/* User Card */}
        <div
          className={`flex items-center justify-between p-1.5 rounded-2xl hover:bg-neutral-150/40 dark:hover:bg-neutral-800/30 transition-all ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {user?.full_name?.charAt(0).toUpperCase() || "C"}
            </div>
            {!isCollapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {user?.full_name || "Candidate"}
                </p>
                <p className="text-[9px] text-neutral-500 capitalize">
                  {user?.role || "candidate"}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Creator Watermark */}
        <div className="flex justify-center py-1 select-none">
          <a
            href="https://github.com/rajaryan2204"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            {!isCollapsed ? "Crafted by rajaryan2204" : "RAJ"}
          </a>
        </div>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/30 dark:hover:bg-neutral-800/30 rounded-xl"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Collapse</span>
            </div>
          )}
        </Button>
      </div>
    </motion.aside>
  );
};
export default Sidebar;
