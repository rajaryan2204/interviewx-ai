// TypeScript interfaces for the Coding Interview Platform

export type Difficulty = "easy" | "medium" | "hard";
export type Language = "python" | "javascript" | "java" | "cpp" | "c";
export type Verdict =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "time_limit_exceeded"
  | "compilation_error";
export type SessionStatus = "in_progress" | "completed" | "abandoned";

// -------------------------------------------------------------------
// Questions
// -------------------------------------------------------------------

export interface CodingQuestionListItem {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  optimal_time_complexity: string | null;
  optimal_space_complexity: string | null;
}

export interface CodingQuestionExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodingQuestionDetail extends CodingQuestionListItem {
  description: string;
  constraints: string[];
  examples: CodingQuestionExample[];
  default_code: Record<Language, string>;
  test_cases_public: Array<{ input: string; output: string }>;
  hints: string[];
}

// -------------------------------------------------------------------
// Sessions
// -------------------------------------------------------------------

export interface CodingSessionResponse {
  id: number;
  question_id: number;
  language: Language;
  status: SessionStatus;
  code_snapshot: string | null;
  timer_seconds_elapsed: number;
  started_at: string;
  updated_at: string;
}

export interface CodingSessionDetail extends CodingSessionResponse {
  question: CodingQuestionDetail;
}

export interface CodeSnapshotSave {
  code: string;
  language: Language;
  timer_seconds_elapsed: number;
}

// -------------------------------------------------------------------
// Run / Submit
// -------------------------------------------------------------------

export interface TestCaseResult {
  test_case_index: number;
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  runtime_ms: number | null;
}

export interface CodeRunResponse {
  verdict: Verdict;
  passed_tests: number;
  total_tests: number;
  runtime_ms: number | null;
  memory_kb: number | null;
  stdout: string | null;
  stderr: string | null;
  test_results: TestCaseResult[];
  submission_id: number;
}

export type CodeSubmitResponse = CodeRunResponse;

// -------------------------------------------------------------------
// Submission history
// -------------------------------------------------------------------

export interface CodeSubmissionSummary {
  id: number;
  language: Language;
  is_run: boolean;
  verdict: Verdict | null;
  passed_tests: number;
  total_tests: number;
  runtime_ms: number | null;
  memory_kb: number | null;
  submitted_at: string;
}

export interface CodeExecutionResult {
  id: number;
  stdout: string | null;
  stderr: string | null;
  execution_time_ms: number | null;
  memory_kb: number | null;
  exit_code: number;
  test_results: TestCaseResult[];
  executed_at: string;
}

export interface CodingFeedback {
  id: number;
  submission_id: number;
  quality_score: number;
  time_complexity: string;
  space_complexity: string;
  bugs: Array<{ severity: "critical" | "major" | "minor"; description: string; line_hint?: string }>;
  suggestions: string[];
  best_practices: string[];
  interview_notes: string | null;
  created_at: string;
}

export interface CodeSubmissionDetail extends CodeSubmissionSummary {
  code: string;
  execution: CodeExecutionResult | null;
  feedback: CodingFeedback | null;
}
