"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Expand,
  Minus,
  Plus,
  Shrink,
} from "lucide-react";
import type { editor } from "monaco-editor";

import type { Language } from "@/types/coding";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm text-zinc-400">Loading editor…</span>
      </div>
    </div>
  ),
});

const LANGUAGE_LABELS: Record<Language, string> = {
  python: "Python 3",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
  c: "C",
};

const MONACO_LANGUAGE: Record<Language, string> = {
  python: "python",
  javascript: "javascript",
  java: "java",
  cpp: "cpp",
  c: "c",
};

interface CodeEditorProps {
  value: string;
  language: Language;
  availableLanguages?: Language[];
  fontSize?: number;
  theme?: "vs-dark" | "light";
  readOnly?: boolean;
  onChange?: (code: string) => void;
  onLanguageChange?: (lang: Language) => void;
}

export default function CodeEditor({
  value,
  language,
  availableLanguages = ["python", "javascript", "java", "cpp", "c"],
  fontSize = 14,
  theme = "vs-dark",
  readOnly = false,
  onChange,
  onLanguageChange,
}: CodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [langOpen, setLangOpen] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEditorDidMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;
    },
    []
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        containerRef.current?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-xl ${
        isFullscreen ? "h-screen w-screen" : "h-full"
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#252526] px-3 py-2">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            {LANGUAGE_LABELS[language]}
            <ChevronDown className="h-3.5 w-3.5 text-white/50" />
          </button>
          {langOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-white/10 bg-[#2d2d2d] shadow-2xl">
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onLanguageChange?.(lang);
                    setLangOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-white/10 ${
                    lang === language ? "text-blue-400" : "text-white/80"
                  }`}
                >
                  {LANGUAGE_LABELS[lang]}
                  {lang === language && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Font size */}
          <div className="flex items-center gap-0.5 rounded-md bg-white/5 px-1">
            <button
              onClick={() => setLocalFontSize((s) => Math.max(10, s - 1))}
              className="p-1 text-white/60 transition hover:text-white"
              title="Decrease font size"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[2rem] text-center text-xs text-white/50">
              {localFontSize}
            </span>
            <button
              onClick={() => setLocalFontSize((s) => Math.min(24, s + 1))}
              className="p-1 text-white/60 transition hover:text-white"
              title="Increase font size"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Shrink className="h-4 w-4" />
            ) : (
              <Expand className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="min-h-0 flex-1">
        <MonacoEditor
          height="100%"
          language={MONACO_LANGUAGE[language]}
          value={value}
          theme={theme === "vs-dark" ? "vs-dark" : "light"}
          onChange={(val) => onChange?.(val ?? "")}
          onMount={handleEditorDidMount}
          options={{
            fontSize: localFontSize,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            readOnly,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 4,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "gutter",
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
