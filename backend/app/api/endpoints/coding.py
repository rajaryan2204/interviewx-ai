"""
REST API endpoints for the AI Coding Interview Platform.

Prefixed at: /api/coding
"""

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.ai.execution import ExecutorFactory
from app.core.ai.factory import AIProviderFactory
from app.core.ai.prompts import PromptBuilder
from app.models.coding import (
    CodeExecution,
    CodeSubmission,
    CodingFeedback,
    CodingQuestion,
    CodingSession,
)
from app.models.user import User
from app.schemas.coding import (
    CodeRunRequest,
    CodeRunResponse,
    CodeSnapshotSave,
    CodeSubmissionDetail,
    CodeSubmissionSummary,
    CodeSubmitRequest,
    CodeSubmitResponse,
    CodingFeedbackResponse,
    CodingQuestionDetail,
    CodingQuestionListItem,
    CodingSessionCreate,
    CodingSessionDetail,
    CodingSessionResponse,
    TestCaseResult,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------


@router.get("/questions", response_model=list[CodingQuestionListItem])
async def list_questions(
    difficulty: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Any:
    """
    List all active coding questions. Supports filtering by difficulty and category.
    """
    query = select(CodingQuestion).where(CodingQuestion.is_active == True)  # noqa: E712
    if difficulty:
        query = query.where(CodingQuestion.difficulty == difficulty.lower())
    if category:
        query = query.where(CodingQuestion.category == category)

    result = await db.execute(query.order_by(CodingQuestion.id))
    return result.scalars().all()


@router.get("/questions/{question_id}", response_model=CodingQuestionDetail)
async def get_question_detail(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve full detail for a single question (no hidden test cases exposed)."""
    result = await db.execute(
        select(CodingQuestion).where(
            CodingQuestion.id == question_id, CodingQuestion.is_active == True  # noqa: E712
        )
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    return question


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------


@router.post("/sessions", response_model=CodingSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: CodingSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Start a new coding session for a question.
    If an in_progress session already exists for the same question+language, resume it.
    """
    from app.api.deps import check_usage_limit
    await check_usage_limit(db, current_user, "coding")

    # Check for existing in-progress session
    existing = await db.execute(
        select(CodingSession).where(
            CodingSession.user_id == current_user.id,
            CodingSession.question_id == payload.question_id,
            CodingSession.language == payload.language,
            CodingSession.status == "in_progress",
        )
    )
    session = existing.scalar_one_or_none()
    if session:
        return session

    # Validate question exists
    q_result = await db.execute(
        select(CodingQuestion).where(CodingQuestion.id == payload.question_id, CodingQuestion.is_active == True)  # noqa: E712
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    # Seed code snapshot from default stub
    starter_code = question.default_code.get(payload.language, "")

    session = CodingSession(
        user_id=current_user.id,
        question_id=payload.question_id,
        language=payload.language,
        status="in_progress",
        code_snapshot=starter_code,
        timer_seconds_elapsed=0,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions", response_model=list[CodingSessionDetail])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all coding sessions for the current user."""
    result = await db.execute(
        select(CodingSession)
        .where(CodingSession.user_id == current_user.id)
        .options(selectinload(CodingSession.question))
        .order_by(CodingSession.started_at.desc())
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=CodingSessionDetail)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve a single coding session with question detail."""
    result = await db.execute(
        select(CodingSession)
        .where(CodingSession.id == session_id, CodingSession.user_id == current_user.id)
        .options(selectinload(CodingSession.question))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    return session


@router.patch("/sessions/{session_id}/save", response_model=CodingSessionResponse)
async def save_snapshot(
    session_id: int,
    payload: CodeSnapshotSave,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Auto-save code snapshot and elapsed timer."""
    result = await db.execute(
        select(CodingSession).where(
            CodingSession.id == session_id, CodingSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    session.code_snapshot = payload.code
    session.timer_seconds_elapsed = payload.timer_seconds_elapsed
    session.language = payload.language
    await db.commit()
    await db.refresh(session)
    return session


# ---------------------------------------------------------------------------
# Code Run (against sample / custom test cases)
# ---------------------------------------------------------------------------


@router.post("/sessions/{session_id}/run", response_model=CodeRunResponse)
async def run_code(
    session_id: int,
    payload: CodeRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Run code against sample (public) test cases or a custom input.
    Does NOT count as a submission or affect verdicts.
    """
    result = await db.execute(
        select(CodingSession)
        .where(CodingSession.id == session_id, CodingSession.user_id == current_user.id)
        .options(selectinload(CodingSession.question))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    question = session.question
    test_cases = question.test_cases_public if not payload.custom_input else []

    executor = ExecutorFactory.get()
    exec_result = await executor.run(
        code=payload.code,
        language=payload.language,
        test_cases=test_cases,
        is_run_only=True,
        custom_input=payload.custom_input,
    )

    # Persist run as a submission (is_run=True)
    submission = CodeSubmission(
        session_id=session_id,
        language=payload.language,
        code=payload.code,
        is_run=True,
        verdict=exec_result.verdict,
        passed_tests=exec_result.passed_tests,
        total_tests=exec_result.total_tests,
        runtime_ms=exec_result.runtime_ms,
        memory_kb=exec_result.memory_kb,
    )
    db.add(submission)
    await db.flush()

    execution = CodeExecution(
        submission_id=submission.id,
        stdout=exec_result.stdout,
        stderr=exec_result.stderr,
        execution_time_ms=exec_result.runtime_ms,
        memory_kb=exec_result.memory_kb,
        exit_code=0 if exec_result.verdict == "accepted" else 1,
        test_results=exec_result.test_results,
    )
    db.add(execution)
    await db.commit()
    await db.refresh(submission)

    return CodeRunResponse(
        verdict=exec_result.verdict,
        passed_tests=exec_result.passed_tests,
        total_tests=exec_result.total_tests,
        runtime_ms=exec_result.runtime_ms,
        memory_kb=exec_result.memory_kb,
        stdout=exec_result.stdout,
        stderr=exec_result.stderr,
        test_results=[
            TestCaseResult(**tr) for tr in exec_result.test_results
        ],
        submission_id=submission.id,
    )


# ---------------------------------------------------------------------------
# Code Submit (against ALL hidden test cases)
# ---------------------------------------------------------------------------


@router.post("/sessions/{session_id}/submit", response_model=CodeSubmitResponse)
async def submit_code(
    session_id: int,
    payload: CodeSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Submit code against all hidden test cases.
    Marks the session as completed if all tests pass.
    """
    result = await db.execute(
        select(CodingSession)
        .where(CodingSession.id == session_id, CodingSession.user_id == current_user.id)
        .options(selectinload(CodingSession.question))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    question = session.question
    # Use hidden test cases for submit; fallback to public if no hidden defined
    test_cases = question.test_cases_hidden or question.test_cases_public

    executor = ExecutorFactory.get()
    exec_result = await executor.run(
        code=payload.code,
        language=payload.language,
        test_cases=test_cases,
        is_run_only=False,
    )

    # Persist full submission
    submission = CodeSubmission(
        session_id=session_id,
        language=payload.language,
        code=payload.code,
        is_run=False,
        verdict=exec_result.verdict,
        passed_tests=exec_result.passed_tests,
        total_tests=exec_result.total_tests,
        runtime_ms=exec_result.runtime_ms,
        memory_kb=exec_result.memory_kb,
    )
    db.add(submission)
    await db.flush()

    execution = CodeExecution(
        submission_id=submission.id,
        stdout=exec_result.stdout,
        stderr=exec_result.stderr,
        execution_time_ms=exec_result.runtime_ms,
        memory_kb=exec_result.memory_kb,
        exit_code=0 if exec_result.verdict == "accepted" else 1,
        test_results=exec_result.test_results,
    )
    db.add(execution)

    # Mark session completed if accepted
    if exec_result.verdict == "accepted":
        session.status = "completed"
        session.code_snapshot = payload.code

    await db.commit()
    await db.refresh(submission)

    return CodeSubmitResponse(
        verdict=exec_result.verdict,
        passed_tests=exec_result.passed_tests,
        total_tests=exec_result.total_tests,
        runtime_ms=exec_result.runtime_ms,
        memory_kb=exec_result.memory_kb,
        stdout=exec_result.stdout,
        stderr=exec_result.stderr,
        test_results=[TestCaseResult(**tr) for tr in exec_result.test_results],
        submission_id=submission.id,
    )


# ---------------------------------------------------------------------------
# Submission History
# ---------------------------------------------------------------------------


@router.get("/sessions/{session_id}/submissions", response_model=list[CodeSubmissionSummary])
async def get_submission_history(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all submissions for a session (newest first)."""
    # Verify session ownership
    s_result = await db.execute(
        select(CodingSession).where(
            CodingSession.id == session_id, CodingSession.user_id == current_user.id
        )
    )
    if not s_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    result = await db.execute(
        select(CodeSubmission)
        .where(CodeSubmission.session_id == session_id)
        .order_by(CodeSubmission.submitted_at.desc())
    )
    return result.scalars().all()


@router.get("/submissions/{submission_id}", response_model=CodeSubmissionDetail)
async def get_submission_detail(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get full detail for a single submission including execution output and AI review."""
    result = await db.execute(
        select(CodeSubmission)
        .join(CodingSession, CodeSubmission.session_id == CodingSession.id)
        .where(
            CodeSubmission.id == submission_id,
            CodingSession.user_id == current_user.id,
        )
        .options(
            selectinload(CodeSubmission.execution),
            selectinload(CodeSubmission.feedback),
        )
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")
    return submission


# ---------------------------------------------------------------------------
# AI Code Review
# ---------------------------------------------------------------------------


@router.post("/submissions/{submission_id}/review", response_model=CodingFeedbackResponse, status_code=status.HTTP_201_CREATED)
async def generate_ai_review(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Generate an AI code review for a submission.
    If a review already exists, returns the existing one.
    """
    result = await db.execute(
        select(CodeSubmission)
        .join(CodingSession, CodeSubmission.session_id == CodingSession.id)
        .where(
            CodeSubmission.id == submission_id,
            CodingSession.user_id == current_user.id,
        )
        .options(
            selectinload(CodeSubmission.feedback),
            selectinload(CodeSubmission.session).selectinload(CodingSession.question),
        )
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    # Return cached review if available
    if submission.feedback:
        return submission.feedback

    question = submission.session.question

    # Build AI prompt
    prompt = PromptBuilder.compile(
        "coding_ai_review",
        problem_title=question.title,
        difficulty=question.difficulty,
        category=question.category,
        language=submission.language,
        code=submission.code,
        verdict=submission.verdict or "unknown",
        passed_tests=submission.passed_tests,
        total_tests=submission.total_tests,
    )

    # Structured output schema for the review
    review_schema = {
        "type": "object",
        "properties": {
            "quality_score": {"type": "number"},
            "time_complexity": {"type": "string"},
            "space_complexity": {"type": "string"},
            "bugs": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "severity": {"type": "string"},
                        "description": {"type": "string"},
                        "line_hint": {"type": "string"},
                    },
                },
            },
            "suggestions": {"type": "array", "items": {"type": "string"}},
            "best_practices": {"type": "array", "items": {"type": "string"}},
            "interview_notes": {"type": "string"},
        },
        "required": ["quality_score", "time_complexity", "space_complexity", "bugs", "suggestions", "best_practices", "interview_notes"],
    }

    ai_provider = AIProviderFactory.get_provider()
    raw_response = await ai_provider.generate_json(prompt, review_schema)

    # Parse JSON from AI response
    try:
        if isinstance(raw_response, dict):
            review_data = raw_response
        elif isinstance(raw_response, str):
            # Strip markdown fences if present
            clean = raw_response.strip().strip("```json").strip("```").strip()
            review_data = json.loads(clean)
        else:
            review_data = {}
    except (json.JSONDecodeError, ValueError):
        # Fallback sensible defaults so we never crash
        review_data = {}

    feedback = CodingFeedback(
        submission_id=submission_id,
        quality_score=float(review_data.get("quality_score", 70.0)),
        time_complexity=str(review_data.get("time_complexity", "O(?)")),
        space_complexity=str(review_data.get("space_complexity", "O(?)")),
        bugs=review_data.get("bugs", []),
        suggestions=review_data.get("suggestions", []),
        best_practices=review_data.get("best_practices", []),
        interview_notes=review_data.get("interview_notes"),
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


@router.get("/submissions/{submission_id}/review", response_model=CodingFeedbackResponse)
async def get_ai_review(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch the existing AI code review for a submission."""
    result = await db.execute(
        select(CodingFeedback)
        .join(CodeSubmission, CodingFeedback.submission_id == CodeSubmission.id)
        .join(CodingSession, CodeSubmission.session_id == CodingSession.id)
        .where(
            CodingFeedback.submission_id == submission_id,
            CodingSession.user_id == current_user.id,
        )
    )
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI review found. POST to generate one first.",
        )
    return feedback
