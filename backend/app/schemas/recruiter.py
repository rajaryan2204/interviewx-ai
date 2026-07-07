"""
Pydantic schemas for Recruiter Portal and Admin Panel.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Company Schemas
# ---------------------------------------------------------------------------

class CompanyCreate(BaseModel):
    name: str = Field(..., max_length=255)
    domain: str | None = Field(None, max_length=255)
    logo_url: str | None = Field(None, max_length=500)
    description: str | None = None


class CompanyUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    domain: str | None = Field(None, max_length=255)
    logo_url: str | None = Field(None, max_length=500)
    description: str | None = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    domain: str | None = None
    logo_url: str | None = None
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Recruiter Schemas
# ---------------------------------------------------------------------------

class RecruiterCreate(BaseModel):
    company_id: int
    title: str | None = Field(None, max_length=100)


class RecruiterResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    title: str | None = None
    created_at: datetime
    company: CompanyResponse | None = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Interview Template Schemas
# ---------------------------------------------------------------------------

class InterviewTemplateCreate(BaseModel):
    title: str = Field(..., max_length=255)
    job_role: str = Field(..., max_length=100)
    experience_level: str = Field(..., max_length=50)
    duration_minutes: int = Field(30, ge=5, le=120)
    question_count: int = Field(5, ge=1, le=50)
    questions: list[dict[str, Any]] = []


class InterviewTemplateResponse(BaseModel):
    id: int
    company_id: int
    title: str
    job_role: str
    experience_level: str
    duration_minutes: int
    question_count: int
    questions: list[dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Recruiter Interview Flow Schemas
# ---------------------------------------------------------------------------

class RecruiterInterviewCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    job_role: str = Field(..., max_length=100)
    flow_config: list[dict[str, Any]] = []  # e.g., [{"type": "resume"}, {"type": "mock_interview"}, ...]


class RecruiterInterviewResponse(BaseModel):
    id: int
    recruiter_id: int
    company_id: int
    title: str
    description: str | None = None
    job_role: str
    flow_config: list[dict[str, Any]]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Candidate Assignment / Invites Schemas
# ---------------------------------------------------------------------------

class CandidateAssignmentCreate(BaseModel):
    email: str  # We invite via email (resolves to existing user or we mock invite)
    recruiter_interview_id: int


class CandidateAssignmentResponse(BaseModel):
    id: int
    user_id: int
    recruiter_interview_id: int
    status: str
    invite_token: str | None = None
    score: float | None = None
    feedback_summary: str | None = None
    assigned_at: datetime
    completed_at: datetime | None = None
    user_email: str | None = None
    user_full_name: str | None = None
    interview_title: str | None = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Admin User Management Schemas
# ---------------------------------------------------------------------------

class UserAdminResponse(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRole(BaseModel):
    role: str = Field(..., pattern=r"^(candidate|recruiter|admin)$")
    is_active: bool | None = None


# ---------------------------------------------------------------------------
# Admin Settings & Feature Flags Schemas
# ---------------------------------------------------------------------------

class AdminSettingsUpdate(BaseModel):
    value: dict[str, Any]
    description: str | None = None


class AdminSettingsResponse(BaseModel):
    id: int
    key: str
    value: dict[str, Any]
    description: str | None = None
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Audit Log Schemas
# ---------------------------------------------------------------------------

class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None = None
    action: str
    ip_address: str | None = None
    details: dict[str, Any]
    created_at: datetime
    user_email: str | None = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Platform Analytics Schemas
# ---------------------------------------------------------------------------

class PlatformAnalyticsResponse(BaseModel):
    total_candidates: int
    total_recruiters: int
    total_interviews_completed: int
    average_score: float
    provider_configurations: dict[str, str]
    system_load: float
