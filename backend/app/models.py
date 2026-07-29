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


class CustomerLogin(SQLModel):
    email: EmailStr
    password: str


class CustomerLoginResponse(SQLModel):
    token: str
    customer: CustomerPublic
    expires_at: datetime


class CustomerProfileUpdate(SQLModel):
    # email is deliberately absent: it is the login identity and the anchor the
    # verification code was sent to, so changing it needs its own re-verify flow.
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class SessionWindow(SQLModel):
    expires_at: datetime


class FavoriteIds(SQLModel):
    ids: list[int]


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
    # Percent off every listing in this store. Prefixed so a grep for
    # `store_discount_` is unambiguous against the per-item columns.
    store_discount_percent: int = Field(default=0, ge=0, le=90)
    store_discount_starts_at: Optional[datetime] = None
    store_discount_ends_at: Optional[datetime] = None
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
    store_discount_percent: int = Field(default=0, ge=0, le=90)
    store_discount_starts_at: Optional[datetime] = None
    store_discount_ends_at: Optional[datetime] = None


class StoreUpdate(SQLModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    banner_image: Optional[str] = None
    dashboard_message: Optional[str] = None
    store_discount_percent: Optional[int] = Field(default=None, ge=0, le=90)
    store_discount_starts_at: Optional[datetime] = None
    store_discount_ends_at: Optional[datetime] = None


class StorePublic(SQLModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    bio: Optional[str]
    address: Optional[str]
    banner_image: Optional[str]
    dashboard_message: Optional[str]
    store_discount_percent: int
    store_discount_starts_at: Optional[datetime]
    store_discount_ends_at: Optional[datetime]
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
    # Percent off this listing. 0 == none. Capped at 90 so a mistyped value
    # cannot zero out a price; the effective price is also floored at $0.01.
    discount_percent: int = Field(default=0, ge=0, le=90)
    # A blank bound is open-ended: the discount runs until the vivero turns it
    # off. Naive UTC, matching Promotion.starts_at / ends_at.
    discount_starts_at: Optional[datetime] = None
    discount_ends_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class InventoryItemCreate(SQLModel):
    plant_name: str
    description: Optional[str] = None
    # gt=0 mirrors the table; without it a zero-price item would list at the
    # $0.01 discount floor instead of being rejected.
    price: float = Field(gt=0)
    stock: int = 0
    image_url: Optional[str] = None
    tags: Optional[str] = None
    genus: Optional[str] = None
    category: str = "plant"
    is_featured: bool = False
    discount_percent: int = Field(default=0, ge=0, le=90)
    discount_starts_at: Optional[datetime] = None
    discount_ends_at: Optional[datetime] = None


class InventoryItemPublic(SQLModel):
    """The vendor's own view of a listing.

    `price` here is the **list** price the vivero set, never the discounted one
    — the portal edits list prices. The storefront's CatalogItem.price is the
    effective price. Same field name, two deliberate meanings.
    """

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
    discount_percent: int
    discount_starts_at: Optional[datetime]
    discount_ends_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class PlantPreview(SQLModel):
    """Shopper-facing summary. `price` is the effective price — see CatalogItem."""

    id: int
    store_id: int
    store_name: Optional[str]
    title: str
    price: float
    original_price: Optional[float] = None
    discount_percent: Optional[int] = None
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
    # Slides forward on activity; see auth.touch_session. There is no
    # last_seen_at column on purpose — create_all cannot add columns to an
    # existing table, and created_at + expires_at already encode the same thing.
    expires_at: datetime


class CustomerSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customeraccount.id", index=True)
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
    discount_percent: Optional[int] = Field(default=None, ge=0, le=90)
    # Sending an explicit null clears a bound; `exclude_unset` in the vendor
    # PATCH keeps "absent" and "null" distinct.
    discount_starts_at: Optional[datetime] = None
    discount_ends_at: Optional[datetime] = None


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
    """A listing as the shopper sees it.

    `price` is the **effective** price — what they pay, discount already
    applied. `original_price` and `discount_percent` are None unless a discount
    is live, so `original_price is not None` is the single "on sale" test; they
    are never 0. This is deliberately the opposite meaning to
    InventoryItemPublic.price, which is the vivero's list price.
    """

    id: int
    plant_name: str
    description: Optional[str]
    price: float
    original_price: Optional[float] = None
    discount_percent: Optional[int] = None
    # "item" | "store" — lets the storefront say why something is discounted.
    discount_source: Optional[str] = None
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


class CatalogPricing(SQLModel):
    """Just enough to re-price a cart line. An id missing from the response
    means the listing is gone — deleted, paused, or its vivero deactivated."""

    id: int
    price: float
    original_price: Optional[float] = None
    discount_percent: Optional[int] = None
    stock: int


class CustomerOrder(SQLModel):
    """Shape of a customer's own order history.

    Nothing populates this yet: `Order` records a `customer_name` string rather
    than a customer id, and there is no checkout. The endpoint returns an empty
    list so the UI contract is settled before the data exists.
    """

    id: int
    store_name: str
    total: float
    created_at: datetime
    items: list[OrderLineRead]


class Promotion(SQLModel, table=True):
    """A paid or promotional slot on the storefront, owned by one vivero.

    Bilingual columns rather than a JSON blob: the storefront's `Localized`
    convention is `{es, en}` on every field, and SQLite JSON columns can't be
    filtered or ordered usefully here.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="storeprofile.id", index=True)
    headline_es: str = Field(max_length=120)
    headline_en: str = Field(max_length=120)
    body_es: Optional[str] = Field(default=None, max_length=280)
    body_en: Optional[str] = Field(default=None, max_length=280)
    cta_label_es: str = Field(default="Ver colección", max_length=60)
    cta_label_en: str = Field(default="Shop the collection", max_length=60)
    cta_href: str = Field(default="/shop", max_length=255)
    image_url: Optional[str] = Field(default=None, max_length=255)
    starts_at: datetime = Field(default_factory=datetime.utcnow)
    ends_at: datetime
    # The lever a paid tier turns. Higher wins; see promotions.rank_promotions.
    priority: int = Field(default=0, index=True)
    is_active: bool = Field(default=True)
    impressions: int = Field(default=0, ge=0)
    clicks: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PromotionPublic(SQLModel):
    id: int
    store_id: int
    store_name: str
    headline_es: str
    headline_en: str
    body_es: Optional[str]
    body_en: Optional[str]
    cta_label_es: str
    cta_label_en: str
    cta_href: str
    image_url: Optional[str]


class PromotionEvent(SQLModel):
    type: str  # "impression" | "click"
