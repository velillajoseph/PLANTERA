from datetime import datetime
from typing import Optional

from pydantic import EmailStr
from sqlmodel import Field, SQLModel


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    message: str = Field(max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FeedbackCreate(SQLModel):
    name: str
    message: str


class FeedbackRead(SQLModel):
    id: int
    name: str
    message: str
    created_at: datetime


class CustomerAccount(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(
        index=True,
        max_length=255,
        sa_column_kwargs={"unique": True},
    )
    phone: Optional[str] = Field(default=None, max_length=30)
    password_hash: str = Field(max_length=255)
    is_verified: bool = Field(default=False)
    verification_code_hash: Optional[str] = Field(default=None, max_length=128)
    verification_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CustomerRegister(SQLModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str


class CustomerPublic(SQLModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str]
    is_verified: bool
    created_at: datetime

    class Config:
        orm_mode = True


class CustomerRegistrationResponse(SQLModel):
    customer: CustomerPublic
    verification_required: bool = Field(default=True)
    verification_preview: Optional[str] = None
    message: str


class CustomerVerificationRequest(SQLModel):
    email: EmailStr
    code: str


class CustomerResendRequest(SQLModel):
    email: EmailStr
