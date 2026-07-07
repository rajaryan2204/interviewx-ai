"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!email) {
      setValidationError("Email is required.");
      return;
    }

    try {
      await forgotPassword(email);
      setSuccessMessage("If the account exists, a password reset link has been simulated in logs!");
    } catch {
      // Handled by AuthContext
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-950 text-white overflow-hidden justify-center items-center p-6 relative">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col gap-2 text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Forgot password?
          </h2>
          <p className="text-sm text-neutral-400">
            Enter your email to receive a password reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {(validationError || error) && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium">
              {validationError || error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium">
              {successMessage}
            </div>
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all duration-300 font-semibold h-10 mt-2 shadow-lg shadow-violet-600/20 active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Sending link...</span>
              </div>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-neutral-500 mt-6">
          Back to{" "}
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
