"""Pure unit tests for the discount rules. No TestClient, no database."""

from datetime import datetime, timedelta

import pytest

from app.models import InventoryItem, StoreProfile
from app.pricing import apply_percent, resolve_pricing, window_open

NOW = datetime(2026, 7, 29, 12, 0, 0)
HOUR = timedelta(hours=1)


def make_item(price=42.0, percent=0, starts=None, ends=None) -> InventoryItem:
    return InventoryItem(
        store_id=1,
        plant_name="Monstera",
        price=price,
        stock=5,
        discount_percent=percent,
        discount_starts_at=starts,
        discount_ends_at=ends,
    )


def make_store(percent=0, starts=None, ends=None) -> StoreProfile:
    return StoreProfile(
        name="Vivero Test",
        email="test@plantera.pr",
        store_discount_percent=percent,
        store_discount_starts_at=starts,
        store_discount_ends_at=ends,
    )


# --- rounding -------------------------------------------------------------------

# These vectors are duplicated verbatim in frontend/__tests__/pricing.test.ts.
# The two implementations must agree to the cent or the vendor's live preview
# and the shopper's price diverge — keep the numbers identical in both files.
ROUNDING_VECTORS = [
    (42.00, 15, 35.70),
    (19.99, 33, 13.39),
    (0.15, 50, 0.08),  # half-up: 7.5 cents rounds to 8, not 7
    (0.01, 90, 0.01),  # floored at a cent, never free
    (100.00, 0, 100.00),
    (25.00, 90, 2.50),
]


@pytest.mark.parametrize("price,percent,expected", ROUNDING_VECTORS)
def test_apply_percent_rounds_half_up_to_the_cent(price, percent, expected):
    assert apply_percent(price, percent) == expected


# --- windows --------------------------------------------------------------------


def test_blank_bounds_are_open_ended():
    assert window_open(None, None, NOW) is True


def test_window_edges_are_inclusive():
    assert window_open(NOW, None, NOW) is True
    assert window_open(None, NOW, NOW) is True


def test_window_is_closed_outside_its_bounds():
    assert window_open(NOW + HOUR, None, NOW) is False
    assert window_open(None, NOW - timedelta(seconds=1), NOW) is False


# --- precedence -----------------------------------------------------------------


def test_no_discount_returns_the_list_price_and_all_none():
    pricing = resolve_pricing(make_item(), make_store(), NOW)
    assert pricing == (42.0, None, None, None)


def test_zero_percent_is_not_a_discount_even_with_an_open_window():
    pricing = resolve_pricing(make_item(percent=0), make_store(), NOW)
    assert pricing.original_price is None
    assert pricing.discount_percent is None


def test_item_discount_applies():
    pricing = resolve_pricing(make_item(percent=15), make_store(), NOW)
    assert pricing == (35.70, 42.0, 15, "item")


def test_store_discount_applies_when_the_item_has_none():
    pricing = resolve_pricing(make_item(), make_store(percent=10), NOW)
    assert pricing == (37.80, 42.0, 10, "store")


def test_item_wins_over_store_and_never_stacks():
    # 10% item inside a 50% store sale is 10% off, not 55%.
    pricing = resolve_pricing(make_item(percent=10), make_store(percent=50), NOW)
    assert pricing.discount_percent == 10
    assert pricing.source == "item"
    assert pricing.price == 37.80


def test_a_future_item_discount_falls_through_to_the_live_store_discount():
    """Scheduling a sale for tomorrow must not drop the item out of today's."""
    item = make_item(percent=40, starts=NOW + HOUR)
    pricing = resolve_pricing(item, make_store(percent=10), NOW)
    assert pricing.source == "store"
    assert pricing.discount_percent == 10


def test_an_expired_item_discount_falls_through_to_the_store_discount():
    item = make_item(percent=40, ends=NOW - HOUR)
    pricing = resolve_pricing(item, make_store(percent=10), NOW)
    assert pricing.source == "store"


def test_an_expired_store_discount_leaves_the_list_price():
    store = make_store(percent=25, ends=NOW - HOUR)
    pricing = resolve_pricing(make_item(), store, NOW)
    assert pricing == (42.0, None, None, None)


def test_a_missing_store_does_not_crash_and_still_honours_the_item_discount():
    pricing = resolve_pricing(make_item(percent=15), None, NOW)
    assert pricing.price == 35.70
    assert pricing.source == "item"


def test_a_discount_that_rounds_away_is_not_advertised():
    """A struck price identical to the sale price reads as broken."""
    pricing = resolve_pricing(make_item(price=0.01, percent=1), make_store(), NOW)
    assert pricing == (0.01, None, None, None)
