"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  User,
  Bell,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Settings states
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email] = useState(user?.email || "");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [sessionAlerts, setSessionAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(false);

  // Email template preference states
  const [welcomePref, setWelcomePref] = useState(true);
  const [verifyPref, setVerifyPref] = useState(true);
  const [resetPref, setResetPref] = useState(true);
  const [invitePref, setInvitePref] = useState(true);
  const [reminderPref, setReminderPref] = useState(true);
  const [weeklyPref, setWeeklyPref] = useState(true);
  const [monthlyPref, setMonthlyPref] = useState(true);
  const [subPref, setSubPref] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);

    // Simulate API save request delay
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Settings and preferences successfully updated.");

      // Automatically dismiss success alert after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }, 1000);
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl mx-auto">
      <div className="flex flex-col gap-2 select-none">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Account Settings
        </h2>
        <p className="text-sm text-neutral-450 dark:text-neutral-500">
          Manage your profile settings, theme choices, and alert preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Success Banner Notification */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: Profile management */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-5 md:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/30 dark:border-neutral-800/30">
            <User className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Profile details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-neutral-450 dark:text-neutral-450 text-xs">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className="bg-white dark:bg-neutral-950 border-neutral-250 dark:border-neutral-850 text-neutral-900 dark:text-white text-xs rounded-xl focus-visible:ring-violet-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-neutral-450 dark:text-neutral-450 text-xs">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-neutral-100 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-500 text-xs rounded-xl cursor-not-allowed"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 2: Theme preferences Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-5 md:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/30 dark:border-neutral-800/30">
            <Sun className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Theme settings
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.value;

              return (
                <div
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer select-none text-center transition-all ${
                    isSelected
                      ? "bg-violet-500/10 border-violet-500/50 text-violet-600 dark:text-violet-400"
                      : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase">
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Section 3: Notification Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-5 md:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/30 dark:border-neutral-800/30">
            <Bell className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Alert preferences
            </h3>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="emailAlerts"
                checked={emailAlerts}
                onCheckedChange={(checked) => setEmailAlerts(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label
                  htmlFor="emailAlerts"
                  className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  Email Alerts
                </label>
                <p className="text-[10px] text-neutral-400">
                  Receive scores, feedback updates, and interview scheduler emails.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="sessionAlerts"
                checked={sessionAlerts}
                onCheckedChange={(checked) => setSessionAlerts(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label
                  htmlFor="sessionAlerts"
                  className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  Active session status
                </label>
                <p className="text-[10px] text-neutral-400">
                  Alert when access tokens rotate or new active sessions are initialized.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="systemAlerts"
                checked={systemAlerts}
                onCheckedChange={(checked) => setSystemAlerts(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label
                  htmlFor="systemAlerts"
                  className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  Weekly Sandbox summary
                </label>
                <p className="text-[10px] text-neutral-400">
                  Receive weekly consolidated summaries of AI readiness grading values.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 4: Email Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-5 md:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/30 dark:border-neutral-800/30">
            <Bell className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Email Notifications Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="welcomePref"
                checked={welcomePref}
                onCheckedChange={(checked) => setWelcomePref(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label htmlFor="welcomePref" className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 cursor-pointer">
                  Welcome & Onboarding
                </label>
                <p className="text-[10px] text-neutral-400">Receive tips and getting-started tutorials.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="verifyPref"
                checked={verifyPref}
                onCheckedChange={(checked) => setVerifyPref(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label htmlFor="verifyPref" className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 cursor-pointer">
                  Security Verification Logs
                </label>
                <p className="text-[10px] text-neutral-400">Notifications on logins and validation requests.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="resetPref"
                checked={resetPref}
                onCheckedChange={(checked) => setResetPref(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label htmlFor="resetPref" className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 cursor-pointer">
                  Password Recovery Requests
                </label>
                <p className="text-[10px] text-neutral-400">Receive recovery password reset links.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="invitePref"
                checked={invitePref}
                onCheckedChange={(checked) => setInvitePref(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label htmlFor="invitePref" className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 cursor-pointer">
                  Recruiter Invitations
                </label>
                <p className="text-[10px] text-neutral-400">Notifications when recruiters schedule you.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="reminderPref"
                checked={reminderPref}
                onCheckedChange={(checked) => setReminderPref(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label htmlFor="reminderPref" className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 cursor-pointer">
                  Mock Interview Reminders
                </label>
                <p className="text-[10px] text-neutral-400">Notifications on scheduled practice times.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="weeklyPref"
                checked={weeklyPref}
                onCheckedChange={(checked) => setWeeklyPref(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label htmlFor="weeklyPref" className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 cursor-pointer">
                  Weekly Progress Summaries
                </label>
                <p className="text-[10px] text-neutral-400">Consolidated scores and exercise tallies.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="monthlyPref"
                checked={monthlyPref}
                onCheckedChange={(checked) => setMonthlyPref(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label htmlFor="monthlyPref" className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 cursor-pointer">
                  Monthly Growth Newsletter
                </label>
                <p className="text-[10px] text-neutral-400">In-depth development index report.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="subPref"
                checked={subPref}
                onCheckedChange={(checked) => setSubPref(checked === true)}
                className="border-neutral-300 dark:border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <div className="grid gap-1 leading-none">
                <label htmlFor="subPref" className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 cursor-pointer">
                  Subscription Updates & Invoices
                </label>
                <p className="text-[10px] text-neutral-400">Billing statements and tier renewals.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submit Actions */}
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/10 rounded-xl h-10 px-6 active:scale-[0.98] transition-all"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving Preferences...</span>
              </div>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
