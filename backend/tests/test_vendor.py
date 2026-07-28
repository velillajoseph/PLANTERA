from pathlib import Path
from typing import Generator

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.main import app, get_session
from app.models import InventoryItem, Order, OrderItem, StoreProfile
from app.security import hash_vendor_password
from app.vendor import get_session as vendor_get_session


def get_test_engine():
    return create_engine("sqlite:///./test_vendor.db", connect_args={"check_same_thread": False})


def override_get_session() -> Generator[Session, None, None]:
    engine = get_test_engine()
    with Session(engine) as session:
        yield session


def setup_module(module):
    # Override the app's DB sessions only for this module's lifetime, so the
    # feedback tests (which point the same dependency at test.db) are unaffected.
    module._saved_overrides = dict(app.dependency_overrides)
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[vendor_get_session] = override_get_session

    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        store = StoreProfile(
            name="Vivero Test",
            email="test@plantera.pr",
            password_hash=hash_vendor_password("secret123"),
        )
        other = StoreProfile(
            name="Otro Vivero",
            email="otro@plantera.pr",
            password_hash=hash_vendor_password("secret123"),
        )
        session.add(store)
        session.add(other)
        session.commit()
        session.refresh(store)
        session.refresh(other)

        item = InventoryItem(store_id=store.id, plant_name="Monstera", price=40.0, stock=5)
        foreign_item = InventoryItem(store_id=other.id, plant_name="Ficus", price=30.0, stock=9)
        session.add(item)
        session.add(foreign_item)
        session.commit()
        session.refresh(item)

        order = Order(store_id=store.id, customer_name="Ana", total=80.0)
        session.add(order)
        session.commit()
        session.refresh(order)
        session.add(
            OrderItem(
                order_id=order.id,
                inventory_item_id=item.id,
                quantity=2,
                unit_price=40.0,
            )
        )
        session.commit()

        module.store_id = store.id
        module.item_id = item.id
        module.foreign_item_id = foreign_item.id


def teardown_module(module):
    app.dependency_overrides.clear()
    app.dependency_overrides.update(module._saved_overrides)
    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)


client = TestClient(app)


def login() -> str:
    response = client.post(
        "/api/vendor/login",
        json={"email": "test@plantera.pr", "password": "secret123"},
    )
    assert response.status_code == 200
    return response.json()["token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_login_rejects_bad_password():
    response = client.post(
        "/api/vendor/login",
        json={"email": "test@plantera.pr", "password": "wrong"},
    )
    assert response.status_code == 401


def test_login_returns_token_and_profile():
    response = client.post(
        "/api/vendor/login",
        json={"email": "test@plantera.pr", "password": "secret123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["token"]
    assert data["vendor"]["name"] == "Vivero Test"
    assert "password_hash" not in data["vendor"]


def test_inventory_requires_auth():
    assert client.get("/api/vendor/inventory").status_code == 401


def test_inventory_crud_and_ownership():
    token = login()

    listing = client.get("/api/vendor/inventory", headers=auth(token))
    assert listing.status_code == 200
    assert any(item["plant_name"] == "Monstera" for item in listing.json())

    created = client.post(
        "/api/vendor/inventory",
        headers=auth(token),
        json={"plant_name": "Aloe", "price": 18.0, "stock": 3},
    )
    assert created.status_code == 201
    new_id = created.json()["id"]

    updated = client.patch(
        f"/api/vendor/inventory/{new_id}",
        headers=auth(token),
        json={"price": 19.5, "stock": 6},
    )
    assert updated.status_code == 200
    assert updated.json()["price"] == 19.5

    foreign = client.patch(
        f"/api/vendor/inventory/{foreign_item_id}",  # noqa: F821 - set in setup_module
        headers=auth(token),
        json={"price": 1.0},
    )
    assert foreign.status_code == 404

    deleted = client.delete(f"/api/vendor/inventory/{new_id}", headers=auth(token))
    assert deleted.status_code == 204


def test_stats_shape():
    token = login()
    response = client.get("/api/vendor/stats", headers=auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["totals"]["orders"] >= 1
    assert data["totals"]["revenue"] > 0
    assert data["totals"]["active_listings"] >= 1
    assert isinstance(data["monthly"], list)
    assert data["monthly"][-1]["orders"] >= 1
    assert data["top_plants"][0]["plant_name"] == "Monstera"
    assert any(item["plant_name"] == "Monstera" for item in data["low_stock"])
    assert data["recent_orders"][0]["customer_name"] == "Ana"


def test_orders_pagination_and_month_filter():
    token = login()
    response = client.get("/api/vendor/orders", headers=auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert data["page"] == 1
    assert len(data["months"]) >= 1
    first = data["orders"][0]
    assert first["customer_name"] == "Ana"
    assert first["items"][0]["plant_name"] == "Monstera"
    assert first["items"][0]["quantity"] == 2

    month = data["months"][0]
    filtered = client.get(f"/api/vendor/orders?month={month}", headers=auth(token))
    assert filtered.status_code == 200
    assert filtered.json()["total"] >= 1

    empty = client.get("/api/vendor/orders?month=1999-01", headers=auth(token))
    assert empty.status_code == 200
    assert empty.json()["total"] == 0

    bad = client.get("/api/vendor/orders?month=not-a-month", headers=auth(token))
    assert bad.status_code == 422

    sized = client.get("/api/vendor/orders?page_size=5", headers=auth(token))
    assert sized.status_code == 200
    assert sized.json()["page_size"] == 5
    assert len(sized.json()["orders"]) <= 5

    oversized = client.get("/api/vendor/orders?page_size=100", headers=auth(token))
    assert oversized.status_code == 422


def test_change_password_flow():
    token = login()
    other_token = login()

    wrong = client.post(
        "/api/vendor/change-password",
        headers=auth(token),
        json={"current_password": "nope", "new_password": "newsecret123"},
    )
    assert wrong.status_code == 400

    weak = client.post(
        "/api/vendor/change-password",
        headers=auth(token),
        json={"current_password": "secret123", "new_password": "short"},
    )
    assert weak.status_code == 400

    ok = client.post(
        "/api/vendor/change-password",
        headers=auth(token),
        json={"current_password": "secret123", "new_password": "newsecret123"},
    )
    assert ok.status_code == 204

    # The session that changed the password survives; others are revoked.
    assert client.get("/api/vendor/me", headers=auth(token)).status_code == 200
    assert client.get("/api/vendor/me", headers=auth(other_token)).status_code == 401

    relogin = client.post(
        "/api/vendor/login",
        json={"email": "test@plantera.pr", "password": "newsecret123"},
    )
    assert relogin.status_code == 200

    # Restore the original password so other tests stay independent of order.
    restore = client.post(
        "/api/vendor/change-password",
        headers=auth(relogin.json()["token"]),
        json={"current_password": "newsecret123", "new_password": "secret123"},
    )
    assert restore.status_code == 204


def test_pause_hides_item_from_stats():
    token = login()

    created = client.post(
        "/api/vendor/inventory",
        headers=auth(token),
        json={"plant_name": "Pausable", "price": 20.0, "stock": 2},
    )
    item_id = created.json()["id"]
    assert created.json()["is_active"] is True

    before = client.get("/api/vendor/stats", headers=auth(token)).json()
    assert any(i["plant_name"] == "Pausable" for i in before["low_stock"])

    paused = client.patch(
        f"/api/vendor/inventory/{item_id}",
        headers=auth(token),
        json={"is_active": False},
    )
    assert paused.status_code == 200
    assert paused.json()["is_active"] is False

    after = client.get("/api/vendor/stats", headers=auth(token)).json()
    assert not any(i["plant_name"] == "Pausable" for i in after["low_stock"])
    assert after["totals"]["active_listings"] == before["totals"]["active_listings"] - 1

    # A paused listing still belongs to the vendor and can be brought back.
    assert any(
        i["id"] == item_id for i in client.get("/api/vendor/inventory", headers=auth(token)).json()
    )
    client.patch(
        f"/api/vendor/inventory/{item_id}",
        headers=auth(token),
        json={"is_active": True},
    )
    client.delete(f"/api/vendor/inventory/{item_id}", headers=auth(token))


def make_png_bytes() -> bytes:
    from io import BytesIO

    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (40, 30), (40, 90, 60)).save(buffer, format="PNG")
    return buffer.getvalue()


def test_image_upload_flow():
    token = login()
    created = client.post(
        "/api/vendor/inventory",
        headers=auth(token),
        json={"plant_name": "Con Foto", "price": 30.0, "stock": 5},
    )
    item_id = created.json()["id"]

    uploaded = client.post(
        f"/api/vendor/inventory/{item_id}/image",
        headers=auth(token),
        files={"file": ("plant.png", make_png_bytes(), "image/png")},
    )
    assert uploaded.status_code == 200
    image_url = uploaded.json()["image_url"]
    assert image_url.startswith("/uploads/")
    # Stored normalized as JPEG regardless of what was sent in.
    assert image_url.endswith(".jpg")

    stored = Path("uploads") / Path(image_url).name
    assert stored.exists()

    rejected = client.post(
        f"/api/vendor/inventory/{item_id}/image",
        headers=auth(token),
        files={"file": ("evil.jpg", b"this is definitely not an image", "image/jpeg")},
    )
    assert rejected.status_code == 400

    foreign = client.post(
        f"/api/vendor/inventory/{foreign_item_id}/image",  # noqa: F821
        headers=auth(token),
        files={"file": ("plant.png", make_png_bytes(), "image/png")},
    )
    assert foreign.status_code == 404

    removed = client.delete(f"/api/vendor/inventory/{item_id}/image", headers=auth(token))
    assert removed.status_code == 200
    assert removed.json()["image_url"] is None
    assert not stored.exists()

    client.delete(f"/api/vendor/inventory/{item_id}", headers=auth(token))


def test_logout_revokes_session():
    token = login()
    assert client.get("/api/vendor/me", headers=auth(token)).status_code == 200
    assert client.post("/api/vendor/logout", headers=auth(token)).status_code == 204
    assert client.get("/api/vendor/me", headers=auth(token)).status_code == 401
