from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.resume import Resume
    from app.models.user import User


class Interview(Base):
    """
    SQLAlchemy model representing a mock interview configuration and session state.
    """

    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    resume_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True
    )
    job_role: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    experience_level: Mapped[str] = mapped_column(String(50), nullable=False)
    interview_type: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False
    )  # pending, ongoing, paused, completed
    current_question_index: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    time_remaining_seconds: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="interviews")
    resume: Mapped["Resume | None"] = relationship("Resume")
    questions: Mapped[list["InterviewQuestion"]] = relationship(
        "InterviewQuestion",
        back_populates="interview",
        cascade="all, delete-orphan",
        order_by="InterviewQuestion.question_order",
    )
    feedback: Mapped["InterviewFeedback | None"] = relationship(
        "InterviewFeedback",
        back_populates="interview",
        cascade="all, delete-orphan",
        uselist=False,
    )


class InterviewQuestion(Base):
    """
    SQLAlchemy model representing a question generated for a mock interview session.
    """

    __tablename__ = "interview_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    interview_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_order: Mapped[int] = mapped_column(Integer, nullable=False)
    topic: Mapped[str | None] = mapped_column(String(100), nullable=True)
    correct_answer_guideline: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # Relationships
    interview: Mapped["Interview"] = relationship(
        "Interview", back_populates="questions"
    )
    answer: Mapped["InterviewAnswer | None"] = relationship(
        "InterviewAnswer",
        back_populates="question",
        cascade="all, delete-orphan",
        uselist=False,
    )


class InterviewAnswer(Base):
    """
    SQLAlchemy model representing a candidate's response to an interview question.
    """

    __tablename__ = "interview_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("interview_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_answer: Mapped[str] = mapped_column(Text, nullable=False)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    question: Mapped["InterviewQuestion"] = relationship(
        "InterviewQuestion", back_populates="answer"
    )


class InterviewFeedback(Base):
    """
    SQLAlchemy model representing the computed AI evaluation report for a completed interview.
    """

    __tablename__ = "interview_feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    interview_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False
    )
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    technical_score: Mapped[float] = mapped_column(Float, nullable=False)
    communication_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    grammar_score: Mapped[float] = mapped_column(Float, nullable=False)
    strengths: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    weaknesses: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    improvement_plan: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    learning_roadmap: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    suggested_answers: Mapped[dict[str, str]] = mapped_column(
        JSON, nullable=False
    )
    voice_metrics: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    interview: Mapped["Interview"] = relationship(
        "Interview", back_populates="feedback"
    )
