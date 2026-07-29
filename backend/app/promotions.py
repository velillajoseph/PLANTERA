"""Storefront promotion slots.

The whole point of this module is `rank_promotions`. Today it orders by an
editorial priority; once viveros pay for placement, that one function is the
only thing that changes — the model, the endpoints, and the carousel all stay.
"""

from collections import defaultdict
from datetime import datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from .auth import get_session
from .models import Promotion, PromotionEvent, PromotionPublic, StoreProfile

logger = structlog.get_logger()

router = APIRouter(prefix="/api/promotions", tags=["promotions"])

MAX_SLOTS = 5


def rank_promotions(promos: list[Promotion], now: datetime) -> list[Promotion]:
    """Ordering strategy for the homepage carousel.

    Today: highest `priority` first, and *within* a priority tier a rotation
    offset by the hour so equally-ranked viveros take turns at the front rather
    than the lowest id winning permanently. Rotating the whole list instead
    would let a tier-30 promotion fall behind a tier-10 one, which is exactly
    what a vivero would be paying not to happen. Swap this body when paid tiers
    land — nothing else changes.
    """
    if not promos:
        return []

    tiers: dict[int, list[Promotion]] = defaultdict(list)
    for promo in promos:
        tiers[promo.priority].append(promo)

    ranked: list[Promotion] = []
    for priority in sorted(tiers, reverse=True):
        group = sorted(tiers[priority], key=lambda promo: promo.id)
        offset = now.hour % len(group)
        ranked.extend(group[offset:] + group[:offset])
    return ranked


def load_live_promotions(session: Session, now: datetime) -> list[Promotion]:
    return session.exec(
        select(Promotion)
        .where(Promotion.is_active == True)  # noqa: E712
        .where(Promotion.starts_at <= now)
        .where(Promotion.ends_at >= now)
    ).all()


@router.get("", response_model=list[PromotionPublic])
def list_promotions(session: Session = Depends(get_session)):
    now = datetime.utcnow()
    promos = load_live_promotions(session, now)
    if not promos:
        return []

    store_ids = {promo.store_id for promo in promos}
    stores = session.exec(select(StoreProfile).where(StoreProfile.id.in_(store_ids))).all()
    store_lookup = {store.id: store for store in stores if store.is_active}

    ranked = rank_promotions([p for p in promos if p.store_id in store_lookup], now)

    return [
        PromotionPublic(
            id=promo.id,
            store_id=promo.store_id,
            store_name=store_lookup[promo.store_id].name,
            headline_es=promo.headline_es,
            headline_en=promo.headline_en,
            body_es=promo.body_es,
            body_en=promo.body_en,
            cta_label_es=promo.cta_label_es,
            cta_label_en=promo.cta_label_en,
            cta_href=promo.cta_href,
            image_url=promo.image_url,
        )
        for promo in ranked[:MAX_SLOTS]
    ]


@router.post("/{promotion_id}/event", status_code=204)
def record_event(
    promotion_id: int,
    payload: PromotionEvent,
    session: Session = Depends(get_session),
):
    """Aggregate counters only — no per-visitor tracking, no cookies, no ids."""
    if payload.type not in ("impression", "click"):
        raise HTTPException(status_code=400, detail="Unknown event type")

    promo = session.get(Promotion, promotion_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")

    if payload.type == "impression":
        promo.impressions += 1
    else:
        promo.clicks += 1

    session.add(promo)
    session.commit()
