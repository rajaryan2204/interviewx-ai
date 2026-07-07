"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  History,
  Trash2,
  AlertTriangle,
  FileText,
  FilePlus,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ResumeReport, ResumeAnalysis } from "@/components/resume/ResumeReport";
import UpgradeModal from "@/components/UpgradeModal";

interface ResumeSummary {
  id: number;
  file_name: string;
  uploaded_at: string;
  analysis: ResumeAnalysis;
}

interface ResumeDetail extends ResumeSummary {
  parsed_text: string;
}

export default function ResumePage() {
  const [history, setHistory] = useState<ResumeSummary[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDetail | null>(null);

  // States
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchHistory() {
    setLoadingHistory(true);
    setError(null);
    try {
      const response = await apiFetch("/api/resume/history");
      const data = await response.json();
      setHistory(data);

      // Auto-select the most recent resume if available and nothing is selected
      if (data.length > 0 && !selectedResume) {
        fetchDetail(data[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to load resume history.");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function fetchDetail(id: number) {
    setLoadingDetail(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/resume/${id}`);
      const data = await response.json();
      setSelectedResume(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to load resume details.");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleUploadFile(file: File) {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Unsupported file format. Please upload a PDF resume only.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiFetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      // Update history list
      setHistory((prev) => [data, ...prev]);
      // Select the new uploaded resume
      await fetchDetail(data.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("limit") || msg.includes("Upgrade") || msg.includes("limit reached")) {
        setIsUpgradeOpen(true);
      } else {
        setError(msg || "Error analyzing resume.");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation(); // Avoid selecting the item while deleting
    if (!confirm("Are you sure you want to delete this resume analysis?")) return;

    setError(null);
    try {
      await apiFetch(`/api/resume/${id}`, { method: "DELETE" });

      // Remove from history
      setHistory((prev) => prev.filter((r) => r.id !== id));

      // Reset selected resume if it was the one deleted
      if (selectedResume?.id === id) {
        setSelectedResume(null);
        // Auto-select next one if history still has items
        const remaining = history.filter((r) => r.id !== id);
        if (remaining.length > 0) {
          fetchDetail(remaining[0].id);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to delete resume.");
    }
  }

  // Drag and Drop triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Load history on mount
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchHistory();
    });
    return () => cancelAnimationFrame(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-neutral-900 select-none">
      {/* Hidden input for upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="application/pdf"
        className="hidden"
      />

      {/* Left Sidebar Panel: History & Upload Actions */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-200/60 dark:border-neutral-800/60 flex flex-col justify-between shrink-0 bg-neutral-50/20 dark:bg-neutral-950/20 h-auto md:h-full overflow-hidden">
        {/* Header and trigger */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Upload History
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchHistory}
              className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            onClick={triggerFileInput}
            disabled={uploading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/10 rounded-xl h-10 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing PDF...</span>
              </>
            ) : (
              <>
                <FilePlus className="w-4 h-4" />
                <span>Upload Resume</span>
              </>
            )}
          </Button>
        </div>

        {/* History Scroll List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {loadingHistory ? (
            <div className="flex flex-col gap-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 px-4">
              <FileText className="w-8 h-8 text-neutral-350 dark:text-neutral-600" />
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                No analyzed resumes found. Upload a PDF to start.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {history.map((resume) => {
                const isActive = selectedResume?.id === resume.id;
                return (
                  <div
                    key={resume.id}
                    onClick={() => fetchDetail(resume.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border group ${
                      isActive
                        ? "bg-violet-600/5 dark:bg-violet-500/10 border-violet-500/40 text-neutral-900 dark:text-white"
                        : "bg-transparent border-transparent text-neutral-550 dark:text-neutral-400 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/40 hover:text-neutral-900 dark:hover:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className={`w-4 h-4 shrink-0 ${isActive ? "text-violet-500" : "text-neutral-400"}`} />
                      <div className="overflow-hidden space-y-0.5 text-left">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {resume.file_name}
                        </p>
                        <p className="text-[9px] text-neutral-400 font-medium">
                          {new Date(resume.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, resume.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-550/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Right Content Panel: Analyzer Drag Drop & Selected Report */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 p-6 md:p-8">
        {/* Error Alert bar */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/35 text-red-650 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Resume Analysis report view */}
        {loadingDetail ? (
          <div className="flex flex-col gap-6 animate-pulse select-none">
            <div className="h-44 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
              <div className="md:col-span-2 h-64 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
            </div>
          </div>
        ) : selectedResume ? (
          <ResumeReport
            fileName={selectedResume.file_name}
            uploadedAt={selectedResume.uploaded_at}
            analysis={selectedResume.analysis}
            parsedText={selectedResume.parsed_text}
          />
        ) : (
          /* Empty / Initial Upload Dropzone View */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`h-full min-h-[350px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 cursor-pointer select-none transition-all ${
              dragOver
                ? "border-violet-500 bg-violet-500/5"
                : "border-neutral-250 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-950/10 hover:border-neutral-350 dark:hover:border-neutral-700"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                  <Sparkles className="w-5 h-5 text-violet-500 absolute animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-white">
                    Parsing Document Semantics...
                  </p>
                  <p className="text-xs text-neutral-450 dark:text-neutral-500">
                    Running rule-based parser structure scoring engines
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 max-w-sm">
                <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-950 text-neutral-400 border border-neutral-200/50 dark:border-neutral-800/30">
                  <Upload className="w-8 h-8 text-violet-500" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-white">
                    Drag and drop your resume here, or{" "}
                    <span className="text-violet-500 hover:text-violet-600 font-semibold underline">
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-neutral-450 dark:text-neutral-500 leading-normal">
                    Format: PDF only. Maximum size: 5MB. Files are analyzed
                    automatically against ATS criteria guidelines.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        title="Resume Audits Limit Reached"
        description="You've reached your free plan limit for resume reviews. Please upgrade to the Basic or Pro plan to unlock unlimited uploads!"
      />
    </div>
  );
}
