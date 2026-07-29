"""Effective price for one listing — the single place a discount is applied.

`catalog.build_catalog_item` and `customer.build_plant_preview` are the only two
places an InventoryItem becomes something a shopper sees, and both call
`resolve_pricing`. Keeping the rule in one pure function is what stops the
storefront, the cart, and the sort order from disagreeing about a price.

Pure on purpose: no FastAPI, no Session, no import from anything that imports
this. That keeps it directly unit-testable and free of import cycles.
"""

from datetime import datetime
from typing import NamedTuple, Optional

from .models import InventoryItem, StoreProfile

MAX_DISCOUNT_PERCENT = 90

# Nothing may fall below a cent; a 90% discount on a $0.05 item would otherwise
# round to $0.00 and read as free.
MIN_PRICE_CENTS = 1


class Pricing(NamedTuple):
    price: float
    """What the shopper pays."""

    original_price: Optional[float]
    """The list price, or None when no discount is live — never 0."""

    discount_percent: Optional[int]
    """The percent actually applied, or None when no discount is live."""

    source: Optional[str]
    """"item" | "store" | None — which rule won."""


def window_open(
    starts_at: Optional[datetime],
    ends_at: Optional[datetime],
    now: datetime,
) -> bool:
    """Is a discount window open at `now`?

    A blank bound is open-ended, so a discount with neither runs until the
    vivero switches it off. Both edges are inclusive, matching
    `promotions.load_live_promotions`.
    """
    if starts_at is not None and now < starts_at:
        return False
    if ends_at is not None and now > ends_at:
        return False
    return True


def apply_percent(price: float, percent: int) -> float:
    """Take `percent` off `price`, half-up to the cent.

    Done in integer cents rather than with Decimal so the formula stays short
    enough to mirror exactly in `frontend/app/lib/pricing.ts` — the two are
    verified against a shared table of vectors in
    `backend/tests/test_pricing.py` and `frontend/__tests__/pricing.test.ts`.
    """
    cents = round(price * 100)
    discounted = (cents * (100 - percent) + 50) // 100
    return max(discounted, MIN_PRICE_CENTS) / 100


def resolve_pricing(
    item: InventoryItem,
    store: Optional[StoreProfile],
    now: datetime,
) -> Pricing:
    """Effective price for `item`, given its store, at `now`.

    An item discount beats a store-wide one and they never stack: a 20% item
    sale inside a 15% store sale is 20%, not 32%. Compounding would produce a
    number the vivero never authorised.

    Precedence is evaluated on *live* discounts only. An item discount that
    hasn't started yet (or has ended) falls through to the store discount —
    otherwise scheduling a future sale would quietly pull the item out of the
    store-wide one that is running today.

    `now` is a required argument rather than read from the clock here, so a
    single response prices every item at the same instant. Reading it per item
    would let two listings land on opposite sides of a window boundary.
    """
    if item.discount_percent and window_open(item.discount_starts_at, item.discount_ends_at, now):
        percent, source = item.discount_percent, "item"
    elif (
        store is not None
        and store.store_discount_percent
        and window_open(store.store_discount_starts_at, store.store_discount_ends_at, now)
    ):
        percent, source = store.store_discount_percent, "store"
    else:
        return Pricing(item.price, None, None, None)

    effective = apply_percent(item.price, percent)

    # A discount that rounds away to nothing is not worth advertising, and a
    # struck-through price identical to the sale price looks broken.
    if effective >= item.price:
        return Pricing(item.price, None, None, None)

    return Pricing(effective, item.price, percent, source)
