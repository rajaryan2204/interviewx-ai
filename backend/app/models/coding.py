"""
SQLAlchemy models for the Coding Interview Platform.

Tables:
    coding_questions   — Question bank with test cases and stubs
    coding_sessions    — User-specific coding sessions
    code_submissions   — Each submission attempt by a user
    code_executions    — Raw execution output linked to submissions
    coding_feedbacks   — AI-generated review per submission
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class CodingQuestion(Base):
    """
    A coding problem in the question bank.

    Supports all categories: Arrays, DP, Trees, Graphs, SQL, etc.
    test_cases_hidden is never sent to the frontend.
    """

    __tablename__ = "coding_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)  # easy, medium, hard
    category: Mapped[str] = mapped_column(String(100), nullable=False)   # Arrays, DP, Trees …
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    constraints: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    # [{"input": "nums = [2,7,11,15], target = 9", "output": "0, 1", "explanation": "..."}]
    examples: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    # {"python": "def twoSum(nums, target):\n    pass", "javascript": "function twoSum(..."}
    default_code: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False, default=dict)
    # Hidden test cases used for full submission grading
    test_cases_hidden: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    # Public test cases shown in the UI
    test_cases_public: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    # Optional hints
    hints: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    # Expected time / space complexity for the optimal solution
    optimal_time_complexity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    optimal_space_complexity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    sessions: Mapped[list["CodingSession"]] = relationship(
        "CodingSession", back_populates="question", cascade="all, delete-orphan"
    )


class CodingSession(Base):
    """
    Tracks a user's active/completed coding attempt on a question.
    Persists the latest code snapshot for auto-save.
    """

    __tablename__ = "coding_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("coding_questions.id", ondelete="CASCADE"), nullable=False
    )
    language: Mapped[str] = mapped_column(String(50), nullable=False, default="python")
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="in_progress"
    )  # in_progress, completed, abandoned
    code_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    timer_seconds_elapsed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="coding_sessions")
    question: Mapped["CodingQuestion"] = relationship("CodingQuestion", back_populates="sessions")
    submissions: Mapped[list["CodeSubmission"]] = relationship(
        "CodeSubmission", back_populates="session", cascade="all, delete-orphan",
        order_by="CodeSubmission.submitted_at.desc()"
    )


class CodeSubmission(Base):
    """
    A single submit-or-run attempt within a coding session.
    verdict can be: accepted, wrong_answer, runtime_error, time_limit_exceeded, compilation_error
    """

    __tablename__ = "code_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("coding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    code: Mapped[str] = mapped_column(Text, nullable=False)
    is_run: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # True = Run, False = Submit
    verdict: Mapped[str | None] = mapped_column(String(50), nullable=True)
    passed_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    runtime_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_kb: Mapped[float | None] = mapped_column(Float, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session: Mapped["CodingSession"] = relationship("CodingSession", back_populates="submissions")
    execution: Mapped["CodeExecution | None"] = relationship(
        "CodeExecution", back_populates="submission", cascade="all, delete-orphan", uselist=False
    )
    feedback: Mapped["CodingFeedback | None"] = relationship(
        "CodingFeedback", back_populates="submission", cascade="all, delete-orphan", uselist=False
    )


class CodeExecution(Base):
    """
    Raw execution output for a submission or custom run.
    Stores stdout, stderr and exit codes from the execution engine.
    """

    __tablename__ = "code_executions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    submission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("code_submissions.id", ondelete="CASCADE"), nullable=False
    )
    stdout: Mapped[str | None] = mapped_column(Text, nullable=True)
    stderr: Mapped[str | None] = mapped_column(Text, nullable=True)
    execution_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_kb: Mapped[float | None] = mapped_column(Float, nullable=True)
    exit_code: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    test_results: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    submission: Mapped["CodeSubmission"] = relationship("CodeSubmission", back_populates="execution")


class CodingFeedback(Base):
    """
    AI-generated review attached to a specific code submission.
    """

    __tablename__ = "coding_feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    submission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("code_submissions.id", ondelete="CASCADE"), nullable=False
    )
    quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    time_complexity: Mapped[str] = mapped_column(String(50), nullable=False, default="O(?)")
    space_complexity: Mapped[str] = mapped_column(String(50), nullable=False, default="O(?)")
    bugs: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    suggestions: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    best_practices: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    interview_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    submission: Mapped["CodeSubmission"] = relationship("CodeSubmission", back_populates="feedback")
