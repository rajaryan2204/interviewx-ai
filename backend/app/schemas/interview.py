from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class InterviewCreate(BaseModel):
    job_role: str = Field(..., max_length=255)
    company: str | None = Field(None, max_length=255)
    experience_level: str = Field(..., max_length=50)
    interview_type: str = Field(..., max_length=50)
    difficulty: str = Field(..., max_length=50)
    question_count: int = Field(5, ge=1, le=20)
    duration_minutes: int = Field(15, ge=5, le=60)
    language: str = Field("English", max_length=50)
    resume_id: int | None = None


class InterviewAnswerResponse(BaseModel):
    id: int
    question_id: int
    user_answer: str
    time_taken_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_order: int
    topic: str | None = None
    correct_answer_guideline: str | None = None
    answer: InterviewAnswerResponse | None = None

    class Config:
        from_attributes = True


class InterviewResponse(BaseModel):
    id: int
    job_role: str
    company: str | None = None
    experience_level: str
    interview_type: str
    difficulty: str
    question_count: int
    duration_minutes: int
    language: str
    status: str
    current_question_index: int
    time_remaining_seconds: int | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True





class AnswerSubmit(BaseModel):
    question_id: int
    user_answer: str
    time_taken_seconds: int


class InterviewFeedbackResponse(BaseModel):
    id: int
    interview_id: int
    overall_score: float
    technical_score: float
    communication_score: float
    confidence_score: float
    grammar_score: float
    strengths: list[str]
    weaknesses: list[str]
    improvement_plan: list[str]
    learning_roadmap: list[str]
    suggested_answers: dict[str, str]
    voice_metrics: dict[str, Any] | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewDetailResponse(InterviewResponse):
    questions: list[InterviewQuestionResponse] = []
    feedback: InterviewFeedbackResponse | None = None


class InterviewSessionUpdate(BaseModel):
    current_question_index: int
    time_remaining_seconds: int | None = None


class VoiceSTTResponse(BaseModel):
    text: str


class VoiceTTSRequest(BaseModel):
    text: str


class VoiceFollowUpRequest(BaseModel):
    question_id: int
    user_answer: str


class VoiceFollowUpResponse(BaseModel):
    follow_up_question: str
    question_id: int

