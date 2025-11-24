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


class Customer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=120)
    email: EmailStr = Field(
        index=True, max_length=255, sa_column_kwargs={"unique": True}
    )
    company: Optional[str] = Field(default=None, max_length=150)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CustomerCreate(SQLModel):
    name: str
    email: EmailStr
    company: Optional[str] = None


class CustomerRead(SQLModel):
    id: int
    name: str
    email: EmailStr
    company: Optional[str]
    created_at: datetime
