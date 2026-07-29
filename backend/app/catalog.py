"""Public storefront catalog — no authentication.

Serves the inventory that viveros manage in their portal to the customer-facing
shop. Returns the whole catalog in one response so the storefront can filter,
sort, and paginate instantly; swap to server-side paging once inventory grows
beyond a few hundred items.
"""

from collections import defaultdict
from datetime import datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from .db import engine
from .models import (
    CatalogDetail,
    CatalogFacets,
    CatalogItem,
    CatalogPricing,
    CatalogResponse,
    CatalogVivero,
    InventoryItem,
    StoreProfile,
)
from .pricing import resolve_pricing

logger = structlog.get_logger()

router = APIRouter(prefix="/api/catalog", tags=["catalog"])

RELATED_LIMIT = 4

# A cart that large is pathological; the cap keeps the query bounded.
MAX_PRICING_IDS = 50


def get_session():
    with Session(engine) as session:
        yield session


def build_catalog_item(item: InventoryItem, store: StoreProfile, now: datetime) -> CatalogItem:
    """The one place an InventoryItem becomes a shopper-facing listing.

    `now` is passed in rather than read here so every item in a response is
    priced at the same instant.
    """
    pricing = resolve_pricing(item, store, now)
    return CatalogItem(
        id=item.id,
        plant_name=item.plant_name,
        description=item.description,
        price=pricing.price,
        original_price=pricing.original_price,
        discount_percent=pricing.discount_percent,
        discount_source=pricing.source,
        stock=item.stock,
        image_url=item.image_url,
        tags=item.tags,
        genus=item.genus,
        category=item.category,
        is_featured=item.is_featured,
        created_at=item.created_at,
        store_id=store.id,
        store_name=store.name,
        store_location=store.address,
    )


def load_active_catalog(
    session: Session,
) -> tuple[list[InventoryItem], dict[int, StoreProfile]]:
    """Every inventory item belonging to an active vivero, plus its store."""
    stores = session.exec(
        select(StoreProfile).where(StoreProfile.is_active == True)  # noqa: E712
    ).all()
    store_lookup = {store.id: store for store in stores}
    if not store_lookup:
        return [], {}

    # Paused listings are hidden from customers entirely; sold-out ones are not.
    items = session.exec(
        select(InventoryItem)
        .where(InventoryItem.store_id.in_(store_lookup.keys()))
        .where(InventoryItem.is_active == True)  # noqa: E712
        .order_by(InventoryItem.created_at.desc())
    ).all()
    return items, store_lookup


@router.get("", response_model=CatalogResponse)
def list_catalog(session: Session = Depends(get_session)):
    items, store_lookup = load_active_catalog(session)
    now = datetime.utcnow()

    catalog_items = [build_catalog_item(item, store_lookup[item.store_id], now) for item in items]

    genera = sorted({item.genus for item in items if item.genus})
    categories = sorted({item.category for item in items if item.category})

    counts: dict[int, int] = defaultdict(int)
    for item in items:
        counts[item.store_id] += 1
    viveros = [
        CatalogVivero(
            id=store.id,
            name=store.name,
            location=store.address,
            item_count=counts[store.id],
        )
        for store in sorted(store_lookup.values(), key=lambda s: s.name)
        if counts[store.id] > 0
    ]

    logger.info("catalog_listed", count=len(catalog_items))
    return CatalogResponse(
        total=len(catalog_items),
        items=catalog_items,
        facets=CatalogFacets(genera=genera, categories=categories, viveros=viveros),
    )


@router.get("/pricing", response_model=list[CatalogPricing])
def get_pricing(
    ids: str = Query(..., description="Comma-separated inventory item ids"),
    session: Session = Depends(get_session),
):
    """Current price and stock for a set of listings, for re-pricing a cart.

    Declared before `/{item_id}` on purpose: FastAPI matches in definition
    order, so the reverse would parse "pricing" as an item id and 422.

    Ids that are missing from the response are gone — deleted, paused, or from
    a vivero that went inactive. One rule covers all three.
    """
    wanted = set()
    for chunk in ids.split(","):
        chunk = chunk.strip()
        if chunk.isdigit():
            wanted.add(int(chunk))
        if len(wanted) >= MAX_PRICING_IDS:
            break

    if not wanted:
        return []

    items, store_lookup = load_active_catalog(session)
    now = datetime.utcnow()

    priced = []
    for item in items:
        if item.id not in wanted:
            continue
        pricing = resolve_pricing(item, store_lookup[item.store_id], now)
        priced.append(
            CatalogPricing(
                id=item.id,
                price=pricing.price,
                original_price=pricing.original_price,
                discount_percent=pricing.discount_percent,
                stock=item.stock,
            )
        )
    return priced


@router.get("/{item_id}", response_model=CatalogDetail)
def get_catalog_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(InventoryItem, item_id)
    if not item or not item.is_active:
        raise HTTPException(status_code=404, detail="Item not found")

    store = session.get(StoreProfile, item.store_id)
    if not store or not store.is_active:
        raise HTTPException(status_code=404, detail="Item not found")

    all_items, store_lookup = load_active_catalog(session)

    def relevance(candidate: InventoryItem) -> int:
        """Same genus first, then same vivero, then anything else."""
        if candidate.genus and candidate.genus == item.genus:
            return 0
        if candidate.store_id == item.store_id:
            return 1
        return 2

    related = sorted(
        (
            candidate
            for candidate in all_items
            if candidate.id != item.id and candidate.category == item.category
        ),
        key=relevance,
    )[:RELATED_LIMIT]

    now = datetime.utcnow()
    return CatalogDetail(
        item=build_catalog_item(item, store, now),
        related=[
            build_catalog_item(candidate, store_lookup[candidate.store_id], now)
            for candidate in related
        ],
    )
