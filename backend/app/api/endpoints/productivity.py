from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_roles
from app.models.productivity import (
    CalendarEvent,
    EmailLog,
    Goal,
    Notification,
    Reminder,
    Task,
)
from app.models.user import User, UserFeedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.schemas.productivity import (
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
    EmailLogResponse,
    GoalCreate,
    GoalResponse,
    GoalUpdateProgress,
    NotificationResponse,
    ReminderResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.services.email import send_templated_email
from app.services.reminders import (
    check_and_create_streak_reminder,
    generate_ai_reminder_suggestion,
)

router = APIRouter()


# ===========================================================================
# 1. CALENDAR EVENT ENDPOINTS
# ===========================================================================

@router.get("/calendar", response_model=list[CalendarEventResponse])
async def list_calendar_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all calendar events for the active user."""
    res = await db.execute(
        select(CalendarEvent)
        .where(CalendarEvent.user_id == current_user.id)
        .order_by(CalendarEvent.start_time.asc())
    )
    return res.scalars().all()


@router.post("/calendar", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    payload: CalendarEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new calendar event (scheduled mock interview/practice session)."""
    event = CalendarEvent(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        start_time=payload.start_time,
        end_time=payload.end_time,
        type=payload.type,
        status=payload.status,
        meeting_link=payload.meeting_link,
    )
    db.add(event)

    # Automatically create an in-app notification about scheduling
    notif = Notification(
        user_id=current_user.id,
        title="New Event Scheduled 📅",
        message=f"Your {event.type} event '{event.title}' is scheduled for {event.start_time.strftime('%Y-%m-%d %H:%M')}.",
        type="general",
    )
    db.add(notif)

    await db.commit()
    await db.refresh(event)
    return event


@router.patch("/calendar/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(
    event_id: int,
    payload: CalendarEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Reschedule or update a calendar event."""
    res = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
    )
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found.")

    # Apply updates
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(event, field, val)

    # Log notification if status changes (e.g. rescheduled/cancelled)
    if "status" in update_data or "start_time" in update_data:
        notif = Notification(
            user_id=current_user.id,
            title="Event Updated 🔄",
            message=f"Event '{event.title}' status: {event.status}. Start time: {event.start_time.strftime('%Y-%m-%d %H:%M')}.",
            type="general",
        )
        db.add(notif)

    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/calendar/{event_id}", status_code=status.HTTP_200_OK)
async def cancel_calendar_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Cancel and delete a calendar event."""
    res = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
    )
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found.")

    # Create a notification first
    notif = Notification(
        user_id=current_user.id,
        title="Event Cancelled ❌",
        message=f"Your scheduled event '{event.title}' has been successfully cancelled.",
        type="general",
    )
    db.add(notif)

    await db.delete(event)
    await db.commit()
    return {"detail": "Calendar event cancelled and removed successfully"}


# ===========================================================================
# 2. GOALS ENDPOINTS
# ===========================================================================

@router.get("/goals", response_model=list[GoalResponse])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all goals for the active user."""
    res = await db.execute(
        select(Goal).where(Goal.user_id == current_user.id).order_by(Goal.created_at.desc())
    )
    return res.scalars().all()


@router.post("/goals", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new preparation goal."""
    goal = Goal(
        user_id=current_user.id,
        title=payload.title,
        type=payload.type,
        target_value=payload.target_value,
        current_value=0,
        deadline=payload.deadline,
        status="in_progress",
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal_progress(
    goal_id: int,
    payload: GoalUpdateProgress,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update goal status or current progress value."""
    res = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = res.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "current_value" in update_data:
        goal.current_value = update_data["current_value"]
        # Auto-complete goal if current meets target
        if goal.current_value >= goal.target_value:
            goal.status = "completed"

    if "status" in update_data:
        goal.status = update_data["status"]

    if goal.status == "completed":
        # Send achievement notification
        notif = Notification(
            user_id=current_user.id,
            title="Goal Completed! 🏆",
            message=f"Congratulations! You completed your goal: '{goal.title}'!",
            type="achievement",
        )
        db.add(notif)

    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}", status_code=status.HTTP_200_OK)
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a goal."""
    res = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    )
    goal = res.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")

    await db.delete(goal)
    await db.commit()
    return {"detail": "Goal deleted successfully"}


# ===========================================================================
# 3. TASK SYSTEM ENDPOINTS
# ===========================================================================

@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve tasks (including daily practice checklist)."""
    res = await db.execute(
        select(Task).where(Task.user_id == current_user.id).order_by(Task.is_completed.asc(), Task.created_at.desc())
    )
    return res.scalars().all()


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a prep task or checklist item."""
    task = Task(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        deadline=payload.deadline,
        is_daily_checklist=payload.is_daily_checklist,
        is_completed=False,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Toggle completion, adjust priority, or shift deadlines."""
    res = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(task, field, val)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Remove a task."""
    res = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    await db.delete(task)
    await db.commit()
    return {"detail": "Task deleted successfully"}


# ===========================================================================
# 4. NOTIFICATION ENDPOINTS
# ===========================================================================

@router.get("/notifications", response_model=list[NotificationResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List in-app notifications for the user."""
    res = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    return res.scalars().all()


@router.patch("/notifications/{notif_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Mark a specific notification as read."""
    res = await db.execute(
        select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id)
    )
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif


@router.post("/notifications/clear-all", status_code=status.HTTP_200_OK)
async def clear_all_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Mark all notifications as read."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"detail": "All notifications marked as read"}


# ===========================================================================
# 5. REMINDER CENTER ENDPOINTS
# ===========================================================================

@router.get("/reminders", response_model=list[ReminderResponse])
async def list_reminders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all reminders (streak warnings, custom time pings)."""
    res = await db.execute(
        select(Reminder).where(Reminder.user_id == current_user.id).order_by(Reminder.trigger_time.asc())
    )
    return res.scalars().all()


@router.post("/reminders/streak", response_model=ReminderResponse)
async def trigger_streak_reminder(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Verify prep streak status and trigger streak warning reminder if necessary."""
    reminder = await check_and_create_streak_reminder(db, current_user.id)
    return reminder


@router.post("/reminders/generate-smart", response_model=ReminderResponse)
async def generate_smart_reminder(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Force generate a smart AI study suggestion reminder."""
    ai_suggestion = await generate_ai_reminder_suggestion(db, current_user.id)
    from datetime import datetime, timedelta

    reminder = Reminder(
        user_id=current_user.id,
        title="AI Personal Coding Target 💡",
        reminder_type="smart",
        trigger_time=datetime.utcnow() + timedelta(hours=1),
        is_sent=False,
        ai_suggestion=ai_suggestion,
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder


# ===========================================================================
# 6. EMAIL LOG SYSTEM
# ===========================================================================

@router.get("/emails/logs", response_model=list[EmailLogResponse])
async def list_email_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve history logs of dispatched emails."""
    res = await db.execute(
        select(EmailLog).where(EmailLog.user_id == current_user.id).order_by(EmailLog.sent_at.desc())
    )
    return res.scalars().all()


@router.post("/emails/trigger-test", status_code=status.HTTP_200_OK)
async def trigger_test_email(
    template_type: str,
    recipient_email: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Trigger dispatch of a templated test email to verify layout configurations."""
    target_email = recipient_email or current_user.email
    context = {
        "full_name": current_user.full_name or "Prep Star",
        "code": "489201",
        "link": "http://localhost:3000/interview/12",
        "company_name": "SaaSify AI Inc.",
        "job_role": "React Systems Architect",
        "time_str": "Monday, July 10 at 10:00 AM PST",
        "interviews_completed": 3,
        "coding_solved": 7,
        "avg_score": 8.5,
        "month": "July",
        "index_score": 92,
        "tier": "Premium Enterprise Access",
        "renewal_date": "2026-08-06",
    }
    result = await send_templated_email(
        db=db,
        user_id=current_user.id,
        recipient_email=target_email,
        template_type=template_type,
        context=context,
    )
    return result


@router.get("/dashboard-stats", response_model=dict[str, Any])
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve dynamic aggregated statistics for the candidate's dashboard."""
    from app.models.interview import Interview, InterviewFeedback
    from app.models.coding import CodingSession
    from app.models.resume import Resume

    # 1. Total Interviews Conducted
    int_stmt = select(func.count(Interview.id)).where(
        Interview.user_id == current_user.id
    )
    int_count_res = await db.execute(int_stmt)
    int_count = int_count_res.scalar() or 0

    # 2. Avg Evaluation Score
    score_stmt = select(func.avg(InterviewFeedback.overall_score)).join(
        Interview, InterviewFeedback.interview_id == Interview.id
    ).where(
        Interview.user_id == current_user.id
    )
    score_res = await db.execute(score_stmt)
    avg_score = float(score_res.scalar() or 0.0)

    # 3. Solved Coding Questions count
    coding_stmt = select(func.count(CodingSession.id)).where(
        CodingSession.user_id == current_user.id,
        CodingSession.status == "completed"
    )
    coding_res = await db.execute(coding_stmt)
    coding_solved = coding_res.scalar() or 0

    # 4. Latest Resume Score
    resume_stmt = select(Resume).where(
        Resume.user_id == current_user.id
    ).order_by(
        Resume.uploaded_at.desc()
    )
    resume_res = await db.execute(resume_stmt)
    latest_resume = resume_res.scalars().first()
    resume_score = 0.0
    if latest_resume and latest_resume.analysis:
        resume_score = float(latest_resume.analysis.get("ats_score") or latest_resume.analysis.get("score") or 0.0)

    # Calculate AI Readiness Rating (simple weighted average)
    coding_component = min(100.0, (coding_solved / 20.0) * 100.0) * 0.4
    resume_component = float(resume_score) * 0.3
    interview_component = (avg_score * 10.0) * 0.3
    readiness_rating = round(coding_component + resume_component + interview_component)
    if readiness_rating == 0:
        readiness_rating = 50

    # 5. Recent Interview Runs list
    runs_stmt = select(Interview).where(
        Interview.user_id == current_user.id
    ).order_by(
        Interview.created_at.desc()
    ).limit(3)
    runs_res = await db.execute(runs_stmt)
    runs = runs_res.scalars().all()
    
    recent_runs = []
    for run in runs:
        recent_runs.append({
            "id": str(run.id),
            "role": f"{run.job_role} ({run.interview_type.capitalize()})",
            "type": f"{run.experience_level.capitalize()} Level",
            "date": run.created_at.strftime("%b %d, %Y"),
            "score": "Pending" if run.status != "completed" else "Evaluated",
            "status": run.status.capitalize()
        })

    # 6. Activity Timeline list
    activities = []
    if latest_resume:
        activities.append({
            "id": "res_1",
            "activity": "Resume parsed & indexed",
            "description": f"Extracted keywords from {latest_resume.file_name}.",
            "time": latest_resume.uploaded_at.strftime("%b %d, %Y")
        })
    
    cs_stmt = select(CodingSession).where(
        CodingSession.user_id == current_user.id
    ).order_by(CodingSession.updated_at.desc()).limit(2)
    cs_res = await db.execute(cs_stmt)
    cs_list = cs_res.scalars().all()
    for cs in cs_list:
        activities.append({
            "id": f"cs_{cs.id}",
            "activity": "Coding Sandbox Run",
            "description": f"Worked on category: {cs.language.capitalize()}.",
            "time": cs.updated_at.strftime("%b %d, %Y")
        })

    if len(activities) == 0:
        activities.append({
            "id": "act_welcome",
            "activity": "Account workspace initialized",
            "description": "Welcome to your InterviewX AI preparation center.",
            "time": "Just now"
        })

    return {
        "interviews_conducted": int_count,
        "avg_score": round(avg_score, 1),
        "coding_solved": coding_solved,
        "readiness_rating": readiness_rating,
        "recent_runs": recent_runs,
        "activities": activities[:4]
    }


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_user_feedback(
    payload: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit platform feedback from a candidate user.
    """
    feedback = UserFeedback(
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    
    return FeedbackResponse(
        id=feedback.id,
        user_id=feedback.user_id,
        rating=feedback.rating,
        comment=feedback.comment,
        created_at=feedback.created_at,
        user_name=current_user.full_name or current_user.email,
    )


@router.get("/admin/feedback", response_model=list[FeedbackResponse])
async def list_user_feedback(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    """
    Retrieve all platform feedback entries for the administration portal.
    """
    stmt = select(UserFeedback).order_by(UserFeedback.created_at.desc())
    res = await db.execute(stmt)
    feedbacks = res.scalars().all()
    
    response_list = []
    for f in feedbacks:
        # Load user name dynamically to satisfy schema
        user_stmt = select(User).where(User.id == f.user_id)
        user_res = await db.execute(user_stmt)
        user_obj = user_res.scalar_one_or_none()
        user_name = user_obj.full_name or user_obj.email if user_obj else "Unknown User"
        
        response_list.append(
            FeedbackResponse(
                id=f.id,
                user_id=f.user_id,
                rating=f.rating,
                comment=f.comment,
                created_at=f.created_at,
                user_name=user_name,
            )
        )
        
    return response_list
