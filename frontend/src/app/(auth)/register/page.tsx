"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Mail, Sparkles, Terminal, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasUpper: false,
    hasDigit: false,
    hasSpecial: false,
    isLong: false,
  });

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    const hasUpper = /[A-Z]/.test(val);
    const hasDigit = /[0-9]/.test(val);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(val);
    const isLong = val.length >= 8;
    
    let score = 0;
    if (hasUpper) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;
    if (isLong) score++;
    
    setPasswordStrength({ score, hasUpper, hasDigit, hasSpecial, isLong });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    // Basic Validation
    if (!email) {
      setValidationError("Email is required.");
      return;
    }
    if (!password) {
      setValidationError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }

    try {
      await register(email, password, fullName || undefined);
    } catch {
      // Handled by AuthContext, displayed below
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-950 text-white overflow-hidden">
      {/* Left side Panel: Decorative Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-900 border-r border-neutral-800 flex-col justify-between p-12 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-600 blur-3xl" />
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            INTERVIEWX AI
          </span>
        </div>

        <div className="relative z-10 my-auto flex flex-col gap-6 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold self-start"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise-Grade Sandbox Preparation
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-bold tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-500"
          >
            Join the elite interview tier.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-neutral-400 leading-relaxed text-sm lg:text-base"
          >
            Create an account to track session performance, unlock code sandboxes,
            and review multi-agent evaluations of your technical responses.
          </motion.p>
        </div>

        <div className="relative z-10 text-xs text-neutral-500 border-t border-neutral-800/80 pt-6">
          © 2026 InterviewX AI. All rights reserved. Production Environment.
        </div>
      </div>

      {/* Right side Panel: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Background glow on mobile */}
        <div className="absolute inset-0 lg:hidden opacity-25">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 shadow-2xl relative z-10"
        >
          <div className="flex flex-col gap-2 text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Create an account
            </h2>
            <p className="text-sm text-neutral-400">
              Get started with your AI preparation workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error notifications */}
            {(validationError || error) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium space-y-1"
              >
                <p>{validationError || error}</p>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-neutral-300 text-xs">
                Full Name (Optional)
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <User className="w-4 h-4" />
                </span>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-violet-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-neutral-300 text-xs">
                Email Address
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <Mail className="w-4 h-4" />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-violet-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-neutral-300 text-xs">
                Password
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-violet-600"
                />
              </div>
              
              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex gap-1.5 h-1">
                    {[1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          idx <= passwordStrength.score
                            ? passwordStrength.score === 1
                              ? "bg-red-500"
                              : passwordStrength.score === 2
                              ? "bg-orange-500"
                              : passwordStrength.score === 3
                              ? "bg-yellow-500"
                              : "bg-emerald-500"
                            : "bg-neutral-800"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>
                      {passwordStrength.score === 1 && "Weak"}
                      {passwordStrength.score === 2 && "Fair"}
                      {passwordStrength.score === 3 && "Good"}
                      {passwordStrength.score === 4 && "Strong"}
                    </span>
                    <span className="flex gap-1">
                      <span className={passwordStrength.isLong ? "text-emerald-400" : ""}>8+ chars</span> •
                      <span className={passwordStrength.hasUpper ? "text-emerald-400" : ""}>A-Z</span> •
                      <span className={passwordStrength.hasDigit ? "text-emerald-400" : ""}>0-9</span> •
                      <span className={passwordStrength.hasSpecial ? "text-emerald-400" : ""}>Symbol</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all duration-300 font-semibold h-10 mt-4 shadow-lg shadow-violet-600/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-neutral-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
