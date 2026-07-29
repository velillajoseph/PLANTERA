"""Customer accounts: registration, verification, login, profile, favorites.

Mirrors the vendor router deliberately — same session model, same password
scheme, same revoke-on-password-change semantics — so there is one auth story
to reason about rather than two.

Every favorites handler scopes on the customer resolved from the bearer token,
never on a path parameter. The previous `/api/customers/{customer_id}/favorites`
routes let any caller read or mutate anyone's data.
"""

import os
from datetime import datetime
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select

from .auth import (
    CUSTOMER_IDLE_MINUTES,
    bearer_token,
    get_current_customer,
    get_session,
    new_expiration,
    revoke_other_sessions,
    revoke_token,
    touch_session,
)
from .models import (
    ChangePasswordRequest,
    CustomerAccount,
    CustomerLogin,
    CustomerLoginResponse,
    CustomerOrder,
    CustomerProfileUpdate,
    CustomerPublic,
    CustomerRegister,
    CustomerRegistrationResponse,
    CustomerResendRequest,
    CustomerSession,
    CustomerVerificationRequest,
    FavoriteIds,
    FavoritePlant,
    FavoritePlantCreate,
    FavoritePlantRead,
    InventoryItem,
    PlantPreview,
    SessionWindow,
    StoreProfile,
)
from .pricing import resolve_pricing
from .security import (
    MIN_PASSWORD_LENGTH,
    generate_session_token,
    generate_verification_code,
    hash_password,
    hash_verification_code,
    verification_expiration_time,
    verify_password,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/api/customers", tags=["customer"])


def log_verification(email: str, code: str) -> None:
    logger.info("verification_code_issued", email=email, code=code)


def build_registration_response(customer: CustomerAccount, code: Optional[str] = None):
    # SECURITY: this returns the verification code to whoever called the API,
    # which defeats the point of verifying. It stays on by default only because
    # no email delivery exists yet — turning it off today would make signup a
    # dead end with no way to receive the code. Set
    # SHOW_VERIFICATION_CODE_IN_RESPONSE=false the moment email sending lands.
    show_preview = os.getenv("SHOW_VERIFICATION_CODE_IN_RESPONSE", "true").lower() == "true"
    preview = code if show_preview else None
    return CustomerRegistrationResponse(
        customer=CustomerPublic.from_orm(customer),
        verification_required=not customer.is_verified,
        verification_preview=preview,
        message="We sent a verification code to your email. Enter it to activate your account.",
    )


def build_plant_preview(
    item: InventoryItem,
    store_lookup: Optional[dict[int, StoreProfile]] = None,
    session: Optional[Session] = None,
    now: Optional[datetime] = None,
) -> PlantPreview:
    """Shopper-facing summary of a listing, priced like the storefront.

    Holds the whole StoreProfile rather than just its name so `resolve_pricing`
    can see a store-wide discount — otherwise the same item would show one
    price on /shop and another under favorites.

    A store that cannot be resolved yields no store discount. That is the
    existing tolerant behaviour (store_name was already Optional) and it fails
    towards the list price rather than towards an error.
    """
    store: Optional[StoreProfile] = None
    if store_lookup and item.store_id in store_lookup:
        store = store_lookup[item.store_id]
    elif session:
        store = session.get(StoreProfile, item.store_id)

    pricing = resolve_pricing(item, store, now or datetime.utcnow())

    return PlantPreview(
        id=item.id,
        store_id=item.store_id,
        store_name=store.name if store else None,
        title=item.plant_name,
        price=pricing.price,
        original_price=pricing.original_price,
        discount_percent=pricing.discount_percent,
        image_url=item.image_url,
    )


# --- registration & verification ------------------------------------------------


@router.post("/register", response_model=CustomerRegistrationResponse, status_code=201)
def register_customer(payload: CustomerRegister, session: Session = Depends(get_session)):
    if len(payload.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        )

    existing = session.exec(
        select(CustomerAccount).where(CustomerAccount.email == payload.email)
    ).first()

    verification_code = generate_verification_code()
    code_hash = hash_verification_code(verification_code)
    expires_at = verification_expiration_time()

    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")

        # An unverified row is a half-finished signup, not an account — let the
        # person start over rather than locking the address forever.
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
    logger.info("customer_registered", customer_id=customer.id)
    return build_registration_response(customer, verification_code)


@router.post("/verify", response_model=CustomerPublic)
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


@router.post("/resend-code", response_model=CustomerRegistrationResponse)
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


# --- session --------------------------------------------------------------------


@router.post("/login", response_model=CustomerLoginResponse)
def login(payload: CustomerLogin, session: Session = Depends(get_session)):
    customer = session.exec(
        select(CustomerAccount).where(CustomerAccount.email == payload.email)
    ).first()

    if not customer or not verify_password(payload.password, customer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # A distinct status so the sign-in modal can jump straight to the code pane
    # instead of showing "wrong password" for a correct one.
    if not customer.is_verified:
        raise HTTPException(status_code=403, detail="email_not_verified")

    token = generate_session_token()
    expires_at = new_expiration(datetime.utcnow(), CUSTOMER_IDLE_MINUTES)
    session.add(CustomerSession(customer_id=customer.id, token=token, expires_at=expires_at))
    session.commit()

    logger.info("customer_logged_in", customer_id=customer.id)
    return CustomerLoginResponse(
        token=token,
        customer=CustomerPublic.from_orm(customer),
        expires_at=expires_at,
    )


@router.post("/logout", status_code=204)
def logout(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if revoke_token(session, CustomerSession, bearer_token(authorization)):
        logger.info("customer_logged_out")


@router.post("/session/touch", response_model=SessionWindow)
def touch(
    authorization: Optional[str] = Header(default=None),
    customer: CustomerAccount = Depends(get_current_customer),
    session: Session = Depends(get_session),
):
    """Explicit keep-alive behind the "stay signed in" button.

    The dependency already slid the window, but only if it had drifted past the
    write threshold. force=True guarantees the user sees a full fresh window.
    """
    row = session.exec(
        select(CustomerSession).where(CustomerSession.token == bearer_token(authorization))
    ).first()
    if not row:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    touch_session(session, row, CUSTOMER_IDLE_MINUTES, datetime.utcnow(), force=True)
    return SessionWindow(expires_at=row.expires_at)


# --- profile --------------------------------------------------------------------


@router.get("/me", response_model=CustomerPublic)
def get_me(customer: CustomerAccount = Depends(get_current_customer)):
    return customer


@router.patch("/me", response_model=CustomerPublic)
def update_me(
    payload: CustomerProfileUpdate,
    customer: CustomerAccount = Depends(get_current_customer),
    session: Session = Depends(get_session),
):
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(customer, field, value)
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    session.commit()
    session.refresh(customer)
    logger.info("customer_profile_updated", customer_id=customer.id)
    return customer


@router.post("/change-password", status_code=204)
def change_password(
    payload: ChangePasswordRequest,
    authorization: Optional[str] = Header(default=None),
    customer: CustomerAccount = Depends(get_current_customer),
    session: Session = Depends(get_session),
):
    if not verify_password(payload.current_password, customer.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"New password must be at least {MIN_PASSWORD_LENGTH} characters",
        )

    customer.password_hash = hash_password(payload.new_password)
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    session.commit()

    revoke_other_sessions(
        session,
        CustomerSession,
        CustomerSession.customer_id,
        customer.id,
        bearer_token(authorization) or "",
    )
    logger.info("customer_password_changed", customer_id=customer.id)


# --- favorites ------------------------------------------------------------------


@router.get("/favorites", response_model=list[FavoritePlantRead])
def list_favorites(
    customer: CustomerAccount = Depends(get_current_customer),
    session: Session = Depends(get_session),
):
    favorites = session.exec(
        select(FavoritePlant)
        .where(FavoritePlant.customer_id == customer.id)
        .order_by(FavoritePlant.created_at.desc())
    ).all()
    if not favorites:
        return []

    item_ids = {favorite.inventory_item_id for favorite in favorites}
    items = session.exec(select(InventoryItem).where(InventoryItem.id.in_(item_ids))).all()
    inventory_lookup = {item.id: item for item in items}

    store_ids = {item.store_id for item in items}
    store_lookup = {}
    if store_ids:
        store_lookup = {
            store.id: store
            for store in session.exec(
                select(StoreProfile).where(StoreProfile.id.in_(store_ids))
            ).all()
        }

    now = datetime.utcnow()
    results = []
    for favorite in favorites:
        item = inventory_lookup.get(favorite.inventory_item_id)
        # A vivero can delete a listing out from under a saved favorite; skip it
        # rather than 500-ing the whole page.
        if not item:
            continue
        results.append(
            FavoritePlantRead(
                id=favorite.id,
                customer_id=favorite.customer_id,
                created_at=favorite.created_at,
                plant=build_plant_preview(item, store_lookup=store_lookup, now=now),
            )
        )
    return results


@router.get("/favorites/ids", response_model=FavoriteIds)
def list_favorite_ids(
    customer: CustomerAccount = Depends(get_current_customer),
    session: Session = Depends(get_session),
):
    """Just the item ids, so every product card's heart renders from one fetch."""
    favorites = session.exec(
        select(FavoritePlant).where(FavoritePlant.customer_id == customer.id)
    ).all()
    return FavoriteIds(ids=[favorite.inventory_item_id for favorite in favorites])


@router.post("/favorites", response_model=FavoritePlantRead, status_code=201)
def add_favorite(
    payload: FavoritePlantCreate,
    customer: CustomerAccount = Depends(get_current_customer),
    session: Session = Depends(get_session),
):
    item = session.get(InventoryItem, payload.inventory_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Idempotent: favoriting twice is a double-tap, not an error.
    favorite = session.exec(
        select(FavoritePlant)
        .where(FavoritePlant.customer_id == customer.id)
        .where(FavoritePlant.inventory_item_id == item.id)
    ).first()

    if not favorite:
        favorite = FavoritePlant(customer_id=customer.id, inventory_item_id=item.id)
        session.add(favorite)
        session.commit()
        session.refresh(favorite)
        logger.info("customer_favorite_added", customer_id=customer.id, item_id=item.id)

    return FavoritePlantRead(
        id=favorite.id,
        customer_id=favorite.customer_id,
        created_at=favorite.created_at,
        plant=build_plant_preview(item, session=session),
    )


@router.delete("/favorites/{inventory_item_id}", status_code=204)
def remove_favorite(
    inventory_item_id: int,
    customer: CustomerAccount = Depends(get_current_customer),
    session: Session = Depends(get_session),
):
    favorite = session.exec(
        select(FavoritePlant)
        .where(FavoritePlant.customer_id == customer.id)
        .where(FavoritePlant.inventory_item_id == inventory_item_id)
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    session.delete(favorite)
    session.commit()
    logger.info("customer_favorite_removed", customer_id=customer.id, item_id=inventory_item_id)


# --- orders ---------------------------------------------------------------------


@router.get("/orders", response_model=list[CustomerOrder])
def list_orders(customer: CustomerAccount = Depends(get_current_customer)):
    """Always empty for now — there is no checkout and `Order` has no customer id.

    Deliberately does NOT fall back to matching `Order.customer_name`: two
    customers sharing a name would read each other's purchase history.
    """
    return []
