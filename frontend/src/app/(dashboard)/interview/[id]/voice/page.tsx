"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  ChevronLeft,
  Settings,
  Loader2,
  Play,
  Pause,
  Info,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AnswerSummary {
  id: number;
  user_answer: string;
  time_taken_seconds: number;
  created_at: string;
}

interface QuestionDetail {
  id: number;
  question_text: string;
  question_order: number;
  topic: string | null;
  correct_answer_guideline: string | null;
  answer: AnswerSummary | null;
}

interface InterviewSession {
  id: number;
  job_role: string;
  company: string | null;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  question_count: number;
  duration_minutes: number;
  status: string;
  current_question_index: number;
  time_remaining_seconds: number;
  questions: QuestionDetail[];
  created_at: string;
}

interface TranscriptMessage {
  sender: "ai" | "candidate";
  text: string;
  timestamp: Date;
  isFollowUp?: boolean;
}

export default function VoiceInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  // Configuration States
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [speechMode, setSpeechMode] = useState<"ptt" | "handsfree">("ptt"); // Push-to-Talk vs Hands-Free
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessingTranscription, setIsProcessingTranscription] = useState(false);
  const [speechEngine, setSpeechEngine] = useState<"browser" | "server">("browser");

  // Timer & Controls
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [speakingTime, setSpeakingTime] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  // Transcript logs
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isFollowUpActive, setIsFollowUpActive] = useState(false);
  const [activeFollowUpId, setActiveFollowUpId] = useState<number | null>(null);

  // Settings Drawer Toggle
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Refs for audio processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speakingTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hands-free silence detection ref
  const silenceStartRef = useRef<number | null>(null);
  const pttIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stable Callback Refs to avoid dependency warnings and hoisting issues
  const handleAutoEndInterviewRef = useRef<() => Promise<void>>(null as unknown as () => Promise<void>);
  const speakTextRef = useRef<(text: string) => Promise<void>>(null as unknown as (text: string) => Promise<void>);

  // 1. Fetch State & Session Recovery
  useEffect(() => {
    let active = true;
    async function loadSession() {
      setError(null);
      try {
        const response = await apiFetch(`/api/interview/${interviewId}`);
        if (!response.ok) {
          throw new Error("Failed to load session configurations.");
        }
        const data: InterviewSession = await response.json();
        if (!active) return;
        setSession(data);
        setCurrentIndex(data.current_question_index);
        setTimeRemaining(data.time_remaining_seconds || data.duration_minutes * 60);
        setIsPaused(data.status === "paused");

        // Recover transcript dialogue list
        const restoredTranscript: TranscriptMessage[] = [];
        data.questions.forEach((q) => {
          restoredTranscript.push({
            sender: "ai",
            text: q.question_text,
            timestamp: new Date(data.created_at),
            isFollowUp: q.topic === "Follow-up",
          });

          if (q.answer) {
            restoredTranscript.push({
              sender: "candidate",
              text: q.answer.user_answer,
              timestamp: new Date(q.answer.created_at),
            });
          }
        });
        setTranscript(restoredTranscript);

        // Trigger initial question speaking if starting fresh
        if (restoredTranscript.length === 1 && data.questions.length > 0) {
          if (speakTextRef.current) {
            speakTextRef.current(data.questions[0].question_text);
          }
        }
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load session details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, [interviewId]);

  // 2. Main Countdown Timer
  useEffect(() => {
    if (loading || isPaused || isEnding || !session) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          if (handleAutoEndInterviewRef.current) {
            handleAutoEndInterviewRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [loading, isPaused, isEnding, session]);

  // Speaking Timer (tracks how long user is speaking on current turn)
  useEffect(() => {
    if (isRecording) {
      speakingTimerIntervalRef.current = setInterval(() => {
        setSpeakingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (speakingTimerIntervalRef.current) {
        clearInterval(speakingTimerIntervalRef.current);
      }
    }

    return () => {
      if (speakingTimerIntervalRef.current) clearInterval(speakingTimerIntervalRef.current);
    };
  }, [isRecording]);

  // 3. Audio Speech Synthesis (TTS Abstraction)
  const speakText = async (text: string) => {
    // Interruption logic: stop any playing audio first
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
    window.speechSynthesis.cancel();

    setIsAiSpeaking(true);

    if (speechEngine === "browser") {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsAiSpeaking(false);
        // Automatically start recording in hands-free mode once AI stops speaking
        if (speechMode === "handsfree" && micGranted && !isPaused) {
          startRecording();
        }
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Server-side ElevenLabs/OpenAI TTS Adapter flow
      try {
        const response = await apiFetch(`/api/interview/${interviewId}/voice/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error("TTS generation failed");
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;
        
        audio.onended = () => {
          setIsAiSpeaking(false);
          if (speechMode === "handsfree" && micGranted && !isPaused) {
            startRecording();
          }
        };
        audio.play();
      } catch (err) {
        console.error("Server TTS failed, falling back to Browser Speech Synthesis:", err);
        // fallback
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
          setIsAiSpeaking(false);
          if (speechMode === "handsfree" && micGranted && !isPaused) {
            startRecording();
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // 4. Waveform Canvas Frequency Analyzer loop
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const analyser = analyserRef.current;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const width = canvas.width;
    const height = canvas.height;
    
    const draw = () => {
      if (!isRecording && !isAiSpeaking) {
        // Draw standard flat line when silent
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = "rgba(229, 229, 229, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 3;
      
      // Determine wave gradient colors based on Speaker Indicators
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      if (isAiSpeaking) {
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)"); // Blue AI speak wave
        gradient.addColorStop(0.5, "rgba(147, 51, 234, 0.8)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.8)");
      } else {
        gradient.addColorStop(0, "rgba(16, 185, 129, 0.8)"); // Green Candidate speak wave
        gradient.addColorStop(0.5, "rgba(5, 150, 105, 0.8)");
        gradient.addColorStop(1, "rgba(16, 185, 129, 0.8)");
      }
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      
      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  // 5. Connect Microphones
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
      
      // Set up AudioContext for frequencies waveform drawing
      const audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      
      // Request initial canvas draw loop
      drawWaveform();
      
      // Configure MediaRecorder for Speech-to-Text sending
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        audioChunksRef.current = [];
        await processCandidateSpeech(audioBlob);
      };
    } catch (err) {
      console.error("Mic permissions denied:", err);
      alert("Microphone permission is required for the Voice Interview experience.");
    }
  };

  const startRecording = () => {
    if (!micGranted || isRecording || isAiSpeaking || isPaused) return;
    
    // Interrupt AI speaking if they click record
    window.speechSynthesis.cancel();
    if (activeAudioRef.current) activeAudioRef.current.pause();
    setIsAiSpeaking(false);

    setIsRecording(true);
    setSpeakingTime(0);
    audioChunksRef.current = [];
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
    }
    
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    
    drawWaveform();

    // Hands-Free silence detection checker loop
    if (speechMode === "handsfree") {
      silenceStartRef.current = null;
      pttIntervalRef.current = setInterval(checkSilenceLoop, 100);
    }
  };

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    setIsRecording(false);
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (pttIntervalRef.current) {
      clearInterval(pttIntervalRef.current);
    }
  }, [isRecording]);

  // Silence detection loop for hands-free conversations
  const checkSilenceLoop = () => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Average volume check
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const averageVolume = sum / bufferLength;
    
    // Silence threshold is roughly 10/255 volume level
    if (averageVolume < 10) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = Date.now();
      } else {
        const silentDuration = Date.now() - silenceStartRef.current;
        // Auto submit speech after 1.5 seconds of silence
        if (silentDuration > 1500) {
          clearInterval(pttIntervalRef.current!);
          stopRecording();
        }
      }
    } else {
      silenceStartRef.current = null; // Voice active, reset silence timer
    }
  };

  // 6. Speech-to-Text & Response logic orchestrator
  const processCandidateSpeech = async (audioBlob: Blob) => {
    setIsProcessingTranscription(true);
    try {
      // Submit audio payload to Backend STT route
      const formData = new FormData();
      formData.append("file", audioBlob, "response.wav");
      
      const sttResponse = await apiFetch(`/api/interview/${interviewId}/voice/stt`, {
        method: "POST",
        body: formData,
      });
      if (!sttResponse.ok) throw new Error("Audio transcription failed.");
      
      const sttData: { text: string } = await sttResponse.json();
      const transcribedText = sttData.text.trim();
      
      if (!transcribedText) {
        setIsProcessingTranscription(false);
        alert("We could not hear your speech clearly. Please try speaking again.");
        return;
      }

      // Add to conversation transcript logs
      setTranscript((prev) => [
        ...prev,
        { sender: "candidate", text: transcribedText, timestamp: new Date() },
      ]);

      // Check current question index context
      if (!session) return;
      const currentQ = session.questions[currentIndex];

      if (!isFollowUpActive) {
        // First speech: Save answer transcription to database (auto-save turn)
        await apiFetch(`/api/interview/${interviewId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: currentQ.id,
            user_answer: transcribedText,
            time_taken_seconds: speakingTime,
          }),
        });

        // Trigger AI dynamic Follow-up generation
        const followUpResp = await apiFetch(`/api/interview/${interviewId}/voice/follow-up`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: currentQ.id,
            user_answer: transcribedText,
          }),
        });

        if (followUpResp.ok) {
          const followUpData: { follow_up_question: string; question_id: number } =
            await followUpResp.json();
            
          setIsFollowUpActive(true);
          setActiveFollowUpId(followUpData.question_id);
          
          setTranscript((prev) => [
            ...prev,
            { sender: "ai", text: followUpData.follow_up_question, timestamp: new Date(), isFollowUp: true },
          ]);
          
          speakText(followUpData.follow_up_question);
        } else {
          // If follow-up fails, skip straight to next question
          advanceToNextQuestion();
        }
      } else {
        // Follow-up speech: Save follow-up answer to database
        if (activeFollowUpId) {
          await apiFetch(`/api/interview/${interviewId}/answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question_id: activeFollowUpId,
              user_answer: transcribedText,
              time_taken_seconds: speakingTime,
            }),
          });
        }
        
        setIsFollowUpActive(false);
        setActiveFollowUpId(null);
        
        // Follow-up answered! Reload session configurations to get fresh question counts and structures
        const reloadResponse = await apiFetch(`/api/interview/${interviewId}`);
        if (reloadResponse.ok) {
          const reloadedData: InterviewSession = await reloadResponse.json();
          setSession(reloadedData);
        }
        
        advanceToNextQuestion();
      }
    } catch (err) {
      console.error("Failed processing voice response:", err);
      alert("Failed processing transcription. Please check backend connection logs.");
    } finally {
      setIsProcessingTranscription(false);
    }
  };

  const advanceToNextQuestion = async () => {
    if (!session) return;
    const nextIdx = currentIndex + 1;
    
    // Save updated index context to database
    await apiFetch(`/api/interview/${interviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_question_index: nextIdx,
        time_remaining_seconds: timeRemaining,
      }),
    });
    
    if (nextIdx < session.questions.length) {
      setCurrentIndex(nextIdx);
      const nextQText = session.questions[nextIdx].question_text;
      
      setTranscript((prev) => [
        ...prev,
        { sender: "ai", text: nextQText, timestamp: new Date() },
      ]);
      
      speakText(nextQText);
    } else {
      // Out of questions, end interview
      handleEndInterview();
    }
  };

  // 7. Pauses/Resumes Control Actions
  const handleTogglePause = async () => {
    if (!session) return;
    const action = isPaused ? "resume" : "pause";
    try {
      await apiFetch(`/api/interview/${interviewId}/${action}`, { method: "POST" });
      setIsPaused(!isPaused);
      
      if (!isPaused) {
        // Paused: stop speech output
        window.speechSynthesis.cancel();
        if (activeAudioRef.current) activeAudioRef.current.pause();
        setIsAiSpeaking(false);
        stopRecording();
      } else {
        // Resumed: speak current question
        if (session.questions[currentIndex]) {
          speakText(session.questions[currentIndex].question_text);
        }
      }
    } catch (err) {
      console.error(`Failed ${action}ing session:`, err);
    }
  };

  // End Interview & request evaluations compiles
  const handleEndInterview = async () => {
    if (isEnding) return;
    setIsEnding(true);
    window.speechSynthesis.cancel();
    if (activeAudioRef.current) activeAudioRef.current.pause();
    stopRecording();
    
    try {
      const response = await apiFetch(`/api/interview/${interviewId}/end`, { method: "POST" });
      if (!response.ok) throw new Error("Failed compiling report.");
      router.push(`/interview/${interviewId}/feedback`);
    } catch (err) {
      console.error("Failed ending interview:", err);
      setIsEnding(false);
    }
  };

  const handleAutoEndInterview = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    window.speechSynthesis.cancel();
    if (activeAudioRef.current) activeAudioRef.current.pause();
    stopRecording();
    try {
      await apiFetch(`/api/interview/${interviewId}/end`, { method: "POST" });
      router.push(`/interview/${interviewId}/feedback`);
    } catch (err) {
      console.error("Failed auto ending interview:", err);
    }
  }, [isEnding, interviewId, router, stopRecording]);

  // Clean exit back to dashboard setup page
  const handleExitInterview = () => {
    window.speechSynthesis.cancel();
    if (activeAudioRef.current) activeAudioRef.current.pause();
    stopRecording();
    router.push("/interview");
  };

  // Sync callback refs to prevent accessed-before-declared lints
  useEffect(() => {
    speakTextRef.current = speakText;
    handleAutoEndInterviewRef.current = handleAutoEndInterview;
  });

  // Render Loader States
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 text-white min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-neutral-400 text-sm">Orchestrating voice cockpit credentials...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 text-white min-h-screen p-6 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Error Loading Voice Session</h2>
        <p className="text-neutral-400 text-sm max-w-md mb-6">{error || "Interview details unavailable."}</p>
        <Button onClick={handleExitInterview} className="bg-white text-black hover:bg-neutral-200">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 min-h-screen p-6 relative overflow-hidden font-sans select-none">
      {/* Blurred background radial glow lights */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-violet-600/5 dark:bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-emerald-600/5 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExitInterview}
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 transition"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight uppercase tracking-widest">Voice Workspace</h1>
            <p className="text-[10px] text-neutral-500 font-semibold">
              {session.job_role} {session.company ? `@ ${session.company}` : ""} • {session.experience_level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Main Countdown Timer block */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold tracking-tight text-neutral-700 dark:text-neutral-300">
            <Clock className="h-4 w-4 text-neutral-450 dark:text-neutral-500" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 transition"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Visualizer + Live Transcripts */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 z-10 mb-6">
        {/* Left Side: Waveform Visualizer & Speaking indicators */}
        <div className="lg:col-span-3 flex flex-col justify-between p-8 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-850 backdrop-blur-xl relative">
          
          {/* Pause overlay screen */}
          {isPaused && (
            <div className="absolute inset-0 bg-white/95 dark:bg-black/85 rounded-3xl flex flex-col items-center justify-center z-30">
              <Pause className="h-12 w-12 text-neutral-400 animate-pulse mb-3" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Interview Session Paused</h3>
              <p className="text-xs text-neutral-550 dark:text-neutral-500 max-w-xs text-center mb-6">
                speaking timer and countdown clocks are halted. Resume to continue the conversation.
              </p>
              <Button onClick={handleTogglePause} className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full px-6">
                Resume Interview
              </Button>
            </div>
          )}

          {/* Speaker Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isAiSpeaking ? "bg-violet-650 animate-pulse" : "bg-neutral-400 dark:bg-neutral-700"}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isAiSpeaking ? "text-violet-650" : "text-neutral-500"}`}>
                AI Interrogator
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isRecording ? "text-emerald-500" : "text-neutral-500"}`}>
                {isRecording ? "Listening" : "Silent"}
              </span>
              <div className={`h-2.5 w-2.5 rounded-full ${isRecording ? "bg-emerald-500 animate-ping" : "bg-neutral-450 dark:bg-neutral-700"}`} />
            </div>
          </div>

          {/* Central Waveform Visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 relative">
            <canvas ref={canvasRef} width={400} height={200} className="w-full max-w-md h-40" />
            
            {/* Status indicator texts */}
            {isProcessingTranscription ? (
              <div className="absolute flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs shadow-md">
                <Loader2 className="h-3 w-3 animate-spin text-violet-600" />
                <span>Processing candidate answer...</span>
              </div>
            ) : isAiSpeaking ? (
              <div className="absolute flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 text-xs">
                <Volume2 className="h-3.5 w-3.5" />
                <span>AI Speaking Question</span>
              </div>
            ) : isRecording ? (
              <div className="absolute flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs">
                <Mic className="h-3.5 w-3.5" />
                <span>Candidate Speaking ({speakingTime}s)</span>
              </div>
            ) : (
              <div className="absolute text-center text-xs text-neutral-500">
                {!micGranted ? (
                  <button onClick={requestMicPermission} className="text-violet-600 underline hover:text-violet-500 font-bold">
                    Connect Microphone to Begin
                  </button>
                ) : (
                  <span>
                    {speechMode === "ptt"
                      ? "Hold microphone button down to speak"
                      : "Silence detection will automatically end voice loops"}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Interactive Microphone Controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleTogglePause}
              className="p-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition text-neutral-600 dark:text-neutral-300"
            >
              {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5" />}
            </button>

            {/* Mic push to talk / handsfree button */}
            <button
              onMouseDown={speechMode === "ptt" ? startRecording : undefined}
              onMouseUp={speechMode === "ptt" ? stopRecording : undefined}
              onTouchStart={speechMode === "ptt" ? startRecording : undefined}
              onTouchEnd={speechMode === "ptt" ? stopRecording : undefined}
              onClick={speechMode === "handsfree" ? (isRecording ? stopRecording : startRecording) : undefined}
              disabled={!micGranted || isPaused || isProcessingTranscription}
              className={`p-6 rounded-full border transition-all duration-300 shadow-lg ${
                isRecording
                  ? "bg-emerald-500 border-emerald-400 text-white scale-110 shadow-emerald-500/20"
                  : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-350 disabled:opacity-50"
              }`}
            >
              {isRecording ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8 text-neutral-400" />}
            </button>

            <button
              onClick={handleEndInterview}
              disabled={isEnding || isProcessingTranscription}
              className="p-3.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-650 dark:text-red-400 disabled:opacity-50 transition"
            >
              {isEnding ? <Loader2 className="h-5 w-5 animate-spin" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Right Side: Live Dialogue Scrolling Transcripts */}
        <div className="lg:col-span-2 flex flex-col p-6 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-850 backdrop-blur-xl">
          <h2 className="text-[10px] font-extrabold text-neutral-900 dark:text-white uppercase tracking-widest mb-4 border-b border-neutral-200/50 dark:border-neutral-800 pb-3 flex justify-between items-center">
            <span>Dialogue Transcript</span>
            <span className="font-semibold text-neutral-450 dark:text-neutral-500">
              Q: {currentIndex + 1} of {session.question_count}
            </span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs custom-scrollbar">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 p-6">
                <Info className="h-6 w-6 text-neutral-400 mb-2 animate-bounce" />
                <p className="text-xs font-semibold">No transcripts recorded yet.</p>
                <p className="text-[10px] text-neutral-400 mt-1">Connect mic and speak to log statements.</p>
              </div>
            ) : (
              transcript.map((msg, index) => {
                const isAi = msg.sender === "ai";
                return (
                  <div key={index} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        isAi
                          ? msg.isFollowUp
                            ? "bg-purple-500/10 border border-purple-500/20 text-purple-650 dark:text-purple-300"
                            : "bg-white dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-850 dark:text-neutral-200"
                          : "bg-violet-650 text-white"
                      }`}
                    >
                      {isAi && (
                        <div className="flex items-center gap-1.5 mb-1 select-none">
                          <span className={`text-[9px] uppercase font-extrabold tracking-wider ${
                            msg.isFollowUp ? "text-purple-500" : "text-neutral-500"
                          }`}>
                            {msg.isFollowUp ? "AI Follow-Up" : "AI Interrogator"}
                          </span>
                        </div>
                      )}
                      <p className="leading-relaxed text-xs">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Settings Drawer Panel */}
      {settingsOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-neutral-950 border-l border-neutral-250 dark:border-neutral-850 shadow-2xl p-6 z-50 flex flex-col justify-between select-none">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-6 flex items-center justify-between">
              <span>Voice Settings</span>
              <button onClick={() => setSettingsOpen(false)} className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-bold">
                Close
              </button>
            </h2>

            <div className="space-y-6">
              {/* Mode Selection */}
              <div>
                <label className="text-[10px] font-extrabold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest block mb-2">
                  Conversation Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSpeechMode("ptt");
                      stopRecording();
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      speechMode === "ptt"
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Push-to-Talk
                  </button>
                  <button
                    onClick={() => {
                      setSpeechMode("handsfree");
                      stopRecording();
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      speechMode === "handsfree"
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Hands-Free
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-2">
                  {speechMode === "ptt"
                    ? "Hold down mic to speak. Release to transcribe."
                    : "Mic stays open. Speaks after silence is detected."}
                </p>
              </div>

              {/* TTS Engine selection */}
              <div>
                <label className="text-[10px] font-extrabold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest block mb-2">
                  TTS Voice Output Engine
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSpeechEngine("browser")}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      speechEngine === "browser"
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Browser Synth
                  </button>
                  <button
                    onClick={() => setSpeechEngine("server")}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      speechEngine === "server"
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Server voice
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-2">
                  Browser Synth is instant. Server voice uses configured ElevenLabs/OpenAI adapters.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setSettingsOpen(false)}
            className="w-full bg-violet-650 text-white hover:bg-violet-550 rounded-xl"
          >
            Apply Changes
          </Button>
        </div>
      )}
    </div>
  );

  // Helper: format clock display
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}
