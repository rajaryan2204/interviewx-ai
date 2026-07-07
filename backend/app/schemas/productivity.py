from datetime import datetime

from pydantic import BaseModel, Field


# --- CALENDAR EVENT SCHEMAS ---
class CalendarEventBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    start_time: datetime
    end_time: datetime
    type: str = "interview"  # interview, practice, custom
    status: str = "scheduled"  # scheduled, rescheduled, cancelled
    meeting_link: str | None = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    type: str | None = None
    status: str | None = None
    meeting_link: str | None = None


class CalendarEventResponse(CalendarEventBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- NOTIFICATION SCHEMAS ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- REMINDER SCHEMAS ---
class ReminderCreate(BaseModel):
    title: str = Field(..., max_length=255)
    reminder_type: str = "smart"  # streak, smart, missed_practice, custom
    trigger_time: datetime
    ai_suggestion: str | None = None


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    title: str
    reminder_type: str
    trigger_time: datetime
    is_sent: bool
    ai_suggestion: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- GOAL SCHEMAS ---
class GoalCreate(BaseModel):
    title: str = Field(..., max_length=255)
    type: str  # weekly, monthly, company, coding, communication
    target_value: int = 1
    deadline: datetime | None = None


class GoalUpdateProgress(BaseModel):
    current_value: int | None = None
    status: str | None = None  # in_progress, completed, failed


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    type: str
    target_value: int
    current_value: int
    deadline: datetime | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- TASK SCHEMAS ---
class TaskCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    priority: str = "medium"  # low, medium, high
    deadline: datetime | None = None
    is_daily_checklist: bool = False


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    deadline: datetime | None = None
    is_completed: bool | None = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None = None
    priority: str
    deadline: datetime | None = None
    is_completed: bool
    is_daily_checklist: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- EMAIL LOG SCHEMAS ---
class EmailLogResponse(BaseModel):
    id: int
    user_id: int | None = None
    recipient_email: str
    template_type: str
    subject: str
    sent_at: datetime
    status: str

    class Config:
        from_attributes = True
