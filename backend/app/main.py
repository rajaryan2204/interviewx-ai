from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import (
    admin,
    auth,
    coding,
    health,
    interview,
    monetization,
    productivity,
    recruiter,
    resume,
)
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Asynchronous lifespan context manager handling startup and shutdown operations.
    """
    print(f"Starting up {settings.PROJECT_NAME} application...")
    yield
    print(f"Shutting down {settings.PROJECT_NAME} application...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS or ["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include endpoint routers
# Health check endpoint mounted at standard api and root
app.include_router(health.router, tags=["system"])
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["system"])

# Auth routes mounted at /api/auth
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
# Also support v1 namespace just in case
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["authentication"],
)

# Resume routes mounted at /api/resume
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])

# Interview routes mounted at /api/interview
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])

# Coding interview routes mounted at /api/coding
app.include_router(coding.router, prefix="/api/coding", tags=["coding"])

# Recruiter Portal routes mounted at /api/recruiter
app.include_router(recruiter.router, prefix="/api/recruiter", tags=["recruiter"])

# Admin Panel routes mounted at /api/admin
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Productivity & Scheduling routes mounted at /api/productivity
app.include_router(
    productivity.router, prefix="/api/productivity", tags=["productivity"]
)

# Subscription & Billing routes mounted at /api/monetization
app.include_router(
    monetization.router, prefix="/api/monetization", tags=["monetization"]
)


@app.get("/")
async def root_index() -> dict[str, str]:
    """
    Base path returning project info.
    """
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "online",
    }
