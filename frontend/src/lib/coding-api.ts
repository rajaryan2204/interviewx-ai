// API client for the Coding Interview Platform
import type {
  CodeRunResponse,
  CodeSubmissionDetail,
  CodeSubmissionSummary,
  CodeSubmitResponse,
  CodingFeedback,
  CodingQuestionDetail,
  CodingQuestionListItem,
  CodingSessionDetail,
  CodingSessionResponse,
  Language,
} from "@/types/coding";

import { apiFetch as globalApiFetch } from "@/lib/api";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await globalApiFetch(path, {
    ...options,
    json: options.body ? JSON.parse(options.body as string) : undefined
  } as unknown as Parameters<typeof globalApiFetch>[1]);

  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return (await res.json()) as T;
}

// -------------------------------------------------------------------
// Questions
// -------------------------------------------------------------------

export const listQuestions = (
  difficulty?: string,
  category?: string
): Promise<CodingQuestionListItem[]> => {
  const params = new URLSearchParams();
  if (difficulty) params.set("difficulty", difficulty);
  if (category) params.set("category", category);
  return apiFetch<CodingQuestionListItem[]>(
    `/api/coding/questions?${params.toString()}`
  );
};

export const getQuestion = (id: number): Promise<CodingQuestionDetail> =>
  apiFetch<CodingQuestionDetail>(`/api/coding/questions/${id}`);

// -------------------------------------------------------------------
// Sessions
// -------------------------------------------------------------------

export const createSession = (
  question_id: number,
  language: Language
): Promise<CodingSessionResponse> =>
  apiFetch<CodingSessionResponse>("/api/coding/sessions", {
    method: "POST",
    body: JSON.stringify({ question_id, language }),
  });

export const listSessions = (): Promise<CodingSessionDetail[]> =>
  apiFetch<CodingSessionDetail[]>("/api/coding/sessions");

export const getSession = (id: number): Promise<CodingSessionDetail> =>
  apiFetch<CodingSessionDetail>(`/api/coding/sessions/${id}`);

export const saveSnapshot = (
  sessionId: number,
  code: string,
  language: Language,
  timer_seconds_elapsed: number
): Promise<CodingSessionResponse> =>
  apiFetch<CodingSessionResponse>(`/api/coding/sessions/${sessionId}/save`, {
    method: "PATCH",
    body: JSON.stringify({ code, language, timer_seconds_elapsed }),
  });

// -------------------------------------------------------------------
// Run / Submit
// -------------------------------------------------------------------

export const runCode = (
  sessionId: number,
  code: string,
  language: Language,
  custom_input?: string
): Promise<CodeRunResponse> =>
  apiFetch<CodeRunResponse>(`/api/coding/sessions/${sessionId}/run`, {
    method: "POST",
    body: JSON.stringify({ code, language, custom_input: custom_input || null }),
  });

export const submitCode = (
  sessionId: number,
  code: string,
  language: Language
): Promise<CodeSubmitResponse> =>
  apiFetch<CodeSubmitResponse>(`/api/coding/sessions/${sessionId}/submit`, {
    method: "POST",
    body: JSON.stringify({ code, language }),
  });

// -------------------------------------------------------------------
// Submission history
// -------------------------------------------------------------------

export const listSubmissions = (
  sessionId: number
): Promise<CodeSubmissionSummary[]> =>
  apiFetch<CodeSubmissionSummary[]>(
    `/api/coding/sessions/${sessionId}/submissions`
  );

export const getSubmissionDetail = (
  submissionId: number
): Promise<CodeSubmissionDetail> =>
  apiFetch<CodeSubmissionDetail>(`/api/coding/submissions/${submissionId}`);

// -------------------------------------------------------------------
// AI Review
// -------------------------------------------------------------------

export const generateReview = (
  submissionId: number
): Promise<CodingFeedback> =>
  apiFetch<CodingFeedback>(`/api/coding/submissions/${submissionId}/review`, {
    method: "POST",
  });

export const getReview = (submissionId: number): Promise<CodingFeedback> =>
  apiFetch<CodingFeedback>(`/api/coding/submissions/${submissionId}/review`);
