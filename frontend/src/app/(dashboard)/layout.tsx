"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, LayoutDashboard, User, Settings as SettingsIcon, LogOut, FileText, Briefcase } from "lucide-react";
import Link from "next/link";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/dashboard/Navbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Resume Analyzer",
      icon: FileText,
      path: "/resume",
    },
    {
      name: "Mock Interview",
      icon: Briefcase,
      path: "/interview",
    },
    {
      name: "Profile",
      icon: User,
      path: "/profile",
    },
    {
      name: "Settings",
      icon: SettingsIcon,
      path: "/settings",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {/* Sidebar Component: Hidden on mobile, visible on desktop */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />

        {/* Mobile Menu Drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Semi-transparent backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black z-40 md:hidden"
              />

              {/* Sidebar Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-64 bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 z-50 p-6 flex flex-col justify-between md:hidden"
              >
                <div className="space-y-8">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md">
                        <Terminal className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold tracking-wider text-xs">
                        INTERVIEWX AI
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path;

                      return (
                        <Link key={item.path} href={item.path} passHref>
                          <div
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-neutral-200/50 dark:bg-neutral-900/60 text-neutral-900 dark:text-white"
                                : "text-neutral-500 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 hover:text-neutral-900"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Drawer Footer Actions */}
                <div
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm font-medium text-red-500 hover:bg-red-500/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content Panel Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navbar */}
          <Navbar onMenuToggle={() => setMobileMenuOpen(true)} />

          {/* Main scrollable body */}
          <main className="flex-1 overflow-y-auto mt-3 mr-3 mb-3 bg-white dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl shadow-xl">
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
