"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Sparkles, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

function VerifyEmailForm() {
  const { verifyEmail, resendVerification, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleOtpChange = (index: number, val: string) => {
    // Only allow numbers
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      const newOtp = [...otpValues];
      newOtp[index] = "";
      setOtpValues(newOtp);
      return;
    }

    const newOtp = [...otpValues];
    // Take the last digit if multiple are entered
    newOtp[index] = cleanVal.substring(cleanVal.length - 1);
    setOtpValues(newOtp);

    // Auto-focus next input
    if (index < 5 && newOtp[index]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split("");
      setOtpValues(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!email) {
      setValidationError("Email is required.");
      return;
    }

    const fullCode = otpValues.join("");
    if (fullCode.length !== 6) {
      setValidationError("Enter all 6 digits of the verification code.");
      return;
    }

    try {
      await verifyEmail(email, fullCode);
      setSuccessMessage("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      // Handled by AuthContext
    }
  };

  const handleResend = async () => {
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!email) {
      setValidationError("Email is required to resend verification.");
      return;
    }

    try {
      await resendVerification(email);
      setSuccessMessage("A new verification code has been simulated in logs!");
    } catch {
      // Handled by AuthContext
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 rounded-3xl p-8 shadow-2xl relative z-10"
    >
      <div className="flex flex-col gap-2 text-center mb-8">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white mb-2 shadow-lg shadow-violet-500/20">
          <Mail className="w-5 h-5 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Verify your email
        </h2>
        <p className="text-xs text-neutral-400 max-w-[280px] mx-auto leading-relaxed">
          We have generated a 6-digit verification code. Please enter it below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {(validationError || error) && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium">
            {validationError || error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium">
            {successMessage}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-350 text-xs font-semibold">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !!emailParam}
            className="bg-neutral-950/50 border-neutral-800 text-white placeholder-neutral-600 focus-visible:ring-violet-600 rounded-xl h-11"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-neutral-350 text-xs font-semibold">
            6-Digit Verification Code
          </Label>
          <div className="flex justify-between gap-2.5">
            {otpValues.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                disabled={isLoading}
                className="w-12 h-14 bg-neutral-950/60 border border-neutral-800 text-white text-center text-xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all select-none font-mono"
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all duration-300 font-semibold h-11 rounded-xl shadow-lg shadow-violet-600/20 active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Verifying...</span>
            </div>
          ) : (
            "Verify Account"
          )}
        </Button>
      </form>

      <div className="flex flex-col gap-3 items-center mt-8 pt-4 border-t border-neutral-800/50">
        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading}
          className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors"
        >
          Resend verification code
        </button>
        <span className="text-[10px] text-neutral-500 text-center leading-normal max-w-[280px]">
          Remember to check your terminal server logs for simulated OTPs.
        </span>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex bg-neutral-950 text-white overflow-hidden justify-center items-center p-6 relative">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600 blur-3xl" />
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center gap-2 text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
          <span>Loading...</span>
        </div>
      }>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
