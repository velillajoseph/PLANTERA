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
    email: EmailStr = Field(sa_column=Column(String(255), unique=True, index=True))
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
    email: EmailStr = Field(sa_column=Column(String(255), unique=True, index=True))
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
    email: EmailStr = Field(sa_column=Column(String(255), unique=True, index=True))
    phone: Optional[str] = Field(default=None, max_length=30)
    bio: Optional[str] = Field(default=None, max_length=500)
    address: Optional[str] = Field(default=None, max_length=255)
    banner_image: Optional[str] = Field(default=None, max_length=255)
    dashboard_message: Optional[str] = Field(default=None, max_length=255)
    password_hash: Optional[str] = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
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
    genus: Optional[str] = Field(default=None, max_length=100, index=True)
    # "plant" | "pot" | "supply" — drives the storefront's Shop submenu.
    category: str = Field(default="plant", max_length=20, index=True)
    # Paused listings stay in the vendor's inventory but disappear from the shop.
    # Distinct from stock == 0, which remains visible as "sold out".
    is_active: bool = Field(default=True)
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
    genus: Optional[str] = None
    category: str = "plant"
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
    genus: Optional[str]
    category: str
    is_active: bool
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


class VendorSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="storeprofile.id")
    token: str = Field(sa_column=Column(String(128), unique=True, index=True))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime


class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="storeprofile.id", index=True)
    customer_name: str = Field(max_length=150)
    total: float = Field(ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OrderItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", index=True)
    inventory_item_id: int = Field(foreign_key="inventoryitem.id")
    quantity: int = Field(ge=1)
    unit_price: float = Field(ge=0)


class VendorLogin(SQLModel):
    email: EmailStr
    password: str


class VendorLoginResponse(SQLModel):
    token: str
    vendor: StorePublic


class InventoryItemUpdate(SQLModel):
    plant_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None
    tags: Optional[str] = None
    genus: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class VendorTotals(SQLModel):
    orders: int
    revenue: float
    avg_order: float
    active_listings: int


class MonthlyPoint(SQLModel):
    month: str  # "YYYY-MM"
    revenue: float
    orders: int


class TopPlant(SQLModel):
    plant_name: str
    units: int


class MonthlyDetail(SQLModel):
    month: str
    revenue: float
    orders: int
    top_plants: list[TopPlant]


class RecentOrder(SQLModel):
    id: int
    customer_name: str
    total: float
    items: int
    created_at: datetime


class VendorStats(SQLModel):
    totals: VendorTotals
    monthly: list[MonthlyDetail]
    top_plants: list[TopPlant]
    low_stock: list[InventoryItemPublic]
    recent_orders: list[RecentOrder]


class OrderLineRead(SQLModel):
    plant_name: str
    quantity: int
    unit_price: float


class OrderRead(SQLModel):
    id: int
    customer_name: str
    total: float
    created_at: datetime
    items: list[OrderLineRead]


class OrdersPage(SQLModel):
    total: int
    page: int
    page_size: int
    months: list[str]  # distinct "YYYY-MM" values, newest first
    orders: list[OrderRead]


class ChangePasswordRequest(SQLModel):
    current_password: str
    new_password: str


class CatalogItem(SQLModel):
    id: int
    plant_name: str
    description: Optional[str]
    price: float
    stock: int
    image_url: Optional[str]
    tags: Optional[str]
    genus: Optional[str]
    category: str
    is_featured: bool
    created_at: datetime
    store_id: int
    store_name: str
    store_location: Optional[str]


class CatalogVivero(SQLModel):
    id: int
    name: str
    location: Optional[str]
    item_count: int


class CatalogFacets(SQLModel):
    genera: list[str]
    categories: list[str]
    viveros: list[CatalogVivero]


class CatalogResponse(SQLModel):
    total: int
    items: list[CatalogItem]
    facets: CatalogFacets


class CatalogDetail(SQLModel):
    item: CatalogItem
    related: list[CatalogItem]
