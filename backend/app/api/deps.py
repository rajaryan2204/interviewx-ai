from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User

# Define the OAuth2 scheme pointing to our login route
reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2),
) -> User:
    """
    Dependency to fetch and validate the current authenticated user from JWT.
    Throws 401 Unauthorized if the token is invalid or expired.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Access token missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials. Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: Subject missing.",
        )

    try:
        user_id_int = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token.",
        )

    # Fetch user from DB
    result = await db.execute(select(User).where(User.id == user_id_int))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    return user


def require_roles(*allowed_roles: str) -> Any:
    """
    FastAPI security dependency checker that enforces Role-Based Access Control (RBAC).
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Insufficient permissions to access this resource.",
            )
        return current_user

    return role_checker


from datetime import UTC, datetime
from sqlalchemy.orm import joinedload
from sqlalchemy import func

async def check_usage_limit(
    db: AsyncSession,
    user: User,
    limit_type: str,  # "interviews", "resumes", "coding"
) -> None:
    """
    Enforces usage limit checks based on candidate subscription tier.
    Throws 402 Payment Required if limit is reached.
    """
    from app.models.monetization import Subscription, Plan
    
    # 1. Fetch active subscription
    stmt = (
        select(Subscription)
        .options(joinedload(Subscription.plan))
        .where(Subscription.user_id == user.id, Subscription.status == "active")
        .order_by(Subscription.id.desc())
    )
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    
    plan_name = "Free"
    if sub and sub.plan:
        plan_name = sub.plan.name

    # Count entries for the current calendar month
    start_of_month = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    
    if limit_type == "coding":
        # Coding Practice is strictly locked to top tiers ("Pro" and "Annual Pro")
        if plan_name not in ["Pro", "Annual Pro"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Coding Practice is a Premium feature. Please upgrade to Pro or Annual Pro to unlock unlimited coding challenges!"
            )
        return

    if limit_type == "interviews":
        # Free gets 1 interview, Basic/Pro/Annual Pro gets unlimited
        if plan_name == "Free":
            from app.models.interview import Interview
            cnt_stmt = select(func.count(Interview.id)).where(
                Interview.user_id == user.id,
                Interview.created_at >= start_of_month
            )
            cnt_res = await db.execute(cnt_stmt)
            count = cnt_res.scalar() or 0
            if count >= 1:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Monthly limit reached. Free users are limited to 1 mock interview per month. Upgrade to Basic or Pro for unlimited sessions!"
                )
        return
            
    elif limit_type == "resumes":
        # Free gets 1 resume upload, Basic gets 5 uploads, Pro/Annual Pro gets unlimited
        if plan_name == "Free":
            from app.models.resume import Resume
            cnt_stmt = select(func.count(Resume.id)).where(
                Resume.user_id == user.id,
                Resume.uploaded_at >= start_of_month
            )
            cnt_res = await db.execute(cnt_stmt)
            count = cnt_res.scalar() or 0
            if count >= 1:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Monthly limit reached. Free users are limited to 1 resume audit per month. Upgrade to Basic or Pro for more uploads!"
                )
        elif plan_name == "Basic":
            from app.models.resume import Resume
            cnt_stmt = select(func.count(Resume.id)).where(
                Resume.user_id == user.id,
                Resume.uploaded_at >= start_of_month
            )
            cnt_res = await db.execute(cnt_stmt)
            count = cnt_res.scalar() or 0
            if count >= 5:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Monthly limit reached. Basic plan is limited to 5 resume audits per month. Upgrade to Pro for unlimited uploads!"
                )
        return
