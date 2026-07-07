from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """
    Base properties for a User schema.
    """

    email: EmailStr
    full_name: str | None = Field(None, max_length=255)


class UserRegisterRequest(UserBase):
    """
    Request schema for user registration.
    """

    password: str = Field(..., min_length=6, max_length=128)


class UserLoginRequest(BaseModel):
    """
    Request schema for user login.
    """

    email: EmailStr
    password: str
    remember_me: bool = False


class UserResponse(UserBase):
    """
    Response schema returning non-sensitive user profile details.
    """

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """
    Response schema returning access token and corresponding user profile details.
    """

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(..., min_length=6, max_length=128)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class OAuthLoginRequest(BaseModel):
    provider: str
    token: str
    email: EmailStr
    name: str | None = None
