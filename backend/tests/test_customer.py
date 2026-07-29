import os
from datetime import datetime, timedelta
from typing import Generator

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select

from app.auth import get_session as auth_get_session
from app.main import app, get_session
from app.models import CustomerSession, InventoryItem, StoreProfile


def get_test_engine():
    return create_engine("sqlite:///./test_customer.db", connect_args={"check_same_thread": False})


def override_get_session() -> Generator[Session, None, None]:
    engine = get_test_engine()
    with Session(engine) as session:
        yield session


def setup_module(module):
    # Read back the emailed code so tests exercise the real /verify endpoint
    # rather than flipping is_verified in the database.
    module._saved_preview = os.environ.get("SHOW_VERIFICATION_CODE_IN_RESPONSE")
    os.environ["SHOW_VERIFICATION_CODE_IN_RESPONSE"] = "true"

    # Save/restore so the other test modules, which point the same dependency
    # at their own database file, are unaffected by this one.
    module._saved_overrides = dict(app.dependency_overrides)
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[auth_get_session] = override_get_session

    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        store = StoreProfile(name="Vivero Test", email="vivero@plantera.pr")
        session.add(store)
        session.commit()
        session.refresh(store)

        item = InventoryItem(store_id=store.id, plant_name="Monstera", price=42.0, stock=5)
        other_item = InventoryItem(store_id=store.id, plant_name="Aloe", price=18.0, stock=9)
        session.add(item)
        session.add(other_item)
        session.commit()
        session.refresh(item)
        session.refresh(other_item)

        module.item_id = item.id
        module.other_item_id = other_item.id


def teardown_module(module):
    app.dependency_overrides.clear()
    app.dependency_overrides.update(module._saved_overrides)
    if module._saved_preview is None:
        os.environ.pop("SHOW_VERIFICATION_CODE_IN_RESPONSE", None)
    else:
        os.environ["SHOW_VERIFICATION_CODE_IN_RESPONSE"] = module._saved_preview
    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)


client = TestClient(app)

# Populated by setup_module; declared here so they read as module state.
item_id = 0
other_item_id = 0


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def register(email: str, password: str = "secret123", first: str = "Ana") -> str:
    """Run the whole signup — register, verify, log in — and return the token."""
    response = client.post(
        "/api/customers/register",
        json={
            "first_name": first,
            "last_name": "Rivera",
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 201, response.text
    verify(email, response.json()["verification_preview"])
    return login(email, password)


def verify(email: str, code: str) -> None:
    response = client.post("/api/customers/verify", json={"email": email, "code": code})
    assert response.status_code == 200, response.text


def login(email: str, password: str = "secret123") -> str:
    response = client.post("/api/customers/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["token"]


def test_register_verify_login_round_trip():
    response = client.post(
        "/api/customers/register",
        json={
            "first_name": "Marisol",
            "last_name": "Colón",
            "email": "round-trip@plantera.pr",
            "password": "secret123",
        },
    )
    assert response.status_code == 201
    assert response.json()["verification_required"] is True

    verify("round-trip@plantera.pr", response.json()["verification_preview"])
    token = login("round-trip@plantera.pr")
    assert token


def test_verify_rejects_a_wrong_code():
    client.post(
        "/api/customers/register",
        json={
            "first_name": "Codigo",
            "last_name": "Malo",
            "email": "badcode@plantera.pr",
            "password": "secret123",
        },
    )
    response = client.post(
        "/api/customers/verify", json={"email": "badcode@plantera.pr", "code": "000000"}
    )
    assert response.status_code == 400


def test_login_before_verification_is_distinguishable():
    client.post(
        "/api/customers/register",
        json={
            "first_name": "Sin",
            "last_name": "Verificar",
            "email": "unverified@plantera.pr",
            "password": "secret123",
        },
    )
    response = client.post(
        "/api/customers/login",
        json={"email": "unverified@plantera.pr", "password": "secret123"},
    )
    # 403 rather than 401 so the sign-in modal can jump to the code pane
    # instead of claiming the password was wrong.
    assert response.status_code == 403
    assert response.json()["detail"] == "email_not_verified"


def test_login_rejects_bad_password_and_unknown_email():
    register("badpass@plantera.pr")
    assert (
        client.post(
            "/api/customers/login",
            json={"email": "badpass@plantera.pr", "password": "wrong"},
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/customers/login",
            json={"email": "nobody@plantera.pr", "password": "secret123"},
        ).status_code
        == 401
    )


def test_register_rejects_short_password():
    response = client.post(
        "/api/customers/register",
        json={
            "first_name": "Corta",
            "last_name": "Clave",
            "email": "short@plantera.pr",
            "password": "abc12",
        },
    )
    assert response.status_code == 400


def test_me_requires_a_valid_token():
    assert client.get("/api/customers/me").status_code == 401
    assert client.get("/api/customers/me", headers=auth("garbage")).status_code == 401


def test_me_returns_profile_without_the_hash():
    token = register("me@plantera.pr", first="Perfil")
    response = client.get("/api/customers/me", headers=auth(token))
    assert response.status_code == 200
    body = response.json()
    assert body["first_name"] == "Perfil"
    assert "password_hash" not in body


def test_patch_me_updates_names_but_never_the_email():
    token = register("patch@plantera.pr")
    response = client.patch(
        "/api/customers/me",
        headers=auth(token),
        json={"first_name": "Nuevo", "phone": "787-555-0100", "email": "hijack@plantera.pr"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["first_name"] == "Nuevo"
    assert body["phone"] == "787-555-0100"
    assert body["email"] == "patch@plantera.pr"


def test_change_password_flow_and_session_revocation():
    email = "changepw@plantera.pr"
    keeper = register(email)
    doomed = login(email)

    assert (
        client.post(
            "/api/customers/change-password",
            headers=auth(keeper),
            json={"current_password": "wrong", "new_password": "newsecret123"},
        ).status_code
        == 400
    )
    assert (
        client.post(
            "/api/customers/change-password",
            headers=auth(keeper),
            json={"current_password": "secret123", "new_password": "short"},
        ).status_code
        == 400
    )

    assert (
        client.post(
            "/api/customers/change-password",
            headers=auth(keeper),
            json={"current_password": "secret123", "new_password": "newsecret123"},
        ).status_code
        == 204
    )

    # The caller keeps working; every other session is gone.
    assert client.get("/api/customers/me", headers=auth(keeper)).status_code == 200
    assert client.get("/api/customers/me", headers=auth(doomed)).status_code == 401
    assert login(email, "newsecret123")


def test_favorites_add_list_dedupe_and_remove():
    token = register("favs@plantera.pr")

    created = client.post(
        "/api/customers/favorites", headers=auth(token), json={"inventory_item_id": item_id}
    )
    assert created.status_code == 201
    favorite_id = created.json()["id"]
    assert created.json()["plant"]["title"] == "Monstera"

    listing = client.get("/api/customers/favorites", headers=auth(token))
    assert len(listing.json()) == 1

    # Double-tapping the heart is not an error and must not duplicate the row.
    again = client.post(
        "/api/customers/favorites", headers=auth(token), json={"inventory_item_id": item_id}
    )
    assert again.status_code == 201
    assert again.json()["id"] == favorite_id
    assert len(client.get("/api/customers/favorites", headers=auth(token)).json()) == 1

    ids = client.get("/api/customers/favorites/ids", headers=auth(token))
    assert ids.json()["ids"] == [item_id]

    removed = client.delete(f"/api/customers/favorites/{item_id}", headers=auth(token))
    assert removed.status_code == 204
    assert client.get("/api/customers/favorites", headers=auth(token)).json() == []
    assert (
        client.delete(f"/api/customers/favorites/{item_id}", headers=auth(token)).status_code == 404
    )


def test_favoriting_an_unknown_item_is_404():
    token = register("badfav@plantera.pr")
    response = client.post(
        "/api/customers/favorites", headers=auth(token), json={"inventory_item_id": 999999}
    )
    assert response.status_code == 404


def test_one_customer_never_sees_anothers_favorites():
    alice = register("alice@plantera.pr")
    bob = register("bob@plantera.pr")

    client.post(
        "/api/customers/favorites", headers=auth(alice), json={"inventory_item_id": item_id}
    )
    client.post(
        "/api/customers/favorites",
        headers=auth(bob),
        json={"inventory_item_id": other_item_id},
    )

    alice_ids = client.get("/api/customers/favorites/ids", headers=auth(alice)).json()["ids"]
    bob_ids = client.get("/api/customers/favorites/ids", headers=auth(bob)).json()["ids"]
    assert alice_ids == [item_id]
    assert bob_ids == [other_item_id]


def test_expired_session_is_rejected():
    token = register("expired@plantera.pr")
    engine = get_test_engine()
    with Session(engine) as session:
        row = session.exec(select(CustomerSession).where(CustomerSession.token == token)).one()
        row.expires_at = datetime.utcnow() - timedelta(seconds=1)
        session.add(row)
        session.commit()

    assert client.get("/api/customers/me", headers=auth(token)).status_code == 401


def test_sliding_window_writes_once_then_is_suppressed():
    token = register("sliding@plantera.pr")
    engine = get_test_engine()

    with Session(engine) as session:
        row = session.exec(select(CustomerSession).where(CustomerSession.token == token)).one()
        row.expires_at = datetime.utcnow() + timedelta(minutes=5)
        session.add(row)
        session.commit()
        stale = row.expires_at

    assert client.get("/api/customers/me", headers=auth(token)).status_code == 200
    with Session(engine) as session:
        slid = (
            session.exec(select(CustomerSession).where(CustomerSession.token == token))
            .one()
            .expires_at
        )
    assert slid > stale

    # Second request lands inside TOUCH_INTERVAL_SECONDS, so nothing is written.
    assert client.get("/api/customers/me", headers=auth(token)).status_code == 200
    with Session(engine) as session:
        again = (
            session.exec(select(CustomerSession).where(CustomerSession.token == token))
            .one()
            .expires_at
        )
    assert again == slid


def test_touch_forces_a_write_inside_the_guard_window():
    token = register("touch@plantera.pr")
    engine = get_test_engine()

    # Warm the session so a plain request would be suppressed.
    client.get("/api/customers/me", headers=auth(token))
    with Session(engine) as session:
        before = (
            session.exec(select(CustomerSession).where(CustomerSession.token == token))
            .one()
            .expires_at
        )

    response = client.post("/api/customers/session/touch", headers=auth(token))
    assert response.status_code == 200
    with Session(engine) as session:
        after = (
            session.exec(select(CustomerSession).where(CustomerSession.token == token))
            .one()
            .expires_at
        )
    assert after >= before


def test_logout_revokes_and_is_idempotent():
    token = register("logout@plantera.pr")
    assert client.post("/api/customers/logout", headers=auth(token)).status_code == 204
    assert client.get("/api/customers/me", headers=auth(token)).status_code == 401
    # Logging out an already-dead token is still a clean 204.
    assert client.post("/api/customers/logout", headers=auth(token)).status_code == 204


def test_orders_is_empty_until_checkout_exists():
    token = register("orders@plantera.pr")
    response = client.get("/api/customers/orders", headers=auth(token))
    assert response.status_code == 200
    assert response.json() == []
