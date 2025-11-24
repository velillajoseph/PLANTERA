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
    CustomerAccount,
    CustomerPublic,
    CustomerRegister,
    CustomerRegistrationResponse,
    CustomerResendRequest,
    CustomerVerificationRequest,
    Feedback,
    FeedbackCreate,
    FeedbackRead,
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
