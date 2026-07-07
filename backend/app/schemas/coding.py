"""
Pydantic schemas for the Coding Interview Platform API.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Question schemas
# ---------------------------------------------------------------------------

class CodingQuestionListItem(BaseModel):
    id: int
    title: str
    slug: str
    difficulty: str
    category: str
    tags: list[str]
    optimal_time_complexity: str | None = None
    optimal_space_complexity: str | None = None

    class Config:
        from_attributes = True


class CodingQuestionDetail(CodingQuestionListItem):
    description: str
    constraints: list[str]
    examples: list[dict[str, Any]]
    default_code: dict[str, str]
    test_cases_public: list[dict[str, Any]]
    hints: list[str]

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Session schemas
# ---------------------------------------------------------------------------

class CodingSessionCreate(BaseModel):
    question_id: int
    language: str = Field("python", pattern=r"^(python|javascript|java|cpp|c)$")


class CodingSessionResponse(BaseModel):
    id: int
    question_id: int
    language: str
    status: str
    code_snapshot: str | None = None
    timer_seconds_elapsed: int
    started_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CodingSessionDetail(CodingSessionResponse):
    question: CodingQuestionDetail

    class Config:
        from_attributes = True


class CodeSnapshotSave(BaseModel):
    code: str
    timer_seconds_elapsed: int
    language: str = Field("python", pattern=r"^(python|javascript|java|cpp|c)$")


# ---------------------------------------------------------------------------
# Run / Submit schemas
# ---------------------------------------------------------------------------

class CodeRunRequest(BaseModel):
    code: str
    language: str = Field("python", pattern=r"^(python|javascript|java|cpp|c)$")
    custom_input: str | None = None  # overrides default test cases when present


class TestCaseResult(BaseModel):
    test_case_index: int
    input: str
    expected_output: str
    actual_output: str
    passed: bool
    runtime_ms: float | None = None


class CodeRunResponse(BaseModel):
    verdict: str
    passed_tests: int
    total_tests: int
    runtime_ms: float | None = None
    memory_kb: float | None = None
    stdout: str | None = None
    stderr: str | None = None
    test_results: list[TestCaseResult]
    submission_id: int


class CodeSubmitRequest(BaseModel):
    code: str
    language: str = Field("python", pattern=r"^(python|javascript|java|cpp|c)$")


class CodeSubmitResponse(CodeRunResponse):
    """Same as run but always runs against all hidden test cases."""
    pass


# ---------------------------------------------------------------------------
# Submission history
# ---------------------------------------------------------------------------

class CodeSubmissionSummary(BaseModel):
    id: int
    language: str
    is_run: bool
    verdict: str | None = None
    passed_tests: int
    total_tests: int
    runtime_ms: float | None = None
    memory_kb: float | None = None
    submitted_at: datetime

    class Config:
        from_attributes = True


class CodeSubmissionDetail(CodeSubmissionSummary):
    code: str
    execution: "CodeExecutionResponse | None" = None
    feedback: "CodingFeedbackResponse | None" = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Execution result
# ---------------------------------------------------------------------------

class CodeExecutionResponse(BaseModel):
    id: int
    stdout: str | None = None
    stderr: str | None = None
    execution_time_ms: float | None = None
    memory_kb: float | None = None
    exit_code: int
    test_results: list[dict[str, Any]]
    executed_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# AI Review
# ---------------------------------------------------------------------------

class CodingFeedbackResponse(BaseModel):
    id: int
    submission_id: int
    quality_score: float
    time_complexity: str
    space_complexity: str
    bugs: list[dict[str, Any]]
    suggestions: list[str]
    best_practices: list[str]
    interview_notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# Required for forward references in CodeSubmissionDetail
CodeSubmissionDetail.model_rebuild()
