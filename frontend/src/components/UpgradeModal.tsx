"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Zap } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = "Premium Upgrade Required",
  description = "You've reached your free plan limit for this feature. Upgrade to Premium to unlock unlimited access, voice simulations, and coding evaluations!",
}: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-6 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-violet-600/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white rounded-full p-1 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 animate-pulse">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 mt-2">
            {title}
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {/* Feature List Preview */}
        <div className="bg-neutral-950/40 border border-neutral-800 p-4 rounded-2xl space-y-2.5 text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>Unlimited AI Mock Interviews (with Audio)</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>Unlimited Coding Challenge Solver runs</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>Unlimited Resume ATS Audit uploads</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={() => {
              onClose();
              router.push("/pricing");
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition shadow-lg shadow-violet-600/20 active:scale-[0.98]"
          >
            Upgrade to Premium Now
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-transparent border border-neutral-800 hover:bg-neutral-800/40 text-xs font-semibold text-neutral-400 hover:text-white transition active:scale-[0.98]"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
