"""
REST API endpoints for the Recruiter Portal.

Prefixed at: /api/recruiter
Roles allowed: recruiter, admin
"""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, require_roles
from app.models.coding import CodingSession
from app.models.interview import Interview
from app.models.recruiter import (
    AuditLog,
    CandidateAssignment,
    Company,
    InterviewTemplate,
    Recruiter,
    RecruiterInterview,
)
from app.models.resume import Resume
from app.models.user import User
from app.schemas.recruiter import (
    CandidateAssignmentCreate,
    CandidateAssignmentResponse,
    CompanyResponse,
    CompanyUpdate,
    InterviewTemplateCreate,
    InterviewTemplateResponse,
    RecruiterInterviewCreate,
    RecruiterInterviewResponse,
    UserAdminResponse,
)

router = APIRouter(dependencies=[Depends(require_roles("recruiter", "admin"))])


# Helper function to write system audit logs
async def write_audit_log(
    db: AsyncSession,
    user_id: int,
    action: str,
    details: dict[str, Any],
) -> None:
    log = AuditLog(
        user_id=user_id,
        action=action,
        ip_address="127.0.0.1",  # Local mock IP
        details=details,
    )
    db.add(log)
    await db.flush()


# ---------------------------------------------------------------------------
# Company Profiles
# ---------------------------------------------------------------------------

@router.get("/company", response_model=CompanyResponse)
async def get_recruiter_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get company profile details associated with the current recruiter."""
    # Find recruiter profile
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter profile not registered. Associate user with a company first.",
        )

    comp_result = await db.execute(
        select(Company).where(Company.id == recruiter.company_id)
    )
    company = comp_result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )
    return company


@router.patch("/company", response_model=CompanyResponse)
async def update_recruiter_company(
    payload: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update details of the associated company profile."""
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found.")

    comp_result = await db.execute(
        select(Company).where(Company.id == recruiter.company_id)
    )
    company = comp_result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company profile not found.")

    # Apply changes
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(company, k, v)

    await write_audit_log(
        db,
        current_user.id,
        "update_company_profile",
        {"company_id": company.id, "changes": list(update_data.keys())},
    )
    await db.commit()
    await db.refresh(company)
    return company


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

@router.post("/templates", response_model=InterviewTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: InterviewTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a company-wide interview template."""
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not registered.")

    template = InterviewTemplate(
        company_id=recruiter.company_id,
        title=payload.title,
        job_role=payload.job_role,
        experience_level=payload.experience_level,
        duration_minutes=payload.duration_minutes,
        question_count=payload.question_count,
        questions=payload.questions,
    )
    db.add(template)
    await db.flush()

    await write_audit_log(
        db,
        current_user.id,
        "create_interview_template",
        {"template_id": template.id, "title": template.title},
    )
    await db.commit()
    await db.refresh(template)
    return template


@router.get("/templates", response_model=list[InterviewTemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all templates configured for the recruiter's company."""
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        return []

    result = await db.execute(
        select(InterviewTemplate).where(InterviewTemplate.company_id == recruiter.company_id)
    )
    return result.scalars().all()


@router.delete("/templates/{template_id}", status_code=status.HTTP_200_OK)
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a company template."""
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found.")

    res = await db.execute(
        select(InterviewTemplate).where(
            InterviewTemplate.id == template_id,
            InterviewTemplate.company_id == recruiter.company_id,
        )
    )
    template = res.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found.")

    await db.delete(template)
    await write_audit_log(
        db,
        current_user.id,
        "delete_interview_template",
        {"template_id": template_id},
    )
    await db.commit()
    return {"detail": "Template deleted successfully"}


# ---------------------------------------------------------------------------
# Recruiter Interview Flows
# ---------------------------------------------------------------------------

@router.post("/interviews", response_model=RecruiterInterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview_flow(
    payload: RecruiterInterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a company-specific structured interview flow."""
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found.")

    flow = RecruiterInterview(
        recruiter_id=recruiter.id,
        company_id=recruiter.company_id,
        title=payload.title,
        description=payload.description,
        job_role=payload.job_role,
        flow_config=payload.flow_config,
    )
    db.add(flow)
    await db.flush()

    await write_audit_log(
        db,
        current_user.id,
        "create_interview_flow",
        {"interview_flow_id": flow.id, "title": flow.title},
    )
    await db.commit()
    await db.refresh(flow)
    return flow


@router.get("/interviews", response_model=list[RecruiterInterviewResponse])
async def list_interview_flows(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all configured recruiter interview flows."""
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        return []

    result = await db.execute(
        select(RecruiterInterview).where(RecruiterInterview.company_id == recruiter.company_id)
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Assignments & Invites
# ---------------------------------------------------------------------------

@router.post("/assignments", response_model=CandidateAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    payload: CandidateAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Assign or invite a candidate (resolved by email) to an interview flow."""
    # Find recruiter
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found.")

    # Find the interview flow
    flow_result = await db.execute(
        select(RecruiterInterview).where(
            RecruiterInterview.id == payload.recruiter_interview_id,
            RecruiterInterview.company_id == recruiter.company_id,
        )
    )
    flow = flow_result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview flow not found.")

    # Find candidate user
    cand_result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No candidate registered with email '{payload.email}'. Assign existing users only.",
        )

    # Make token
    import secrets
    invite_token = secrets.token_urlsafe(16)

    assignment = CandidateAssignment(
        user_id=candidate.id,
        recruiter_interview_id=flow.id,
        status="invited",
        invite_token=invite_token,
    )
    db.add(assignment)
    await db.flush()

    await write_audit_log(
        db,
        current_user.id,
        "invite_candidate",
        {"assignment_id": assignment.id, "email": payload.email},
    )
    await db.commit()
    await db.refresh(assignment)

    return CandidateAssignmentResponse(
        id=assignment.id,
        user_id=assignment.user_id,
        recruiter_interview_id=assignment.recruiter_interview_id,
        status=assignment.status,
        invite_token=assignment.invite_token,
        score=assignment.score,
        feedback_summary=assignment.feedback_summary,
        assigned_at=assignment.assigned_at,
        completed_at=assignment.completed_at,
        user_email=candidate.email,
        user_full_name=candidate.full_name,
        interview_title=flow.title,
    )


@router.get("/assignments", response_model=list[CandidateAssignmentResponse])
async def list_assignments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all candidate assignments for the recruiter's company."""
    rec_result = await db.execute(
        select(Recruiter).where(Recruiter.user_id == current_user.id)
    )
    recruiter = rec_result.scalar_one_or_none()
    if not recruiter:
        return []

    result = await db.execute(
        select(CandidateAssignment)
        .join(RecruiterInterview, CandidateAssignment.recruiter_interview_id == RecruiterInterview.id)
        .where(RecruiterInterview.company_id == recruiter.company_id)
        .options(
            selectinload(CandidateAssignment.user),
            selectinload(CandidateAssignment.recruiter_interview),
        )
    )
    assignments = result.scalars().all()
    return [
        CandidateAssignmentResponse(
            id=a.id,
            user_id=a.user_id,
            recruiter_interview_id=a.recruiter_interview_id,
            status=a.status,
            invite_token=a.invite_token,
            score=a.score,
            feedback_summary=a.feedback_summary,
            assigned_at=a.assigned_at,
            completed_at=a.completed_at,
            user_email=a.user.email,
            user_full_name=a.user.full_name,
            interview_title=a.recruiter_interview.title,
        )
        for a in assignments
    ]


# ---------------------------------------------------------------------------
# Reports & Candidate Detail
# ---------------------------------------------------------------------------

@router.get("/candidates", response_model=list[UserAdminResponse])
async def list_candidates(
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Any:
    """Search and filter candidate profiles for assignment eligibility."""
    query = select(User).where(User.role == "candidate")
    if search:
        query = query.where(
            (User.email.icontains(search)) | (User.full_name.icontains(search))
        )
    result = await db.execute(query.order_by(User.id))
    return result.scalars().all()


@router.get("/candidates/{candidate_id}/reports")
async def get_candidate_reports(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all historical report records of a specific candidate user.
    """
    # 1. Fetch user mock interviews with feedback
    int_result = await db.execute(
        select(Interview)
        .where(Interview.user_id == candidate_id)
        .options(selectinload(Interview.feedback))
    )
    interviews = int_result.scalars().all()

    # 2. Fetch coding sessions with submission summary
    cod_result = await db.execute(
        select(CodingSession)
        .where(CodingSession.user_id == candidate_id)
        .options(selectinload(CodingSession.question))
    )
    coding_sessions = cod_result.scalars().all()

    # 3. Fetch uploaded Resumes
    res_result = await db.execute(
        select(Resume).where(Resume.user_id == candidate_id)
    )
    resumes = res_result.scalars().all()

    return {
        "interviews": [
            {
                "id": i.id,
                "job_role": i.job_role,
                "company": i.company,
                "interview_type": i.interview_type,
                "difficulty": i.difficulty,
                "status": i.status,
                "created_at": i.created_at,
                "feedback": i.feedback,
            }
            for i in interviews
        ],
        "coding": [
            {
                "id": c.id,
                "question_title": c.question.title,
                "language": c.language,
                "status": c.status,
                "timer_seconds": c.timer_seconds_elapsed,
                "updated_at": c.updated_at,
            }
            for c in coding_sessions
        ],
        "resumes": [
            {
                "id": r.id,
                "filename": r.file_name,
                "ats_score": r.analysis.get("ats_score", 0),
                "missing_skills": r.analysis.get("missing_skills", []),
                "uploaded_at": r.uploaded_at,
            }
            for r in resumes
        ],
    }


@router.get("/candidates/{candidate_id}/reports/download", response_class=PlainTextResponse)
async def download_candidate_report(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Any:
    """Download a text-based evaluation summary report."""
    # Fetch details
    u_result = await db.execute(select(User).where(User.id == candidate_id))
    user = u_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found")

    res = await get_candidate_reports(candidate_id, db, _current_user)

    lines = [
        "INTERVIEWX AI CANDIDATE EVALUATION SUMMARY REPORT",
        "================================================",
        f"Candidate Name: {user.full_name or 'Not specified'}",
        f"Candidate Email: {user.email}",
        f"Report Timestamp: {datetime.utcnow().isoformat()}",
        "",
        "RESUMES ATTACHED",
        "----------------",
    ]
    for r in res["resumes"]:
        lines.append(f"- File: {r['filename']} | ATS Score: {r['ats_score']}/100")
        lines.append(f"  Missing Skills: {', '.join(r['missing_skills'] or [])}")

    lines.extend(["", "MOCK INTERVIEWS COMPLETED", "-------------------------"])
    for i in res["interviews"]:
        lines.append(f"- Role: {i['job_role']} at {i['company'] or 'Practice'}")
        lines.append(f"  Type: {i['interview_type']} | Status: {i['status']}")
        if i["feedback"]:
            lines.append(f"  Overall Score: {i['feedback']['overall_score']}/10")
            lines.append(f"  Technical rating: {i['feedback']['technical_score']}/10")

    lines.extend(["", "CODING TESTS", "------------"])
    for c in res["coding"]:
        lines.append(f"- Problem: {c['question_title']} ({c['language']}) | Status: {c['status']}")

    return "\n".join(lines)
