"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound, Mail, Sparkles, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, oauthLogin, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    try {
      await login(email, password, rememberMe);
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
            Empowered by Advanced Large Language Models
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-bold tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-500"
          >
            Simulate realistic tech interviews.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-neutral-400 leading-relaxed text-sm lg:text-base"
          >
            Practice coding, design systems, and behavioral tracks with real-time
            feedback, architectural scoring, and full-stack session metrics.
          </motion.p>
        </div>

        <div className="relative z-10 text-xs text-neutral-500 border-t border-neutral-800/80 pt-6">
          © 2026 InterviewX AI. All rights reserved. Production Environment.
        </div>
      </div>

      {/* Right side Panel: Login Form */}
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
              Welcome back
            </h2>
            <p className="text-sm text-neutral-400">
              Enter your credentials to access your portal
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
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-neutral-300 text-xs">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-violet-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked === true)
                  }
                  disabled={isLoading}
                  className="border-neutral-800 text-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-neutral-400 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all duration-300 font-semibold h-10 mt-2 shadow-lg shadow-violet-600/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Connecting...</span>
                </div>
              ) : (
                "Log In"
              )}
            </Button>
          </form>

          {/* Social Logins */}
          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-900 px-2 text-neutral-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "391196060819-l3cfrcgh56f9nr5teg5un0o555oibehb.apps.googleusercontent.com";
                  const redirect_uri = `${window.location.origin}/oauth/callback/google`;
                  const scope = "email profile";
                  const response_type = "token";
                  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}&response_type=${response_type}`;
                }}
                className="w-full bg-neutral-950 border-neutral-800 hover:bg-neutral-900 text-neutral-300 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold shadow-md active:scale-[0.99] transition-all"
              >
                <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24c0-1.63-.15-3.2-.43-4.75H24v9h12.75c-.55 2.96-2.22 5.47-4.75 7.16l7.37 5.71C43.7 36.43 46.5 30.82 46.5 24z"/>
                  <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.37-5.71c-2.11 1.41-4.81 2.32-8.52 2.32-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Sign in with Google</span>
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-neutral-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
