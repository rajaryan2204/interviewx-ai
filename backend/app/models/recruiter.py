"""
SQLAlchemy models for Company, Recruiter, RecruiterInterview, CandidateAssignment,
InterviewTemplate, AdminSettings, and AuditLog.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Company(Base):
    """
    SQLAlchemy model representing a Company Profile.
    """

    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    recruiters: Mapped[list["Recruiter"]] = relationship(
        "Recruiter", back_populates="company", cascade="all, delete-orphan"
    )
    templates: Mapped[list["InterviewTemplate"]] = relationship(
        "InterviewTemplate", back_populates="company", cascade="all, delete-orphan"
    )
    interviews: Mapped[list["RecruiterInterview"]] = relationship(
        "RecruiterInterview", back_populates="company", cascade="all, delete-orphan"
    )


class Recruiter(Base):
    """
    SQLAlchemy model representing a Recruiter profile linked to a User and a Company.
    """

    __tablename__ = "recruiters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    company_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User")
    company: Mapped["Company"] = relationship("Company", back_populates="recruiters")
    interviews: Mapped[list["RecruiterInterview"]] = relationship(
        "RecruiterInterview", back_populates="recruiter", cascade="all, delete-orphan"
    )


class RecruiterInterview(Base):
    """
    An interview flow configured by a recruiter.
    Candidates will be assigned/invited to take this interview flow.
    """

    __tablename__ = "recruiter_interviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recruiter_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("recruiters.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_role: Mapped[str] = mapped_column(String(100), nullable=False)
    # List of steps config: [{"type": "resume_analysis"}, {"type": "mock_interview", "difficulty": "hard"}, ...]
    flow_config: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # active, archived
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    recruiter: Mapped["Recruiter"] = relationship("Recruiter", back_populates="interviews")
    company: Mapped["Company"] = relationship("Company", back_populates="interviews")
    assignments: Mapped[list["CandidateAssignment"]] = relationship(
        "CandidateAssignment", back_populates="recruiter_interview", cascade="all, delete-orphan"
    )


class CandidateAssignment(Base):
    """
    SQLAlchemy model representing a candidate assigned to a recruiter interview flow.
    """

    __tablename__ = "candidate_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    recruiter_interview_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("recruiter_interviews.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default="invited", nullable=False
    )  # invited, in_progress, completed
    invite_token: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    feedback_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    recruiter_interview: Mapped["RecruiterInterview"] = relationship(
        "RecruiterInterview", back_populates="assignments"
    )


class InterviewTemplate(Base):
    """
    Templates for company-wide coding or mock interview structures.
    """

    __tablename__ = "interview_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    job_role: Mapped[str] = mapped_column(String(100), nullable=False)
    experience_level: Mapped[str] = mapped_column(String(50), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    question_count: Mapped[int] = mapped_column(Integer, default=5)
    # Pre-configured question details
    questions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="templates")


class AdminSettings(Base):
    """
    Application wide configuration and settings (Feature flags, AI Providers, etc.)
    """

    __tablename__ = "admin_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class AuditLog(Base):
    """
    SQLAlchemy model for secure system and user action audit logging.
    """

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(100), nullable=True)
    details: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User | None"] = relationship("User")
