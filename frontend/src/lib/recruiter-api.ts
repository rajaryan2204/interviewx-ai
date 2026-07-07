// API Client for Recruiter Portal and Admin Panel endpoints
import type {
  CompanyResponse,
  InterviewTemplateResponse,
  RecruiterInterviewResponse,
  CandidateAssignmentResponse,
  UserAdminResponse,
  AdminSettingsResponse,
  AuditLogResponse,
  PlatformAnalyticsResponse,
  CandidateAggregateReports,
} from "@/types/recruiter";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/v1$/, "");

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

// ---------------------------------------------------------------------------
// Recruiter Portal API
// ---------------------------------------------------------------------------

export const getCompany = (): Promise<CompanyResponse> =>
  apiFetch<CompanyResponse>("/api/recruiter/company");

export const updateCompany = (
  payload: Partial<CompanyResponse>
): Promise<CompanyResponse> =>
  apiFetch<CompanyResponse>("/api/recruiter/company", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const listTemplates = (): Promise<InterviewTemplateResponse[]> =>
  apiFetch<InterviewTemplateResponse[]>("/api/recruiter/templates");

export const createTemplate = (payload: {
  title: string;
  job_role: string;
  experience_level: string;
  duration_minutes: number;
  question_count: number;
  questions: Array<{ question: string }>;
}): Promise<InterviewTemplateResponse> =>
  apiFetch<InterviewTemplateResponse>("/api/recruiter/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const deleteTemplate = (id: number): Promise<void> =>
  apiFetch<void>(`/api/recruiter/templates/${id}`, {
    method: "DELETE",
  });

export const listRecruiterInterviews = (): Promise<RecruiterInterviewResponse[]> =>
  apiFetch<RecruiterInterviewResponse[]>("/api/recruiter/interviews");

export const createRecruiterInterview = (payload: {
  title: string;
  description?: string;
  job_role: string;
  flow_config: Array<{ type: string; difficulty?: string }>;
}): Promise<RecruiterInterviewResponse> =>
  apiFetch<RecruiterInterviewResponse>("/api/recruiter/interviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listAssignments = (): Promise<CandidateAssignmentResponse[]> =>
  apiFetch<CandidateAssignmentResponse[]>("/api/recruiter/assignments");

export const createAssignment = (
  email: string,
  recruiter_interview_id: number
): Promise<CandidateAssignmentResponse> =>
  apiFetch<CandidateAssignmentResponse>("/api/recruiter/assignments", {
    method: "POST",
    body: JSON.stringify({ email, recruiter_interview_id }),
  });

export const searchCandidates = (search?: string): Promise<UserAdminResponse[]> => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  return apiFetch<UserAdminResponse[]>(`/api/recruiter/candidates?${params.toString()}`);
};

export const getCandidateReports = (
  candidateId: number
): Promise<CandidateAggregateReports> =>
  apiFetch<CandidateAggregateReports>(`/api/recruiter/candidates/${candidateId}/reports`);

export const downloadReportUrl = (candidateId: number): string => {
  return `${BASE}/api/recruiter/candidates/${candidateId}/reports/download`;
};

// ---------------------------------------------------------------------------
// Admin Panel API
// ---------------------------------------------------------------------------

export const adminListUsers = (): Promise<UserAdminResponse[]> =>
  apiFetch<UserAdminResponse[]>("/api/admin/users");

export const adminUpdateUser = (
  userId: number,
  payload: { role: string; is_active?: boolean }
): Promise<UserAdminResponse> =>
  apiFetch<UserAdminResponse>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const adminDeleteUser = (userId: number): Promise<void> =>
  apiFetch<void>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });

export const adminListSettings = (): Promise<AdminSettingsResponse[]> =>
  apiFetch<AdminSettingsResponse[]>("/api/admin/settings");

export const adminUpdateSetting = (
  key: string,
  payload: { value: Record<string, unknown>; description?: string }
): Promise<AdminSettingsResponse> =>
  apiFetch<AdminSettingsResponse>(`/api/admin/settings/${key}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const adminListLogs = (): Promise<AuditLogResponse[]> =>
  apiFetch<AuditLogResponse[]>("/api/admin/logs");

export const getPlatformAnalytics = (): Promise<PlatformAnalyticsResponse> =>
  apiFetch<PlatformAnalyticsResponse>("/api/admin/analytics");
