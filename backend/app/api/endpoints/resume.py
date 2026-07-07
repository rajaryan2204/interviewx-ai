import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeDetailResponse, ResumeResponse
from app.services.ai import AIService
from app.services.pdf import PDFService

router = APIRouter()

# Define project-root uploads directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED
)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a resume PDF, parse text content, run analysis, and store metadata in DB.
    """
    from app.api.deps import check_usage_limit
    await check_usage_limit(db, current_user, "resumes")

    # 1. Validation
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File has no name.",
        )

    ext = Path(file.filename).suffix.lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF files are allowed.",
        )

    # 2. File saving
    file_bytes = await file.read()
    unique_filename = f"{uuid.uuid4()}{ext}"
    dest_path = UPLOAD_DIR / unique_filename

    try:
        with open(dest_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file to disk: {str(e)}",
        )

    # 3. PDF Parsing
    try:
        parsed_text = PDFService.extract_text_from_pdf(file_bytes)
    except Exception as e:
        # Delete file if parsing failed to clean up
        dest_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not extract text from PDF: {str(e)}",
        )

    if not parsed_text:
        dest_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded PDF contains no extractable text content.",
        )

    # 4. Analysis
    try:
        analysis_json = AIService.analyze_resume(parsed_text)
    except Exception as e:
        dest_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating resume analysis parameters: {str(e)}",
        )

    # 5. Database Save
    db_resume = Resume(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=str(dest_path),
        parsed_text=parsed_text,
        analysis=analysis_json,
    )
    db.add(db_resume)
    await db.commit()
    await db.refresh(db_resume)

    return db_resume


@router.get("/history", response_model=list[ResumeResponse])
async def get_resume_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all uploaded resume records and analyses for the current authenticated user.
    """
    stmt = (
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
    )
    result = await db.execute(stmt)
    resumes = result.scalars().all()
    return resumes


@router.get("/{resume_id}", response_model=ResumeDetailResponse)
async def get_resume_detail(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get full details including raw parsed text and dynamic analysis parameters.
    """
    stmt = select(Resume).where(
        Resume.id == resume_id, Resume.user_id == current_user.id
    )
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume record not found.",
        )

    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
async def delete_resume(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a resume from database registry and clean up the file on disk.
    """
    stmt = select(Resume).where(
        Resume.id == resume_id, Resume.user_id == current_user.id
    )
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume record not found.",
        )

    # Clean up physical file on disk
    file_path = Path(resume.file_path)
    try:
        file_path.unlink(missing_ok=True)
    except Exception:
        # Log error or continue to remove DB record
        pass

    await db.delete(resume)
    await db.commit()

    return {"message": "Resume deleted successfully."}
