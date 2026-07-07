"""
REST API endpoints for the Admin Panel.

Prefixed at: /api/admin
Roles allowed: admin
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, require_roles
from app.models.interview import Interview
from app.models.recruiter import (
    AdminSettings,
    AuditLog,
    Recruiter,
)
from app.models.user import User
from app.schemas.recruiter import (
    AdminSettingsResponse,
    AdminSettingsUpdate,
    AuditLogResponse,
    PlatformAnalyticsResponse,
    UserAdminResponse,
    UserUpdateRole,
)

router = APIRouter(dependencies=[Depends(require_roles("admin"))])


# Helper function to write system audit logs
async def write_admin_audit_log(
    db: AsyncSession,
    user_id: int,
    action: str,
    details: dict[str, Any],
) -> None:
    log = AuditLog(
        user_id=user_id,
        action=action,
        ip_address="127.0.0.1",
        details=details,
    )
    db.add(log)
    await db.flush()


# ---------------------------------------------------------------------------
# User Management
# ---------------------------------------------------------------------------

@router.get("/users", response_model=list[UserAdminResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all registered users and their permission roles."""
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserAdminResponse)
async def update_user_role(
    user_id: int,
    payload: UserUpdateRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Modify a user's RBAC system role or active state."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    old_role = user.role
    user.role = payload.role

    if payload.is_active is not None:
        user.is_active = payload.is_active

    # Audit log
    await write_admin_audit_log(
        db,
        current_user.id,
        "update_user_role",
        {"target_user_id": user_id, "old_role": old_role, "new_role": payload.role},
    )
    await db.commit()
    await db.refresh(user)
    return user
@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a user account from the system."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self deletion is forbidden.",
        )

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    await db.execute(delete(User).where(User.id == user_id))
    await write_admin_audit_log(
        db,
        current_user.id,
        "delete_user_account",
        {"deleted_user_id": user_id},
    )
    await db.commit()
    return {"detail": "User deleted successfully"}


# ---------------------------------------------------------------------------
# Settings & Feature Flags
# ---------------------------------------------------------------------------

@router.get("/settings", response_model=list[AdminSettingsResponse])
async def get_all_settings(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all configuration keys and feature flags."""
    res = await db.execute(select(AdminSettings).order_by(AdminSettings.key))
    return res.scalars().all()


@router.post("/settings/{key}", response_model=AdminSettingsResponse)
async def update_setting(
    key: str,
    payload: AdminSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Set or update application system settings by key."""
    res = await db.execute(select(AdminSettings).where(AdminSettings.key == key))
    setting = res.scalar_one_or_none()

    if not setting:
        setting = AdminSettings(
            key=key,
            value=payload.value,
            description=payload.description,
        )
        db.add(setting)
    else:
        setting.value = payload.value
        if payload.description:
            setting.description = payload.description

    await write_admin_audit_log(
        db,
        current_user.id,
        "update_system_setting",
        {"key": key, "value": payload.value},
    )
    await db.commit()
    await db.refresh(setting)
    return setting


# ---------------------------------------------------------------------------
# Audit Trail logs
# ---------------------------------------------------------------------------

@router.get("/logs", response_model=list[AuditLogResponse])
async def list_audit_logs(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch complete list of audit logs."""
    res = await db.execute(
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.created_at.desc())
    )
    logs = res.scalars().all()
    return [
        AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            ip_address=log.ip_address,
            details=log.details,
            created_at=log.created_at,
            user_email=log.user.email if log.user else None,
        )
        for log in logs
    ]


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=PlatformAnalyticsResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> Any:
    """Calculate platform metrics and statistics."""
    candidates_count = await db.scalar(
        select(func.count()).select_from(User).where(User.role == "candidate")
    )
    recruiters_count = await db.scalar(
        select(func.count()).select_from(Recruiter)
    )
    interviews_completed = await db.scalar(
        select(func.count()).select_from(Interview).where(Interview.status == "completed")
    )

    # Calculate average rating
    from app.models.interview import InterviewFeedback
    avg_score = await db.scalar(
        select(func.avg(InterviewFeedback.overall_score))
    )

    return PlatformAnalyticsResponse(
        total_candidates=candidates_count or 0,
        total_recruiters=recruiters_count or 0,
        total_interviews_completed=interviews_completed or 0,
        average_score=float(round(avg_score, 2)) if avg_score else 0.0,
        provider_configurations={
            "Active LLM": "Gemini-1.5-Flash",
            "Active STT": "Mock Speech-to-Text",
            "Active TTS": "Mock Text-to-Speech",
        },
        system_load=0.15,
    )
