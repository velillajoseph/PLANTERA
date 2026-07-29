"""Session storage and the authenticated-request dependencies.

Vendors and customers use the same machinery with different idle windows.
Sessions slide: every authenticated request pushes the expiry forward, so a
session dies from *inactivity* rather than from a fixed clock started at login.
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Type, Union

from fastapi import Depends, Header, HTTPException, Response
from sqlmodel import Session, select

from .db import engine
from .models import CustomerAccount, CustomerSession, StoreProfile, VendorSession

VENDOR_IDLE_MINUTES = int(os.getenv("VENDOR_IDLE_MINUTES", "20"))
CUSTOMER_IDLE_MINUTES = int(os.getenv("CUSTOMER_IDLE_MINUTES", "60"))

# The browser runs its own idle timer and logs out first. This margin stops the
# server from 401-ing someone who is mid-click on "stay signed in".
IDLE_GRACE_SECONDS = 120

# A hard ceiling regardless of how active the session is, so a permanently open
# tab can't hold a token forever.
ABSOLUTE_TTL_DAYS = 7

# Sliding the window on literally every request means an UPDATE + COMMIT per
# request, and every SQLite write takes a database-wide lock. Only write once
# the expiry has drifted by this much.
TOUCH_INTERVAL_SECONDS = 60

SESSION_HEADER = "X-Session-Expires-At"

SessionRow = Union[VendorSession, CustomerSession]


def get_session():
    with Session(engine) as session:
        yield session


def bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization.removeprefix("Bearer ").strip() or None


def idle_window(idle_minutes: int) -> timedelta:
    return timedelta(minutes=idle_minutes, seconds=IDLE_GRACE_SECONDS)


def new_expiration(now: datetime, idle_minutes: int) -> datetime:
    return now + idle_window(idle_minutes)


def slide_expiration(row: SessionRow, idle_minutes: int, now: datetime) -> datetime:
    """Where the expiry should sit after activity at `now`, capped absolutely."""
    ceiling = row.created_at + timedelta(days=ABSOLUTE_TTL_DAYS)
    return min(now + idle_window(idle_minutes), ceiling)


def touch_session(
    session: Session,
    row: SessionRow,
    idle_minutes: int,
    now: datetime,
    force: bool = False,
) -> bool:
    """Push the idle window forward. Returns True when a write happened.

    Comparing the target against the *stored* expiry is what lets this work
    without a `last_seen_at` column — adding one would mean altering an existing
    table, which `create_all` cannot do.
    """
    target = slide_expiration(row, idle_minutes, now)
    if not force and (target - row.expires_at) < timedelta(seconds=TOUCH_INTERVAL_SECONDS):
        return False
    row.expires_at = target
    session.add(row)
    session.commit()
    return True


def revoke_token(session: Session, model: Type[SessionRow], token: Optional[str]) -> bool:
    if not token:
        return False
    row = session.exec(select(model).where(model.token == token)).first()
    if not row:
        return False
    session.delete(row)
    session.commit()
    return True


def revoke_other_sessions(
    session: Session,
    model: Type[SessionRow],
    owner_field,
    owner_id: int,
    keep_token: str,
) -> int:
    rows = session.exec(select(model).where(owner_field == owner_id)).all()
    removed = 0
    for row in rows:
        if row.token != keep_token:
            session.delete(row)
            removed += 1
    session.commit()
    return removed


def _resolve(
    session: Session,
    model: Type[SessionRow],
    token: Optional[str],
    idle_minutes: int,
    response: Response,
) -> SessionRow:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    row = session.exec(select(model).where(model.token == token)).first()
    now = datetime.utcnow()
    if not row or row.expires_at < now:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    touch_session(session, row, idle_minutes, now)
    # Lets the browser re-sync its idle clock — important after a laptop sleep,
    # where the client's own timer has no idea how much wall time passed.
    response.headers[SESSION_HEADER] = row.expires_at.isoformat() + "Z"
    return row


def get_current_store(
    response: Response,
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> StoreProfile:
    row = _resolve(
        session, VendorSession, bearer_token(authorization), VENDOR_IDLE_MINUTES, response
    )
    store = session.get(StoreProfile, row.store_id)
    if not store or not store.is_active:
        raise HTTPException(status_code=401, detail="Vendor account inactive")
    return store


def get_current_customer(
    response: Response,
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> CustomerAccount:
    row = _resolve(
        session, CustomerSession, bearer_token(authorization), CUSTOMER_IDLE_MINUTES, response
    )
    customer = session.get(CustomerAccount, row.customer_id)
    if not customer or not customer.is_verified:
        raise HTTPException(status_code=401, detail="Customer account inactive")
    return customer
