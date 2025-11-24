import os
from contextlib import asynccontextmanager

import structlog
from fastapi import Depends, FastAPI
from sqlmodel import Session, select

from .db import engine, init_db
from .logging_config import configure_logging
from .models import Feedback, FeedbackCreate, FeedbackRead

logger = structlog.get_logger()


@asynccontextmanager
def lifespan(app: FastAPI):
    configure_logging()
    init_db()
    logger.info("app_started", database_url=os.getenv("DATABASE_URL", "sqlite"))
    yield
    logger.info("app_stopped")


def get_session():
    with Session(engine) as session:
        yield session


app = FastAPI(title="Plantera API", lifespan=lifespan)


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
