import os
from contextlib import asynccontextmanager
from datetime import datetime

import structlog
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .db import engine, init_db
from .logging_config import configure_logging
from .models import (
    AdminCreate,
    AdminProfile,
    AdminRead,
    AdminViewUpdate,
    CartItem,
    CartItemCreate,
    CartItemRead,
    CustomerAccount,
    CustomerPublic,
    CustomerRegister,
    CustomerRegistrationResponse,
    CustomerResendRequest,
    CustomerVerificationRequest,
    Feedback,
    FeedbackCreate,
    FeedbackRead,
    FavoritePlant,
    FavoritePlantCreate,
    FavoritePlantRead,
    InventoryItem,
    InventoryItemCreate,
    InventoryItemPublic,
    PlantPreview,
    StoreCreate,
    StoreProfile,
    StorePublic,
    StoreUpdate,
)
from .security import (
    generate_verification_code,
    hash_password,
    hash_verification_code,
    verification_expiration_time,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    init_db()
    logger.info("app_started", database_url=os.getenv("DATABASE_URL", "sqlite"))
    yield
    logger.info("app_stopped")


def get_session():
    with Session(engine) as session:
        yield session


app = FastAPI(title="Plantera API", lifespan=lifespan)

frontend_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    logger.info("health_check")
    return {"status": "ok"}


@app.post("/api/feedback", response_model=FeedbackRead)
def create_feedback(payload: FeedbackCreate, session: Session = Depends(get_session)):
    feedback = Feedback(name=payload.name, message=payload.message)
    session.add(feedback)
    session.commit()
    session.refresh(feedback)
    logger.info("feedback_created", feedback_id=feedback.id)
    return feedback


@app.get("/api/feedback", response_model=list[FeedbackRead])
def list_feedback(session: Session = Depends(get_session)):
    results = session.exec(select(Feedback).order_by(Feedback.created_at.desc())).all()
    logger.info("feedback_listed", count=len(results))
    return results


def log_verification(email: str, code: str) -> None:
    logger.info("verification_code_issued", email=email, code=code)


def build_registration_response(customer: CustomerAccount, code: str | None = None):
    show_preview = os.getenv("SHOW_VERIFICATION_CODE_IN_RESPONSE", "true").lower() == "true"
    preview = code if show_preview else None
    return CustomerRegistrationResponse(
        customer=CustomerPublic.from_orm(customer),
        verification_required=not customer.is_verified,
        verification_preview=preview,
        message="We sent a verification code to your email. Enter it to activate your account.",
    )


@app.post("/api/customers/register", response_model=CustomerRegistrationResponse, status_code=201)
def register_customer(payload: CustomerRegister, session: Session = Depends(get_session)):
    existing = session.exec(
        select(CustomerAccount).where(CustomerAccount.email == payload.email)
    ).first()

    verification_code = generate_verification_code()
    code_hash = hash_verification_code(verification_code)
    expires_at = verification_expiration_time()

    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")

        existing.first_name = payload.first_name
        existing.last_name = payload.last_name
        existing.phone = payload.phone
        existing.password_hash = hash_password(payload.password)
        existing.verification_code_hash = code_hash
        existing.verification_expires_at = expires_at
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        log_verification(existing.email, verification_code)
        return build_registration_response(existing, verification_code)

    customer = CustomerAccount(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        verification_code_hash=code_hash,
        verification_expires_at=expires_at,
    )
    session.add(customer)
    session.commit()
    session.refresh(customer)

    log_verification(customer.email, verification_code)
    logger.info("customer_registered", customer_id=customer.id, verified=customer.is_verified)
    return build_registration_response(customer, verification_code)


@app.post("/api/customers/verify", response_model=CustomerPublic)
def verify_customer(payload: CustomerVerificationRequest, session: Session = Depends(get_session)):
    customer = session.exec(
        select(CustomerAccount).where(CustomerAccount.email == payload.email)
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer.is_verified:
        return CustomerPublic.from_orm(customer)

    if not customer.verification_code_hash or not customer.verification_expires_at:
        raise HTTPException(status_code=400, detail="No verification in progress")

    if datetime.utcnow() > customer.verification_expires_at:
        raise HTTPException(status_code=400, detail="Verification code expired")

    if hash_verification_code(payload.code) != customer.verification_code_hash:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    customer.is_verified = True
    customer.verification_code_hash = None
    customer.verification_expires_at = None
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    session.commit()
    session.refresh(customer)

    logger.info("customer_verified", customer_id=customer.id)
    return CustomerPublic.from_orm(customer)


@app.post("/api/customers/resend-code", response_model=CustomerRegistrationResponse)
def resend_verification(payload: CustomerResendRequest, session: Session = Depends(get_session)):
    customer = session.exec(
        select(CustomerAccount).where(CustomerAccount.email == payload.email)
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer.is_verified:
        raise HTTPException(status_code=400, detail="Account already verified")

    verification_code = generate_verification_code()
    customer.verification_code_hash = hash_verification_code(verification_code)
    customer.verification_expires_at = verification_expiration_time()
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    session.commit()
    session.refresh(customer)

    log_verification(customer.email, verification_code)
    logger.info("verification_code_resent", customer_id=customer.id)
    return build_registration_response(customer, verification_code)


@app.get("/api/customers", response_model=list[CustomerPublic])
def list_customers(session: Session = Depends(get_session)):
    customers = session.exec(select(CustomerAccount).order_by(CustomerAccount.created_at.desc())).all()
    logger.info("customers_listed", count=len(customers))
    return [CustomerPublic.from_orm(customer) for customer in customers]


def build_plant_preview(
    item: InventoryItem,
    store_lookup: dict[int, StoreProfile] | None = None,
    session: Session | None = None,
) -> PlantPreview:
    store_name: str | None = None
    if store_lookup and item.store_id in store_lookup:
        store_name = store_lookup[item.store_id].name
    elif session:
        store = session.get(StoreProfile, item.store_id)
        store_name = store.name if store else None

    return PlantPreview(
        id=item.id,
        store_id=item.store_id,
        store_name=store_name,
        title=item.plant_name,
        price=item.price,
        image_url=item.image_url,
    )


def build_cart_response(
    cart_item: CartItem,
    inventory_lookup: dict[int, InventoryItem],
    store_lookup: dict[int, StoreProfile],
) -> CartItemRead:
    inventory = inventory_lookup.get(cart_item.inventory_item_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    preview = build_plant_preview(inventory, store_lookup=store_lookup)
    return CartItemRead(
        id=cart_item.id,
        customer_id=cart_item.customer_id,
        quantity=cart_item.quantity,
        added_at=cart_item.added_at,
        plant=preview,
    )


def build_favorite_response(
    favorite: FavoritePlant,
    inventory_lookup: dict[int, InventoryItem],
    store_lookup: dict[int, StoreProfile],
) -> FavoritePlantRead:
    inventory = inventory_lookup.get(favorite.inventory_item_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    preview = build_plant_preview(inventory, store_lookup=store_lookup)
    return FavoritePlantRead(
        id=favorite.id,
        customer_id=favorite.customer_id,
        created_at=favorite.created_at,
        plant=preview,
    )


@app.post("/api/admins", response_model=AdminRead, status_code=201)
def create_admin(payload: AdminCreate, session: Session = Depends(get_session)):
    existing = session.exec(
        select(AdminProfile).where(AdminProfile.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists for that email")

    admin = AdminProfile(
        display_name=payload.display_name,
        email=payload.email,
        preferred_view=payload.preferred_view,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)

    logger.info("admin_created", admin_id=admin.id, preferred_view=admin.preferred_view)
    return admin


@app.get("/api/admins", response_model=list[AdminRead])
def list_admins(session: Session = Depends(get_session)):
    admins = session.exec(select(AdminProfile).order_by(AdminProfile.created_at.desc())).all()
    logger.info("admins_listed", count=len(admins))
    return admins


@app.patch("/api/admins/{admin_id}/view-mode", response_model=AdminRead)
def update_admin_view(admin_id: int, payload: AdminViewUpdate, session: Session = Depends(get_session)):
    admin = session.get(AdminProfile, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    admin.preferred_view = payload.preferred_view
    admin.updated_at = datetime.utcnow()
    session.add(admin)
    session.commit()
    session.refresh(admin)

    logger.info("admin_view_updated", admin_id=admin.id, preferred_view=admin.preferred_view)
    return admin


@app.post("/api/stores", response_model=StorePublic, status_code=201)
def create_store(payload: StoreCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(StoreProfile).where(StoreProfile.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Store already registered with that email")

    store = StoreProfile(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        bio=payload.bio,
        address=payload.address,
        banner_image=payload.banner_image,
        dashboard_message=payload.dashboard_message,
    )
    session.add(store)
    session.commit()
    session.refresh(store)

    logger.info("store_created", store_id=store.id)
    return store


@app.get("/api/stores", response_model=list[StorePublic])
def list_stores(session: Session = Depends(get_session)):
    stores = session.exec(select(StoreProfile).order_by(StoreProfile.created_at.desc())).all()
    logger.info("stores_listed", count=len(stores))
    return stores


@app.patch("/api/stores/{store_id}", response_model=StorePublic)
def update_store(store_id: int, payload: StoreUpdate, session: Session = Depends(get_session)):
    store = session.get(StoreProfile, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(store, field, value)
    store.updated_at = datetime.utcnow()
    session.add(store)
    session.commit()
    session.refresh(store)

    logger.info("store_updated", store_id=store.id)
    return store


@app.post("/api/stores/{store_id}/inventory", response_model=InventoryItemPublic, status_code=201)
def add_inventory_item(store_id: int, payload: InventoryItemCreate, session: Session = Depends(get_session)):
    store = session.get(StoreProfile, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    item = InventoryItem(store_id=store_id, **payload.dict())
    session.add(item)
    session.commit()
    session.refresh(item)

    logger.info("inventory_item_added", store_id=store.id, inventory_item_id=item.id)
    return item


@app.get("/api/stores/{store_id}/inventory", response_model=list[InventoryItemPublic])
def list_inventory(store_id: int, session: Session = Depends(get_session)):
    store = session.get(StoreProfile, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    items = (
        session.exec(
            select(InventoryItem)
            .where(InventoryItem.store_id == store_id)
            .order_by(InventoryItem.created_at.desc())
        ).all()
    )
    logger.info("inventory_listed", store_id=store_id, count=len(items))
    return items


@app.get("/api/plants", response_model=list[PlantPreview])
def list_plants(session: Session = Depends(get_session)):
    items = session.exec(select(InventoryItem).order_by(InventoryItem.created_at.desc())).all()
    store_ids = {item.store_id for item in items}
    store_lookup: dict[int, StoreProfile] = {}
    if store_ids:
        store_lookup = {
            store.id: store
            for store in session.exec(select(StoreProfile).where(StoreProfile.id.in_(store_ids))).all()
        }

    previews = [build_plant_preview(item, store_lookup=store_lookup) for item in items]
    logger.info("plants_listed", count=len(previews))
    return previews


@app.post("/api/customers/{customer_id}/cart", response_model=CartItemRead, status_code=201)
def add_to_cart(customer_id: int, payload: CartItemCreate, session: Session = Depends(get_session)):
    customer = session.get(CustomerAccount, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    inventory = session.get(InventoryItem, payload.inventory_item_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    cart_item = session.exec(
        select(CartItem)
        .where(CartItem.customer_id == customer_id)
        .where(CartItem.inventory_item_id == payload.inventory_item_id)
    ).first()

    if cart_item:
        cart_item.quantity += payload.quantity
        cart_item.added_at = datetime.utcnow()
    else:
        cart_item = CartItem(
            customer_id=customer_id,
            inventory_item_id=payload.inventory_item_id,
            quantity=payload.quantity,
        )

    session.add(cart_item)
    session.commit()
    session.refresh(cart_item)

    logger.info("cart_item_saved", customer_id=customer_id, cart_item_id=cart_item.id)

    inventory_lookup = {inventory.id: inventory}
    store_lookup = {}
    store = session.get(StoreProfile, inventory.store_id)
    if store:
        store_lookup[store.id] = store

    return build_cart_response(cart_item, inventory_lookup, store_lookup)


@app.get("/api/customers/{customer_id}/cart", response_model=list[CartItemRead])
def list_cart(customer_id: int, session: Session = Depends(get_session)):
    customer = session.get(CustomerAccount, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    cart_items = session.exec(
        select(CartItem).where(CartItem.customer_id == customer_id)
    ).all()
    inventory_ids = [item.inventory_item_id for item in cart_items]

    inventory_lookup: dict[int, InventoryItem] = {}
    store_lookup: dict[int, StoreProfile] = {}

    if inventory_ids:
        inventories = session.exec(
            select(InventoryItem).where(InventoryItem.id.in_(inventory_ids))
        ).all()
        inventory_lookup = {item.id: item for item in inventories}
        store_ids = {item.store_id for item in inventories}
        if store_ids:
            store_lookup = {
                store.id: store
                for store in session.exec(
                    select(StoreProfile).where(StoreProfile.id.in_(store_ids))
                ).all()
            }

    responses = [
        build_cart_response(item, inventory_lookup, store_lookup)
        for item in cart_items
        if item.inventory_item_id in inventory_lookup
    ]

    logger.info("cart_listed", customer_id=customer_id, count=len(responses))
    return responses


@app.post(
    "/api/customers/{customer_id}/favorites",
    response_model=FavoritePlantRead,
    status_code=201,
)
def add_favorite(customer_id: int, payload: FavoritePlantCreate, session: Session = Depends(get_session)):
    customer = session.get(CustomerAccount, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    inventory = session.get(InventoryItem, payload.inventory_item_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    favorite = session.exec(
        select(FavoritePlant)
        .where(FavoritePlant.customer_id == customer_id)
        .where(FavoritePlant.inventory_item_id == payload.inventory_item_id)
    ).first()

    if not favorite:
        favorite = FavoritePlant(
            customer_id=customer_id, inventory_item_id=payload.inventory_item_id
        )
        session.add(favorite)
        session.commit()
        session.refresh(favorite)

    inventory_lookup = {inventory.id: inventory}
    store_lookup: dict[int, StoreProfile] = {}
    store = session.get(StoreProfile, inventory.store_id)
    if store:
        store_lookup[store.id] = store

    logger.info("favorite_saved", customer_id=customer_id, favorite_id=favorite.id)
    return build_favorite_response(favorite, inventory_lookup, store_lookup)


@app.get("/api/customers/{customer_id}/favorites", response_model=list[FavoritePlantRead])
def list_favorites(customer_id: int, session: Session = Depends(get_session)):
    customer = session.get(CustomerAccount, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    favorites = session.exec(
        select(FavoritePlant).where(FavoritePlant.customer_id == customer_id)
    ).all()
    inventory_ids = [favorite.inventory_item_id for favorite in favorites]

    inventory_lookup: dict[int, InventoryItem] = {}
    store_lookup: dict[int, StoreProfile] = {}

    if inventory_ids:
        inventories = session.exec(
            select(InventoryItem).where(InventoryItem.id.in_(inventory_ids))
        ).all()
        inventory_lookup = {item.id: item for item in inventories}
        store_ids = {item.store_id for item in inventories}
        if store_ids:
            store_lookup = {
                store.id: store
                for store in session.exec(
                    select(StoreProfile).where(StoreProfile.id.in_(store_ids))
                ).all()
            }

    responses = [
        build_favorite_response(favorite, inventory_lookup, store_lookup)
        for favorite in favorites
        if favorite.inventory_item_id in inventory_lookup
    ]

    logger.info("favorites_listed", customer_id=customer_id, count=len(responses))
    return responses
