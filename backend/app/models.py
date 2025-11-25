from datetime import datetime
from typing import Optional

from pydantic import EmailStr
from sqlalchemy import Column, String
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
    email: EmailStr = Field(
        sa_column=Column(String(255), unique=True, index=True)
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


class AdminProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    display_name: str = Field(max_length=120)
    email: EmailStr = Field(
        sa_column=Column(String(255), unique=True, index=True)
    )
    preferred_view: str = Field(default="admin", max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AdminCreate(SQLModel):
    display_name: str
    email: EmailStr
    preferred_view: str = "admin"


class AdminRead(SQLModel):
    id: int
    display_name: str
    email: EmailStr
    preferred_view: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class AdminViewUpdate(SQLModel):
    preferred_view: str


class StoreProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=150)
    email: EmailStr = Field(
        sa_column=Column(String(255), unique=True, index=True)
    )
    phone: Optional[str] = Field(default=None, max_length=30)
    bio: Optional[str] = Field(default=None, max_length=500)
    address: Optional[str] = Field(default=None, max_length=255)
    banner_image: Optional[str] = Field(default=None, max_length=255)
    dashboard_message: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StoreCreate(SQLModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    banner_image: Optional[str] = None
    dashboard_message: Optional[str] = None


class StoreUpdate(SQLModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    banner_image: Optional[str] = None
    dashboard_message: Optional[str] = None


class StorePublic(SQLModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    bio: Optional[str]
    address: Optional[str]
    banner_image: Optional[str]
    dashboard_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class InventoryItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="storeprofile.id")
    plant_name: str = Field(max_length=150)
    description: Optional[str] = Field(default=None, max_length=500)
    price: float = Field(gt=0)
    stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = Field(default=None, max_length=255)
    tags: Optional[str] = Field(default=None, max_length=255)
    is_featured: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class InventoryItemCreate(SQLModel):
    plant_name: str
    description: Optional[str] = None
    price: float
    stock: int = 0
    image_url: Optional[str] = None
    tags: Optional[str] = None
    is_featured: bool = False


class InventoryItemPublic(SQLModel):
    id: int
    store_id: int
    plant_name: str
    description: Optional[str]
    price: float
    stock: int
    image_url: Optional[str]
    tags: Optional[str]
    is_featured: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class PlantPreview(SQLModel):
    id: int
    store_id: int
    store_name: Optional[str]
    title: str
    price: float
    image_url: Optional[str]


class CartItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customeraccount.id")
    inventory_item_id: int = Field(foreign_key="inventoryitem.id")
    quantity: int = Field(default=1, ge=1)
    added_at: datetime = Field(default_factory=datetime.utcnow)


class CartItemCreate(SQLModel):
    inventory_item_id: int
    quantity: int = 1


class CartItemRead(SQLModel):
    id: int
    customer_id: int
    quantity: int
    added_at: datetime
    plant: PlantPreview


class FavoritePlant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customeraccount.id")
    inventory_item_id: int = Field(foreign_key="inventoryitem.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FavoritePlantCreate(SQLModel):
    inventory_item_id: int


class FavoritePlantRead(SQLModel):
    id: int
    customer_id: int
    created_at: datetime
    plant: PlantPreview
