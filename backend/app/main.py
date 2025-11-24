import os
from contextlib import asynccontextmanager

import structlog
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .db import engine, init_db
from .logging_config import configure_logging
from .models import Customer, CustomerCreate, CustomerRead, Feedback, FeedbackCreate, FeedbackRead

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


@app.post("/api/customers", response_model=CustomerRead, status_code=201)
def create_customer(payload: CustomerCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Customer).where(Customer.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    customer = Customer(name=payload.name, email=payload.email, company=payload.company)
    session.add(customer)
    session.commit()
    session.refresh(customer)

    logger.info("customer_signed_up", customer_id=customer.id)
    return customer


@app.get("/api/customers", response_model=list[CustomerRead])
def list_customers(session: Session = Depends(get_session)):
    customers = session.exec(select(Customer).order_by(Customer.created_at.desc())).all()
    logger.info("customers_listed", count=len(customers))
    return customers
