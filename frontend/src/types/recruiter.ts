// TypeScript interfaces for Recruiter Portal and Admin Panel

import type { Language } from "./coding";

export interface CompanyResponse {
  id: number;
  name: string;
  domain: string | null;
  logo_url: string | null;
  description: string | null;
  created_at: string;
}

export interface RecruiterResponse {
  id: number;
  user_id: number;
  company_id: number;
  title: string | null;
  created_at: string;
  company?: CompanyResponse;
}

export interface InterviewTemplateResponse {
  id: number;
  company_id: number;
  title: string;
  job_role: string;
  experience_level: string;
  duration_minutes: number;
  question_count: number;
  questions: Array<{ question: string }>;
  created_at: string;
}

export interface RecruiterInterviewResponse {
  id: number;
  recruiter_id: number;
  company_id: number;
  title: string;
  description: string | null;
  job_role: string;
  flow_config: Array<{ type: string; difficulty?: string }>;
  status: string;
  created_at: string;
}

export interface CandidateAssignmentResponse {
  id: number;
  user_id: number;
  recruiter_interview_id: number;
  status: "invited" | "in_progress" | "completed";
  invite_token: string | null;
  score: number | null;
  feedback_summary: string | null;
  assigned_at: string;
  completed_at: string | null;
  user_email: string | null;
  user_full_name: string | null;
  interview_title: string | null;
}

export interface UserAdminResponse {
  id: number;
  email: string;
  full_name: string | null;
  role: "candidate" | "recruiter" | "admin";
  is_active: boolean;
  created_at: string;
}

export interface AdminSettingsResponse {
  id: number;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
}

export interface AuditLogResponse {
  id: number;
  user_id: number | null;
  action: string;
  ip_address: string | null;
  details: Record<string, unknown>;
  created_at: string;
  user_email: string | null;
}

export interface PlatformAnalyticsResponse {
  total_candidates: number;
  total_recruiters: number;
  total_interviews_completed: number;
  average_score: number;
  provider_configurations: Record<string, string>;
  system_load: number;
}

// Aggregated Candidate Reports details
export interface CandidateMockInterviewReport {
  id: number;
  job_role: string;
  company: string | null;
  interview_type: string;
  difficulty: string;
  status: string;
  created_at: string;
  feedback: {
    overall_score: number;
    technical_score: number;
    communication_score: number;
    feedback_text: string;
  } | null;
}

export interface CandidateCodingSessionReport {
  id: number;
  question_title: string;
  language: Language;
  status: string;
  timer_seconds: number;
  updated_at: string;
}

export interface CandidateResumeReport {
  id: number;
  filename: string;
  ats_score: number;
  missing_skills: string[];
  uploaded_at: string;
}

export interface CandidateAggregateReports {
  interviews: CandidateMockInterviewReport[];
  coding: CandidateCodingSessionReport[];
  resumes: CandidateResumeReport[];
}
