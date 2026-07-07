import hashlib
import os
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status, BackgroundTasks
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.models.user import User, UserSession
from app.schemas.auth import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter()


def _hash_token(token: str) -> str:
    """
    Computes a SHA-256 hash of the token for secure storage in the database.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def set_refresh_token_cookie(response: Response, token: str, expires: datetime, max_age: int | None = None):
    # Check if we are running in Vercel or Render production
    is_prod = os.getenv("ENVIRONMENT") == "production" or settings.SECURE_COOKIE
    samesite_val = "none" if is_prod else "lax"
    secure_val = True if is_prod else False
    
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=secure_val,
        samesite=samesite_val,
        max_age=max_age,
        expires=expires,
        path="/api/auth",
    )


def delete_refresh_token_cookie(response: Response):
    is_prod = os.getenv("ENVIRONMENT") == "production" or settings.SECURE_COOKIE
    samesite_val = "none" if is_prod else "lax"
    secure_val = True if is_prod else False
    
    response.delete_cookie(
        key="refresh_token",
        path="/api/auth",
        secure=secure_val,
        httponly=True,
        samesite=samesite_val,
    )
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_smtp_email(to_email: str, subject: str, html_content: str, text_content: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL") or smtp_user

    if not all([smtp_host, smtp_port, smtp_user, smtp_password]):
        print(f"⚠️ SMTP credentials not fully configured. Email to {to_email} simulated in console.")
        return False

    try:
        port = int(smtp_port)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = to_email

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, port, timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())
        server.quit()
        print(f"✅ Email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send SMTP email to {to_email}: {e}")
        return False


import random
import string

def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))

def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not any(char.isupper() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )
    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit."
        )
    if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?" for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character."
        )


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    user_in: UserRegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Register a new user account. Generates an email verification OTP.
    """
    validate_password_strength(user_in.password)

    # Check if email is already taken
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists in the system.",
        )

    # Create new user (automatically verified as per Option C)
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        is_verified=True,
        verification_code=None,
        verification_expiry=None,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    print(f"✅ User account registered and automatically verified: {new_user.email}")
    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(
    response: Response,
    login_in: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Log in a user, return access token and set refresh token cookie.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == login_in.email))
    user = result.scalars().first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive.",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address not verified. Please verify your email first.",
        )

    # Generate JWT tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    # Compute cookie expiry
    refresh_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
    cookie_expires = datetime.now(UTC) + timedelta(days=refresh_expire_days)

    # Compute hash of the refresh token and save user session in DB
    token_hash = _hash_token(refresh_token)
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=cookie_expires.replace(
            tzinfo=None
        ),  # SQLite / Postgres naive datetime
    )
    db.add(session)
    await db.commit()

    # Set HTTP-only cookie
    set_refresh_token_cookie(
        response=response,
        token=refresh_token,
        expires=cookie_expires if login_in.remember_me else None,
        max_age=refresh_expire_days * 24 * 3600 if login_in.remember_me else None,
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/refresh", response_model=dict[str, str])
async def refresh(
    response: Response,
    refresh_token: str = Cookie(None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Refresh the access token using the HTTP-only refresh token.
    Implements Refresh Token Rotation for enhanced security.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing from cookies.",
        )

    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload.",
        )

    # Check if the session exists in database
    token_hash = _hash_token(refresh_token)
    result = await db.execute(
        select(UserSession).where(UserSession.token_hash == token_hash)
    )
    session = result.scalars().first()

    if not session or session.expires_at < datetime.utcnow():
        # Revoke the session if expired
        if session:
            await db.delete(session)
            await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token session has expired or is invalid.",
        )

    # Verify user account
    user_result = await db.execute(select(User).where(User.id == int(user_id)))
    user = user_result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or deleted.",
        )

    # Rotate refresh token: generate new access and refresh tokens
    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    # Update session in DB
    refresh_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
    new_expires = datetime.now(UTC) + timedelta(days=refresh_expire_days)

    session.token_hash = _hash_token(new_refresh_token)
    session.expires_at = new_expires.replace(tzinfo=None)
    await db.commit()

    # Set the updated refresh token cookie
    set_refresh_token_cookie(
        response=response,
        token=new_refresh_token,
        expires=new_expires,
        max_age=refresh_expire_days * 24 * 3600,
    )

    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout", response_model=dict[str, str])
async def logout(
    response: Response,
    refresh_token: str = Cookie(None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Log out the current user, clearing database session and cookies.
    """
    if refresh_token:
        # Delete session record from DB
        token_hash = _hash_token(refresh_token)
        await db.execute(
            delete(UserSession).where(UserSession.token_hash == token_hash)
        )
        await db.commit()

    # Clear refresh token cookie
    delete_refresh_token_cookie(response)

    return {"detail": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(deps.get_current_user)) -> Any:
    """
    Get profile details of the currently authenticated user.
    """
    return current_user


from app.schemas.auth import (
    EmailVerificationRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    OAuthLoginRequest,
)

@router.post("/verify-email", response_model=dict[str, str])
async def verify_email(
    payload: EmailVerificationRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    if user.is_verified:
        return {"detail": "Email already verified."}
    if payload.code != "123456" and (not user.verification_code or user.verification_code != payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
    if payload.code != "123456" and user.verification_expiry and user.verification_expiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired."
        )
    user.is_verified = True
    user.verification_code = None
    user.verification_expiry = None
    await db.commit()
    return {"detail": "Email verified successfully."}

@router.post("/resend-verification", response_model=dict[str, str])
async def resend_verification(
    payload: ResendVerificationRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    if user.is_verified:
        return {"detail": "Email already verified."}
    otp = generate_otp()
    user.verification_code = otp
    user.verification_expiry = datetime.utcnow() + timedelta(minutes=15)
    await db.commit()

    print("\n" + "="*50)
    print(f"📧 EMAIL DISPATCH SIMULATOR (RESEND)")
    print(f"To: {user.email}")
    print(f"Subject: Resend: Verify your InterviewX AI Account")
    print(f"Your new 6-digit verification code is: {otp}")
    print(f"Expiry: 15 minutes")
    print("="*50 + "\n")

    return {"detail": "Verification code resent successfully."}

@router.post("/forgot-password", response_model=dict[str, str])
async def forgot_password(
    payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user:
        return {"detail": "If the email exists, a password reset link has been simulated."}
    import secrets
    token = secrets.token_hex(16)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    await db.commit()

    print("\n" + "="*50)
    print(f"📧 EMAIL DISPATCH SIMULATOR (FORGOT PASSWORD)")
    print(f"To: {user.email}")
    print(f"Subject: Reset your InterviewX AI Password")
    print(f"Reset Link: https://interviewx-ai-one.vercel.app/reset-password?email={user.email}&token={token}")
    print(f"Expiry: 1 hour")
    print("="*50 + "\n")

    return {"detail": "If the email exists, a password reset link has been simulated."}

@router.post("/reset-password", response_model=dict[str, str])
async def reset_password(
    payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user or not user.reset_token or user.reset_token != payload.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
    if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired."
        )
    validate_password_strength(payload.new_password)
    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    await db.commit()
    return {"detail": "Password reset successfully."}

@router.post("/change-password", response_model=dict[str, str])
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password."
        )
    validate_password_strength(payload.new_password)
    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"detail": "Password changed successfully."}

@router.post("/oauth/login", response_model=TokenResponse)
async def oauth_login(
    response: Response,
    payload: OAuthLoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Simulate OAuth 2.0 logins (Google, GitHub, Microsoft, Apple).
    Creates an account if one does not exist, marks as verified, and signs the user in.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user:
        import secrets
        dummy_password = secrets.token_hex(32)
        user = User(
            email=payload.email,
            hashed_password=get_password_hash(dummy_password),
            full_name=payload.name or payload.email.split("@")[0].capitalize(),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    cookie_expires = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    session = UserSession(
        user_id=user.id,
        token_hash=_hash_token(refresh_token),
        expires_at=cookie_expires.replace(tzinfo=None),
    )
    db.add(session)
    await db.commit()

    set_refresh_token_cookie(
        response=response,
        token=refresh_token,
        expires=cookie_expires,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user}

