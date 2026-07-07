from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai.service import AIService
from app.models.coding import CodingSession
from app.models.interview import Interview
from app.models.productivity import Reminder, Task


async def generate_ai_reminder_suggestion(db: AsyncSession, user_id: int) -> str:
    """
    Generates a personalized, AI-driven mock interview/coding preparation reminder
    by inspecting recent session counts, goals, and pending tasks.
    """
    # 1. Fetch statistics for prompt context
    # Pending tasks
    task_res = await db.execute(
        select(func.count(Task.id)).where(Task.user_id == user_id, Task.is_completed.is_(False))
    )
    pending_tasks = task_res.scalar() or 0

    # Coding sessions completed
    coding_res = await db.execute(
        select(func.count(CodingSession.id)).where(CodingSession.user_id == user_id)
    )
    completed_coding = coding_res.scalar() or 0

    # Interviews completed
    interview_res = await db.execute(
        select(func.count(Interview.id)).where(Interview.user_id == user_id)
    )
    completed_interviews = interview_res.scalar() or 0

    # 2. Build prompt context
    prompt = f"""
    The candidate has completed {completed_interviews} mock interviews and {completed_coding} coding exercises.
    They currently have {pending_tasks} pending preparation tasks on their checklist.
    Generate a concise, direct, one-sentence motivational study recommendation or streak reminder for today.
    """

    system_prompt = (
        "You are an elite Silicon Valley technical interview coach. "
        "Keep your output strictly to one sentence, engaging, professional, and directly motivational."
    )

    try:
        suggestion = await AIService.generate(prompt=prompt, system_prompt=system_prompt)
        suggestion = suggestion.strip().replace('"', "")
    except Exception:
        suggestion = (
            f"Set aside 15 minutes today to complete one of your {pending_tasks} preparation tasks!"
        )

    return suggestion


async def check_and_create_streak_reminder(db: AsyncSession, user_id: int) -> Reminder:
    """
    Simulates checking streaks and automatically creates a Reminder db entry if needed.
    """
    # Check if there's already a reminder created today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_res = await db.execute(
        select(Reminder).where(
            Reminder.user_id == user_id,
            Reminder.created_at >= today_start,
            Reminder.reminder_type == "streak"
        )
    )
    existing = existing_res.scalar_one_or_none()
    if existing:
        return existing

    ai_sugg = await generate_ai_reminder_suggestion(db, user_id)

    new_reminder = Reminder(
        user_id=user_id,
        title="Maintain your daily prep streak! 🔥",
        reminder_type="streak",
        trigger_time=datetime.utcnow() + timedelta(hours=2),
        is_sent=False,
        ai_suggestion=ai_sugg,
    )
    db.add(new_reminder)
    await db.commit()
    await db.refresh(new_reminder)
    return new_reminder
