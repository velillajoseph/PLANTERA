from typing import Generator

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.main import app, get_session


def get_test_engine():
    return create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})


def override_get_session() -> Generator[Session, None, None]:
    engine = get_test_engine()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def setup_module(module):
    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)


def teardown_module(module):
    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)


app.dependency_overrides[get_session] = override_get_session
client = TestClient(app)


def test_feedback_flow_creates_record():
    response = client.post("/api/feedback", json={"name": "Test User", "message": "Hello"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test User"
    assert data["message"] == "Hello"

    list_response = client.get("/api/feedback")
    assert list_response.status_code == 200
    assert any(item["id"] == data["id"] for item in list_response.json())


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
