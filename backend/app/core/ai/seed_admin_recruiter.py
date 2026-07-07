"""
Seed script: inserts recruiter, admin, mock company, default templates, and admin settings.

Run: python -m app.core.ai.seed_admin_recruiter
"""

import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.coding import (  # noqa: F401
    CodeExecution,
    CodeSubmission,
    CodingFeedback,
    CodingQuestion,
    CodingSession,
)
from app.models.interview import (  # noqa: F401
    Interview,
    InterviewAnswer,
    InterviewFeedback,
    InterviewQuestion,
)
from app.models.recruiter import AdminSettings, Company, InterviewTemplate, Recruiter
from app.models.resume import Resume  # noqa: F401
from app.models.user import User


async def seed_recruiter_admin() -> None:
    print("🚀 Seeding Recruiter & Admin Platform data...")
    async with AsyncSessionLocal() as db:
        # 1. Create Mock Company
        comp_res = await db.execute(select(Company).where(Company.name == "SaaSify Inc."))
        company = comp_res.scalar_one_or_none()
        if not company:
            company = Company(
                name="SaaSify Inc.",
                domain="saasify.io",
                logo_url="https://logo.clearbit.com/saasify.io",
                description="A modern B2B SaaS startup building next-gen developer tools.",
            )
            db.add(company)
            await db.flush()
            print(f"✅ Mock company created: {company.name}")
        else:
            print("⏭ Company SaaSify Inc. already exists.")

        # 2. Create/Update Recruiter User
        recruiter_email = "recruiter@saasify.io"
        rec_user_res = await db.execute(select(User).where(User.email == recruiter_email))
        rec_user = rec_user_res.scalar_one_or_none()
        if not rec_user:
            rec_user = User(
                email=recruiter_email,
                hashed_password=get_password_hash("RecruiterPass123!"),
                full_name="Sarah Jenkins",
                role="recruiter",
                is_active=True,
            )
            db.add(rec_user)
            await db.flush()
            print(f"✅ Recruiter user created: {recruiter_email}")
        else:
            rec_user.role = "recruiter"
            print(f"✅ Recruiter user role verified: {recruiter_email}")

        # Link Recruiter User to Company
        rec_profile_res = await db.execute(
            select(Recruiter).where(Recruiter.user_id == rec_user.id)
        )
        rec_profile = rec_profile_res.scalar_one_or_none()
        if not rec_profile:
            rec_profile = Recruiter(
                user_id=rec_user.id,
                company_id=company.id,
                title="Lead Technical Recruiter",
            )
            db.add(rec_profile)
            await db.flush()
            print("✅ Recruiter profile linked to SaaSify Inc.")

        # 3. Create/Update Admin User
        admin_email = "admin@interviewx.ai"
        admin_user_res = await db.execute(select(User).where(User.email == admin_email))
        admin_user = admin_user_res.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash("AdminPass123!"),
                full_name="System Admin",
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            await db.flush()
            print(f"✅ Admin user created: {admin_email}")
        else:
            admin_user.role = "admin"
            print(f"✅ Admin user role verified: {admin_email}")

        # 4. Create Company Templates
        templates = [
            {
                "title": "Senior Frontend Developer Evaluation",
                "job_role": "Senior Frontend Engineer",
                "experience_level": "Senior",
                "duration_minutes": 45,
                "question_count": 3,
                "questions": [
                    {"question": "Explain the difference between Server Actions and API routes in Next.js."},
                    {"question": "How do you optimize Core Web Vitals, specifically INP and LCP?"},
                    {"question": "Implement a custom React hook for debouncing input values."},
                ],
            },
            {
                "title": "Backend Architect System Design",
                "job_role": "Staff Software Engineer",
                "experience_level": "Staff / Principal",
                "duration_minutes": 60,
                "question_count": 2,
                "questions": [
                    {"question": "Design a globally distributed rate limiter with sliding window log algorithm."},
                    {"question": "How would you handle eventual consistency in a Microservices architecture using transactional outbox pattern?"},
                ],
            },
        ]

        for temp_data in templates:
            t_res = await db.execute(
                select(InterviewTemplate).where(
                    InterviewTemplate.title == temp_data["title"],
                    InterviewTemplate.company_id == company.id,
                )
            )
            if not t_res.scalar_one_or_none():
                template = InterviewTemplate(
                    company_id=company.id,
                    title=temp_data["title"],
                    job_role=temp_data["job_role"],
                    experience_level=temp_data["experience_level"],
                    duration_minutes=temp_data["duration_minutes"],
                    question_count=temp_data["question_count"],
                    questions=temp_data["questions"],
                )
                db.add(template)
                print(f"✅ Created template: {temp_data['title']}")

        # 5. Create default AdminSettings / Feature Flags
        settings = [
            {
                "key": "ai_providers_config",
                "value": {
                    "active_provider": "mock",
                    "temperature": 0.7,
                    "openai_fallback": True,
                },
                "description": "Global LLM engine routing and hyperparameter settings.",
            },
            {
                "key": "feature_flags",
                "value": {
                    "voice_continuous_mode": True,
                    "coding_sandbox_judge0": False,
                    "maintenance_mode": False,
                    "recruiter_self_signup": True,
                },
                "description": "Application wide feature flag toggles.",
            },
        ]

        for s_data in settings:
            s_res = await db.execute(
                select(AdminSettings).where(AdminSettings.key == s_data["key"])
            )
            if not s_res.scalar_one_or_none():
                setting = AdminSettings(
                    key=s_data["key"],
                    value=s_data["value"],
                    description=s_data["description"],
                )
                db.add(setting)
                print(f"✅ Initialized settings key: {s_data['key']}")

        await db.commit()
        print("\n🎉 Seeded all Phase 10 system database entries successfully.")


if __name__ == "__main__":
    asyncio.run(seed_recruiter_admin())
