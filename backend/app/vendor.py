from collections import defaultdict
from datetime import datetime
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile
from sqlmodel import Session, select

from .auth import (
    VENDOR_IDLE_MINUTES,
    bearer_token,
    get_current_store,
    get_session,
    new_expiration,
    revoke_other_sessions,
    revoke_token,
)
from .models import (
    ChangePasswordRequest,
    InventoryItem,
    InventoryItemCreate,
    InventoryItemPublic,
    InventoryItemUpdate,
    MonthlyDetail,
    Order,
    OrderItem,
    OrderLineRead,
    OrderRead,
    OrdersPage,
    RecentOrder,
    StoreProfile,
    StorePublic,
    StoreUpdate,
    TopPlant,
    VendorLogin,
    VendorLoginResponse,
    VendorSession,
    VendorStats,
    VendorTotals,
)
from .security import (
    MIN_PASSWORD_LENGTH,
    generate_session_token,
    hash_password,
    verify_password,
)
from .storage import ImageValidationError, delete_image, save_image

logger = structlog.get_logger()

router = APIRouter(prefix="/api/vendor", tags=["vendor"])

LOW_STOCK_THRESHOLD = 8
MONTHS_IN_SERIES = 6

# Re-exported so `app.dependency_overrides[app.vendor.get_session]` keeps
# pointing at the same function object the dependency actually resolves.
__all__ = ["router", "get_session", "get_current_store"]


@router.post("/login", response_model=VendorLoginResponse)
def login(payload: VendorLogin, session: Session = Depends(get_session)):
    store = session.exec(select(StoreProfile).where(StoreProfile.email == payload.email)).first()

    if (
        not store
        or not store.is_active
        or not store.password_hash
        or not verify_password(payload.password, store.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = generate_session_token()
    vendor_session = VendorSession(
        store_id=store.id,
        token=token,
        expires_at=new_expiration(datetime.utcnow(), VENDOR_IDLE_MINUTES),
    )
    session.add(vendor_session)
    session.commit()

    logger.info("vendor_logged_in", store_id=store.id)
    return VendorLoginResponse(token=token, vendor=StorePublic.from_orm(store))


@router.post("/logout", status_code=204)
def logout(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if revoke_token(session, VendorSession, bearer_token(authorization)):
        logger.info("vendor_logged_out")


@router.get("/me", response_model=StorePublic)
def get_me(store: StoreProfile = Depends(get_current_store)):
    return store


@router.patch("/me", response_model=StorePublic)
def update_me(
    payload: StoreUpdate,
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(store, field, value)
    store.updated_at = datetime.utcnow()
    session.add(store)
    session.commit()
    session.refresh(store)
    logger.info("vendor_profile_updated", store_id=store.id)
    return store


@router.get("/inventory", response_model=list[InventoryItemPublic])
def list_inventory(
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    items = session.exec(
        select(InventoryItem)
        .where(InventoryItem.store_id == store.id)
        .order_by(InventoryItem.created_at.asc())
    ).all()
    return items


@router.post("/inventory", response_model=InventoryItemPublic, status_code=201)
def create_inventory_item(
    payload: InventoryItemCreate,
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    item = InventoryItem(store_id=store.id, **payload.dict())
    session.add(item)
    session.commit()
    session.refresh(item)
    logger.info("vendor_inventory_added", store_id=store.id, item_id=item.id)
    return item


def get_owned_item(item_id: int, store: StoreProfile, session: Session) -> InventoryItem:
    item = session.get(InventoryItem, item_id)
    if not item or item.store_id != store.id:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


@router.patch("/inventory/{item_id}", response_model=InventoryItemPublic)
def update_inventory_item(
    item_id: int,
    payload: InventoryItemUpdate,
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    item = get_owned_item(item_id, store, session)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)
    logger.info("vendor_inventory_updated", store_id=store.id, item_id=item.id)
    return item


@router.delete("/inventory/{item_id}", status_code=204)
def delete_inventory_item(
    item_id: int,
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    item = get_owned_item(item_id, store, session)
    delete_image(item.image_url)
    session.delete(item)
    session.commit()
    logger.info("vendor_inventory_deleted", store_id=store.id, item_id=item_id)


@router.post("/inventory/{item_id}/image", response_model=InventoryItemPublic)
async def upload_inventory_image(
    item_id: int,
    file: UploadFile = File(...),
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    item = get_owned_item(item_id, store, session)
    data = await file.read()

    try:
        public_path = save_image(data)
    except ImageValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    delete_image(item.image_url)
    item.image_url = public_path
    item.updated_at = datetime.utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)

    logger.info("vendor_image_uploaded", store_id=store.id, item_id=item.id)
    return item


@router.delete("/inventory/{item_id}/image", response_model=InventoryItemPublic)
def remove_inventory_image(
    item_id: int,
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    item = get_owned_item(item_id, store, session)
    delete_image(item.image_url)
    item.image_url = None
    item.updated_at = datetime.utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)

    logger.info("vendor_image_removed", store_id=store.id, item_id=item.id)
    return item


ORDERS_PAGE_SIZE = 10


@router.get("/orders", response_model=OrdersPage)
def list_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=ORDERS_PAGE_SIZE, ge=1, le=50),
    month: Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    orders = session.exec(
        select(Order).where(Order.store_id == store.id).order_by(Order.created_at.desc())
    ).all()

    def month_key(moment: datetime) -> str:
        return f"{moment.year:04d}-{moment.month:02d}"

    months = sorted({month_key(order.created_at) for order in orders}, reverse=True)

    if month:
        orders = [order for order in orders if month_key(order.created_at) == month]

    total = len(orders)
    start = (page - 1) * page_size
    page_orders = orders[start : start + page_size]

    order_ids = [order.id for order in page_orders]
    lines_by_order: dict[int, list[OrderLineRead]] = {oid: [] for oid in order_ids}
    if order_ids:
        order_items = session.exec(select(OrderItem).where(OrderItem.order_id.in_(order_ids))).all()
        inventory_ids = {oi.inventory_item_id for oi in order_items}
        inventory_lookup = {}
        if inventory_ids:
            inventory_lookup = {
                item.id: item
                for item in session.exec(
                    select(InventoryItem).where(InventoryItem.id.in_(inventory_ids))
                ).all()
            }
        for order_item in order_items:
            inventory = inventory_lookup.get(order_item.inventory_item_id)
            lines_by_order[order_item.order_id].append(
                OrderLineRead(
                    plant_name=(
                        inventory.plant_name if inventory else f"#{order_item.inventory_item_id}"
                    ),
                    quantity=order_item.quantity,
                    unit_price=order_item.unit_price,
                )
            )

    return OrdersPage(
        total=total,
        page=page,
        page_size=page_size,
        months=months,
        orders=[
            OrderRead(
                id=order.id,
                customer_name=order.customer_name,
                total=order.total,
                created_at=order.created_at,
                items=lines_by_order.get(order.id, []),
            )
            for order in page_orders
        ],
    )


@router.post("/change-password", status_code=204)
def change_password(
    payload: ChangePasswordRequest,
    authorization: Optional[str] = Header(default=None),
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    if not store.password_hash or not verify_password(
        payload.current_password, store.password_hash
    ):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"New password must be at least {MIN_PASSWORD_LENGTH} characters",
        )

    store.password_hash = hash_password(payload.new_password)
    store.updated_at = datetime.utcnow()
    session.add(store)
    session.commit()

    # Revoke every other session for this store; keep the one making the change.
    revoke_other_sessions(
        session,
        VendorSession,
        VendorSession.store_id,
        store.id,
        bearer_token(authorization) or "",
    )
    logger.info("vendor_password_changed", store_id=store.id)


@router.get("/stats", response_model=VendorStats)
def get_stats(
    store: StoreProfile = Depends(get_current_store),
    session: Session = Depends(get_session),
):
    orders = session.exec(
        select(Order).where(Order.store_id == store.id).order_by(Order.created_at.asc())
    ).all()
    order_ids = [order.id for order in orders]

    order_items: list[OrderItem] = []
    if order_ids:
        order_items = session.exec(select(OrderItem).where(OrderItem.order_id.in_(order_ids))).all()

    inventory = session.exec(select(InventoryItem).where(InventoryItem.store_id == store.id)).all()
    inventory_by_id = {item.id: item for item in inventory}

    total_orders = len(orders)
    total_revenue = round(sum(order.total for order in orders), 2)
    avg_order = round(total_revenue / total_orders, 2) if total_orders else 0.0

    items_by_order: dict[int, list[OrderItem]] = defaultdict(list)
    for order_item in order_items:
        items_by_order[order_item.order_id].append(order_item)

    def month_key(moment: datetime) -> str:
        return f"{moment.year:04d}-{moment.month:02d}"

    monthly_orders: dict[str, list[Order]] = defaultdict(list)
    for order in orders:
        monthly_orders[month_key(order.created_at)].append(order)

    def top_plants_for(order_list: list[Order], limit: int = 3) -> list[TopPlant]:
        units: dict[str, int] = defaultdict(int)
        for order in order_list:
            for order_item in items_by_order.get(order.id, []):
                item = inventory_by_id.get(order_item.inventory_item_id)
                name = item.plant_name if item else f"#{order_item.inventory_item_id}"
                units[name] += order_item.quantity
        ranked = sorted(units.items(), key=lambda pair: pair[1], reverse=True)
        return [TopPlant(plant_name=name, units=count) for name, count in ranked[:limit]]

    recent_months = sorted(monthly_orders.keys())[-MONTHS_IN_SERIES:]
    monthly = [
        MonthlyDetail(
            month=key,
            revenue=round(sum(order.total for order in monthly_orders[key]), 2),
            orders=len(monthly_orders[key]),
            top_plants=top_plants_for(monthly_orders[key]),
        )
        for key in recent_months
    ]

    # Paused listings aren't for sale, so they neither count as active nor
    # deserve a low-stock alert.
    active_inventory = [item for item in inventory if item.is_active]
    low_stock = sorted(
        (item for item in active_inventory if item.stock < LOW_STOCK_THRESHOLD),
        key=lambda item: item.stock,
    )

    recent_orders = [
        RecentOrder(
            id=order.id,
            customer_name=order.customer_name,
            total=order.total,
            items=sum(oi.quantity for oi in items_by_order.get(order.id, [])),
            created_at=order.created_at,
        )
        for order in sorted(orders, key=lambda o: o.created_at, reverse=True)[:10]
    ]

    return VendorStats(
        totals=VendorTotals(
            orders=total_orders,
            revenue=total_revenue,
            avg_order=avg_order,
            active_listings=len(active_inventory),
        ),
        monthly=monthly,
        top_plants=top_plants_for(orders, limit=5),
        low_stock=low_stock,
        recent_orders=recent_orders,
    )
