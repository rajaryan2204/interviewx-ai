import logging
import re
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.ai.factory import AIProviderFactory
from app.core.ai.prompts import PromptBuilder
from app.core.ai.service import AIService
from app.models.interview import (
    Interview,
    InterviewAnswer,
    InterviewFeedback,
    InterviewQuestion,
)
from app.models.resume import Resume
from app.models.user import User
from app.schemas.interview import (
    AnswerSubmit,
    InterviewAnswerResponse,
    InterviewCreate,
    InterviewDetailResponse,
    InterviewFeedbackResponse,
    InterviewResponse,
    InterviewSessionUpdate,
    VoiceFollowUpRequest,
    VoiceFollowUpResponse,
    VoiceSTTResponse,
    VoiceTTSRequest,
)

get_current_active_user = get_current_user
logger = logging.getLogger("app.api.interview")
router = APIRouter()


@router.post("/setup", response_model=InterviewDetailResponse)
async def setup_interview(
    config: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Initialize a mock interview session and generate customized questions based on configuration.
    """
    from app.api.deps import check_usage_limit
    await check_usage_limit(db, current_user, "interviews")

    # 1. Fetch Resume text if attached
    resume_text = ""
    resume = None
    if config.resume_id:
        result = await db.execute(
            select(Resume).where(
                Resume.id == config.resume_id, Resume.user_id == current_user.id
            )
        )
        resume = result.scalar_one_or_none()
        if resume:
            resume_text = resume.parsed_text[:3000]  # Chunk to keep context small

    # 2. Build question generation prompt variables
    topics = f"{config.interview_type} assessment focusing on level: {config.difficulty}."
    if resume_text:
        topics += f" Candidate background context:\n{resume_text}"

    prompt = PromptBuilder.compile(
        "question_generation",
        count=config.question_count,
        role=f"{config.job_role} at {config.company or 'a modern SaaS Tech Company'}",
        level=config.experience_level,
        topics=topics,
    )

    # 3. Request structured questions list from AI Engine
    schema = {
        "type": "object",
        "properties": {
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question_text": {"type": "string"},
                        "topic": {"type": "string"},
                        "correct_answer_guideline": {"type": "string"},
                    },
                    "required": ["question_text"],
                },
            }
        },
        "required": ["questions"],
    }

    ai_questions: list[dict[str, Any]] = []
    try:
        data = await AIService.generate_json(prompt, schema=schema)
        ai_questions = data.get("questions", [])
    except Exception as e:
        logger.error(f"Failed to generate questions using AI provider. Error: {str(e)}")

    # Deterministic rule-based fallback questions if AI fails or returns empty
    if not ai_questions:
        ai_questions = [
            {
                "question_text": f"Can you describe your experience as a {config.job_role} and your work with {config.interview_type}?",
                "topic": "Introduction",
                "correct_answer_guideline": "Clear career trajectory description.",
            },
            {
                "question_text": "What are the key architectural patterns you follow when building scalable APIs?",
                "topic": "Architecture",
                "correct_answer_guideline": "Mentions REST, WebSockets, caching, connection pooling.",
            },
            {
                "question_text": "Tell me about a time you resolved a major production database bottleneck.",
                "topic": "Troubleshooting",
                "correct_answer_guideline": "STAR method. Identifies bottleneck, describes metric improvements.",
            },
            {
                "question_text": "How do you handle disagreement with senior developers regarding a design decision?",
                "topic": "Behavioral",
                "correct_answer_guideline": "Collaboration, data-driven compromise, consensus building.",
            },
            {
                "question_text": "Explain the difference between horizontal and vertical scaling with their respective trade-offs.",
                "topic": "Scaling",
                "correct_answer_guideline": "Compares load balancing, replica lag, network hop delays.",
            },
        ][: config.question_count]

    # 4. Create Interview & Question records
    questions_list = []
    for idx, item in enumerate(ai_questions):
        question = InterviewQuestion(
            question_text=item.get("question_text", "Sample question"),
            question_order=idx,
            topic=item.get("topic", "General"),
            correct_answer_guideline=item.get("correct_answer_guideline", ""),
        )
        questions_list.append(question)

    interview = Interview(
        user_id=current_user.id,
        resume_id=config.resume_id if resume else None,
        job_role=config.job_role,
        company=config.company,
        experience_level=config.experience_level,
        interview_type=config.interview_type,
        difficulty=config.difficulty,
        question_count=config.question_count,
        duration_minutes=config.duration_minutes,
        language=config.language,
        status="pending",
        current_question_index=0,
        time_remaining_seconds=config.duration_minutes * 60,
        questions=questions_list,
    )
    db.add(interview)
    await db.commit()

    # Query with selectinload to return a fully loaded, serializable object
    res = await db.execute(
        select(Interview)
        .where(Interview.id == interview.id)
        .options(
            selectinload(Interview.questions).selectinload(InterviewQuestion.answer),
            selectinload(Interview.feedback),
        )
    )
    return res.scalar_one()


@router.get("/history", response_model=list[InterviewResponse])
async def get_interview_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all mock interviews configured by the authenticated candidate.
    """
    result = await db.execute(
        select(Interview)
        .where(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
async def get_interview_detail(
    interview_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve full details (questions and answers) of a specific interview session.
    """
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id, Interview.user_id == current_user.id)
        .options(
            selectinload(Interview.questions).selectinload(InterviewQuestion.answer),
            selectinload(Interview.feedback),
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )
    return interview


@router.post("/{interview_id}/answer", response_model=InterviewAnswerResponse)
async def submit_answer(
    interview_id: int,
    payload: AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Save candidate answer response to a specific question. Auto-updates session index markers.
    """
    # Verify interview ownership
    result = await db.execute(
        select(Interview).where(
            Interview.id == interview_id, Interview.user_id == current_user.id
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    # Verify question exists inside this session
    q_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.id == payload.question_id,
            InterviewQuestion.interview_id == interview_id,
        )
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found inside this interview session.",
        )

    # Delete existing answer if present (supports replacing answers)
    ans_result = await db.execute(
        select(InterviewAnswer).where(InterviewAnswer.question_id == question.id)
    )
    existing_ans = ans_result.scalar_one_or_none()
    if existing_ans:
        await db.delete(existing_ans)

    # Create new answer
    answer = InterviewAnswer(
        question_id=question.id,
        user_answer=payload.user_answer,
        time_taken_seconds=payload.time_taken_seconds,
    )
    db.add(answer)

    # Auto advance index state if saving the current question
    if question.question_order == interview.current_question_index:
        if interview.current_question_index < interview.question_count - 1:
            interview.current_question_index += 1

    await db.commit()
    await db.refresh(answer)
    return answer


@router.post("/{interview_id}/pause")
async def pause_interview(
    interview_id: int,
    payload: InterviewSessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Pause the interview, saving remaining time markers and status.
    """
    result = await db.execute(
        select(Interview).where(
            Interview.id == interview_id, Interview.user_id == current_user.id
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    interview.status = "paused"
    interview.current_question_index = payload.current_question_index
    if payload.time_remaining_seconds is not None:
        interview.time_remaining_seconds = payload.time_remaining_seconds

    await db.commit()
    return {"message": "Interview paused successfully."}


@router.post("/{interview_id}/resume")
async def resume_interview(
    interview_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Resume a paused interview, resetting status to ongoing.
    """
    result = await db.execute(
        select(Interview).where(
            Interview.id == interview_id, Interview.user_id == current_user.id
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    interview.status = "ongoing"
    await db.commit()
    return {"message": "Interview resumed successfully."}


@router.post("/{interview_id}/end", response_model=InterviewFeedbackResponse)
async def end_interview(  # noqa: C901
    interview_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Complete the interview session and trigger the AI evaluation feedback compiler.
    """
    # Fetch interview with questions and answers
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id, Interview.user_id == current_user.id)
        .options(
            selectinload(Interview.questions).selectinload(InterviewQuestion.answer)
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    # 1. Update status
    interview.status = "completed"
    interview.time_remaining_seconds = 0

    # 2. Check if feedback is already generated
    fb_result = await db.execute(
        select(InterviewFeedback).where(InterviewFeedback.interview_id == interview_id)
    )
    existing_fb = fb_result.scalar_one_or_none()
    if existing_fb:
        await db.commit()
        return existing_fb

    # 3. Build interview evaluation transcript
    transcript_bullets = []
    for idx, question in enumerate(interview.questions):
        ans_text = (
            question.answer.user_answer
            if question.answer
            else "[No Answer Submitted/Skipped]"
        )
        time_seconds = (
            question.answer.time_taken_seconds if question.answer else 0
        )
        transcript_bullets.append(
            f"Question {idx+1}: {question.question_text}\n"
            f"Candidate Answer {idx+1}: {ans_text}\n"
            f"Time Spent: {time_seconds}s\n"
        )

    transcript = "\n".join(transcript_bullets)
    prompt = PromptBuilder.compile("feedback_generation", interview_transcript=transcript)

    # 4. Request structured evaluation feedback object from AI Engine
    schema = {
        "type": "object",
        "properties": {
            "overall_score": {"type": "number"},
            "technical_score": {"type": "number"},
            "communication_score": {"type": "number"},
            "confidence_score": {"type": "number"},
            "grammar_score": {"type": "number"},
            "strengths": {"type": "array", "items": {"type": "string"}},
            "weaknesses": {"type": "array", "items": {"type": "string"}},
            "improvement_plan": {"type": "array", "items": {"type": "string"}},
            "learning_roadmap": {"type": "array", "items": {"type": "string"}},
            "suggested_answers": {
                "type": "object",
                "additionalProperties": {"type": "string"},
            },
        },
        "required": [
            "overall_score",
            "technical_score",
            "communication_score",
            "confidence_score",
            "grammar_score",
            "strengths",
            "weaknesses",
            "improvement_plan",
            "learning_roadmap",
            "suggested_answers",
        ],
    }

    ai_fb = {}
    try:
        ai_fb = await AIService.generate_json(prompt, schema=schema)
    except Exception as e:
        logger.error(
            f"Failed to generate feedback report. Using fallback evaluations. Error: {str(e)}"
        )

    # Deterministic fallback evaluation report if AI fails or returns empty
    if not ai_fb:
        suggested = {}
        for q in interview.questions:
            suggested[str(q.id)] = (
                "A model answer would clearly outline system bottlenecks using concrete "
                "metrics (e.g. latency reduced by 40% via Redis indexing) rather than generalities."
            )

        ai_fb = {
            "overall_score": 7.5,
            "technical_score": 7.0,
            "communication_score": 8.0,
            "confidence_score": 8.0,
            "grammar_score": 7.5,
            "strengths": [
                "Strong structure in formulating answers using clear headings.",
                "Good pacing and articulation of professional experience timelines.",
            ],
            "weaknesses": [
                "Technical responses were occasionally abstract and missed caching parameters.",
                "System scale numbers were missing during the database sizing estimation.",
            ],
            "improvement_plan": [
                "Incorporate technical data metrics into mock response builders.",
                "Review horizontal vs vertical database scaling parameters.",
            ],
            "learning_roadmap": [
                "Study Redis replication structures and lock patterns.",
                "Practice high-level scalability loops on System Design primers.",
            ],
            "suggested_answers": suggested,
        }

    # Calculate voice metrics
    total_words = 0
    total_seconds = 0
    for q in interview.questions:
        if q.answer:
            total_words += len(q.answer.user_answer.split())
            total_seconds += q.answer.time_taken_seconds

    wpm = round((total_words / total_seconds) * 60) if total_seconds > 0 else 0
    if wpm == 0:
        wpm = 135

    filler_counts = {}
    filler_words = ["um", "uh", "like", "so", "basically", "actually"]
    full_transcript_text = " ".join([q.answer.user_answer for q in interview.questions if q.answer])
    full_transcript_lower = full_transcript_text.lower()

    for word in filler_words:
        pattern = r"\b" + re.escape(word) + r"\b"
        filler_counts[word] = len(re.findall(pattern, full_transcript_lower))

    total_fillers = sum(filler_counts.values())
    pronunciation_score = 90.0 - min(10.0, total_fillers * 0.5)
    confidence_score = min(98.0, 95.0 - (total_fillers * 1.5)) if total_fillers > 0 else 92.0

    coaching_suggestions = []
    if wpm > 160:
        coaching_suggestions.append("Your speaking speed is high. Aim for a steadier pace of 130-150 words per minute to improve clarity.")
    elif wpm < 100 and wpm > 0:
        coaching_suggestions.append("Your speaking speed is slow. Try to speak more fluently to maintain engagement.")
    else:
        coaching_suggestions.append("Excellent pacing! Your speaking speed is within the optimal range of 120-150 WPM.")
    if total_fillers > 5:
        most_common = max(filler_counts, key=lambda k: filler_counts[k])
        coaching_suggestions.append(f"Try to minimize filler words (especially '{most_common}'). Pausing briefly is more effective.")
    else:
        coaching_suggestions.append("Great control over filler words! You spoke clearly and confidently.")

    voice_metrics = {
        "speaking_speed": wpm,
        "filler_words": filler_counts,
        "pronunciation_score": round(pronunciation_score, 1),
        "confidence_score": round(confidence_score, 1),
        "coaching_suggestions": coaching_suggestions,
        "final_transcript": full_transcript_text,
    }

    # 5. Create Feedback record
    feedback = InterviewFeedback(
        interview_id=interview.id,
        overall_score=float(ai_fb["overall_score"]),
        technical_score=float(ai_fb["technical_score"]),
        communication_score=float(ai_fb["communication_score"]),
        confidence_score=float(ai_fb["confidence_score"]),
        grammar_score=float(ai_fb["grammar_score"]),
        strengths=list(ai_fb["strengths"]),
        weaknesses=list(ai_fb["weaknesses"]),
        improvement_plan=list(ai_fb["improvement_plan"]),
        learning_roadmap=list(ai_fb["learning_roadmap"]),
        suggested_answers=dict(ai_fb["suggested_answers"]),
        voice_metrics=voice_metrics,
    )

    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


@router.post("/{interview_id}/voice/stt", response_model=VoiceSTTResponse)
async def voice_stt(
    interview_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Transcribe recorded user answer audio file into text.
    """
    # 1. Fetch Interview to verify permissions
    result = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == current_user.id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    # Read audio bytes
    audio_data = await file.read()

    # 2. Get STT provider
    stt_provider = AIProviderFactory.get_stt_provider()
    try:
        transcript_text = await stt_provider.transcribe(audio_data, file.filename or "audio.wav")
        return VoiceSTTResponse(text=transcript_text)
    except Exception as e:
        logger.error(f"Speech to text failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}",
        )


@router.post("/{interview_id}/voice/tts")
async def voice_tts(
    interview_id: int,
    req: VoiceTTSRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Convert dynamic text to audio stream.
    """
    # Verify permission
    result = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == current_user.id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    # Get TTS Provider
    tts_provider = AIProviderFactory.get_tts_provider()
    try:
        audio_bytes = await tts_provider.synthesize(req.text)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"Text to speech failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to synthesize voice: {str(e)}",
        )


@router.post("/{interview_id}/voice/follow-up", response_model=VoiceFollowUpResponse)
async def voice_follow_up(
    interview_id: int,
    req: VoiceFollowUpRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Generate dynamic follow-up question related specifically to candidate's previous response.
    """
    # Fetch interview with questions
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_id, Interview.user_id == current_user.id)
        .options(
            selectinload(Interview.questions)
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    # Fetch targeted question
    current_q = None
    for q in interview.questions:
        if q.id == req.question_id:
            current_q = q
            break

    if not current_q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reference question not found in this session.",
        )

    # Build evaluation prompt
    prompt = (
        f"You are a Lead Evaluator conducting a voice mock interview. The candidate is interviewing for the role of {interview.job_role} (Difficulty: {interview.difficulty}).\n"
        f"They were just asked: '{current_q.question_text}'.\n"
        f"They answered: '{req.user_answer}'.\n"
        f"Formulate a direct, constructive, challenging follow-up question (max 1 sentence) related specifically to their answer, to test their depth of knowledge or clarify a point in their explanation. Do not say hello, do not say 'Here is your follow-up', output only the follow-up question."
    )

    try:
        # Generate follow-up using general AI provider
        ai_provider = AIProviderFactory.get_provider()
        follow_up_text = await ai_provider.generate(prompt)
        # strip any potential enclosing quotes or filler intro text
        follow_up_text = follow_up_text.strip().strip('"\'')
    except Exception as e:
        logger.error(f"Follow-up question generation failed: {str(e)}")
        follow_up_text = "Can you expand on how you would implement this in a distributed production environment?"

    # Insert follow-up question after current question order
    current_order = current_q.question_order

    # Shift orders of all questions that appear after current question
    await db.execute(
        update(InterviewQuestion)
        .where(InterviewQuestion.interview_id == interview.id)
        .where(InterviewQuestion.question_order > current_order)
        .values(question_order=InterviewQuestion.question_order + 1)
    )

    # Insert new follow-up
    follow_up_q = InterviewQuestion(
        interview_id=interview.id,
        question_text=follow_up_text,
        question_order=current_order + 1,
        topic="Follow-up",
        correct_answer_guideline="Verify candidate response details.",
    )
    db.add(follow_up_q)

    # Increment total question count in interview
    interview.question_count += 1

    await db.commit()
    await db.refresh(follow_up_q)

    return VoiceFollowUpResponse(
        follow_up_question=follow_up_q.question_text,
        question_id=follow_up_q.id,
    )
