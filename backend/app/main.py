import os
from contextlib import asynccontextmanager
from datetime import datetime

import structlog
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from .auth import SESSION_HEADER
from .catalog import router as catalog_router
from .customer import router as customer_router
from .db import engine, init_db
from .logging_config import configure_logging
from .models import (
    AdminCreate,
    AdminProfile,
    AdminRead,
    AdminViewUpdate,
    Feedback,
    FeedbackCreate,
    FeedbackRead,
    InventoryItem,
    InventoryItemCreate,
    InventoryItemPublic,
    StoreCreate,
    StoreProfile,
    StorePublic,
    StoreUpdate,
)
from .promotions import router as promotions_router
from .storage import UPLOAD_DIR, ensure_upload_dir
from .vendor import router as vendor_router

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    init_db()
    ensure_upload_dir()
    logger.info("app_started", database_url=os.getenv("DATABASE_URL", "sqlite"))
    yield
    logger.info("app_stopped")


def get_session():
    with Session(engine) as session:
        yield session


app = FastAPI(title="Plantera API", lifespan=lifespan)
app.include_router(vendor_router)
app.include_router(customer_router)
app.include_router(catalog_router)
app.include_router(promotions_router)

# Vendor-uploaded listing photos. Created here too because the mount is
# evaluated at import time, before the lifespan hook runs.
ensure_upload_dir()
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

frontend_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Without this the browser silently hides the header cross-origin and the
    # client's idle timer never learns the server's real session expiry.
    expose_headers=[SESSION_HEADER],
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


@app.post("/api/admins", response_model=AdminRead, status_code=201)
def create_admin(payload: AdminCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(AdminProfile).where(AdminProfile.email == payload.email)).first()
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
def update_admin_view(
    admin_id: int, payload: AdminViewUpdate, session: Session = Depends(get_session)
):
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
def add_inventory_item(
    store_id: int, payload: InventoryItemCreate, session: Session = Depends(get_session)
):
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

    items = session.exec(
        select(InventoryItem)
        .where(InventoryItem.store_id == store_id)
        .order_by(InventoryItem.created_at.desc())
    ).all()
    logger.info("inventory_listed", store_id=store_id, count=len(items))
    return items
