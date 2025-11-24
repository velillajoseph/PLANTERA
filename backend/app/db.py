import os
from sqlmodel import SQLModel, create_engine

DEFAULT_DATABASE_URL = "sqlite:///./data.db"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
