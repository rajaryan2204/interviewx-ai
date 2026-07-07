"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  Check,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onMenuToggle: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Interview Scheduled",
      message: "Your Mock Coding Loop is scheduled in 2 hours.",
      time: "2h ago",
      read: false,
    },
    {
      id: "2",
      title: "Score Generated",
      message: "Your System Design score report has been analyzed.",
      time: "1d ago",
      read: false,
    },
    {
      id: "3",
      title: "Resume Verified",
      message: "Resume analysis successfully indexed context variables.",
      time: "3d ago",
      read: true,
    },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const actionsList = [
    { name: "Go to Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Analyze Resume", path: "/resume", icon: "📄" },
    { name: "Mock Interviews", path: "/interview", icon: "💼" },
    { name: "Coding Practice", path: "/coding", icon: "💻" },
    { name: "Live 1:1 Matchup", path: "/live-interview", icon: "👥" },
    { name: "Calendar Schedule", path: "/calendar", icon: "📅" },
    { name: "Milestone Goals", path: "/goals", icon: "🎯" },
    { name: "Task Management", path: "/tasks", icon: "✅" },
    { name: "Upgrade Pricing Tiers", path: "/pricing", icon: "✨" },
    { name: "User Account Settings", path: "/settings", icon: "⚙️" },
  ];

  const filteredActions = actionsList.filter((action) =>
    action.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const toggleReadStatus = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  interface Breadcrumb {
    label: string;
    path?: string;
    active: boolean;
  }

  // Dynamic breadcrumbs based on route
  const getBreadcrumbs = (): Breadcrumb[] => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Home", active: true }];

    return [
      { label: "Home", path: "/", active: false },
      ...segments.map((seg, i) => {
        const label = seg.charAt(0).toUpperCase() + seg.slice(1);
        const path = "/" + segments.slice(0, i + 1).join("/");
        const active = i === segments.length - 1;
        return { label, path, active };
      }),
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="sticky top-0 z-20 bg-white/10 dark:bg-neutral-950/10 backdrop-blur-sm pt-3 pr-3">
      <header className="h-14 px-6 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-xl flex items-center justify-between shadow-xl select-none">
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="md:hidden h-9 w-9 p-0 text-neutral-500 hover:text-neutral-950 dark:hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <nav className="hidden sm:flex items-center gap-1.5 text-xs font-medium select-none">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="text-neutral-400 dark:text-neutral-600">/</span>
              )}
              {crumb.active ? (
                <span className="text-neutral-850 dark:text-neutral-200 font-semibold">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.path || "#"}
                  className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right side: Search, Theme, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Mock Search Bar */}
        <div className="relative hidden md:block select-none">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dashboard... (Ctrl+K)"
            onClick={() => setShowCommandPalette(true)}
            readOnly
            className="w-64 bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl py-1.5 pl-9 pr-8 text-xs text-neutral-850 dark:text-neutral-200 placeholder-neutral-500 focus:outline-none cursor-pointer hover:bg-neutral-200/40 dark:hover:bg-neutral-850/50 transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 border border-neutral-300 dark:border-neutral-850 bg-white dark:bg-neutral-800 text-[10px] text-neutral-400 px-1.5 py-0.5 rounded-lg font-mono">
            ⌘K
          </div>
        </div>

        {/* Command Palette Overlay Modal */}
        {mounted && createPortal(
          <AnimatePresence>
            {showCommandPalette && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden"
                >
                  <div className="relative flex items-center mb-4">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type to search spaces..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-2xl py-2.5 pl-10 pr-10 text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <button
                      onClick={() => setShowCommandPalette(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-lg"
                    >
                      ESC
                    </button>
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {filteredActions.length === 0 ? (
                      <p className="text-[10px] text-neutral-500 text-center py-4">
                        No results matched your search.
                      </p>
                    ) : (
                      filteredActions.map((action, idx) => (
                        <Link key={idx} href={action.path} onClick={() => setShowCommandPalette(false)}>
                          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-semibold transition-colors">
                            <span className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400">
                              {action.icon}
                            </span>
                            <span>{action.name}</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Theme Switcher Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 p-0 text-neutral-500 hover:text-neutral-950 dark:hover:text-white rounded-xl"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="h-9 w-9 p-0 text-neutral-500 hover:text-neutral-950 dark:hover:text-white rounded-xl relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-violet-600 rounded-full border border-white dark:border-neutral-950" />
            )}
          </Button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-4 shadow-xl z-30 space-y-3"
              >
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800/50">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-violet-500 hover:text-violet-600 font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => toggleReadStatus(notif.id)}
                      className={`flex flex-col gap-0.5 p-2 rounded-xl cursor-pointer transition-colors relative ${
                        notif.read
                          ? "bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30"
                          : "bg-neutral-100/50 dark:bg-neutral-900/60 border border-neutral-200/30 dark:border-neutral-800/20 hover:bg-neutral-150/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs ${
                            notif.read
                              ? "text-neutral-700 dark:text-neutral-300"
                              : "text-neutral-900 dark:text-white font-semibold"
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-neutral-400">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-550 dark:text-neutral-500 leading-normal">
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <div className="absolute right-2.5 top-[40%] flex items-center justify-center text-violet-500">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Menu Icon & Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 h-9 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-850 px-2.5"
          >
            <div className="w-6 h-6 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-xs font-semibold flex items-center justify-center shrink-0 select-none">
              {(user?.full_name || user?.email || "C").charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </Button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-56 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-2 shadow-xl z-30 select-none"
              >
                {/* Account Details Header */}
                <div className="p-3 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-col gap-0.5">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    {user?.full_name || "Candidate"}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="flex flex-col gap-0.5 py-1">
                  <Link href="/profile" passHref>
                    <div
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-350 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-850/50 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </div>
                  </Link>

                  <Link href="/settings" passHref>
                    <div
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-350 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-850/50 cursor-pointer"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Account Settings
                    </div>
                  </Link>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800/50 pt-1">
                  <div
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-xl cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
    </div>
  );
};
export default Navbar;
