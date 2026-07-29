from datetime import datetime, timedelta
from typing import Generator

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.auth import get_session as auth_get_session
from app.main import app, get_session
from app.models import Promotion, StoreProfile
from app.promotions import rank_promotions


def get_test_engine():
    return create_engine(
        "sqlite:///./test_promotions.db", connect_args={"check_same_thread": False}
    )


def override_get_session() -> Generator[Session, None, None]:
    engine = get_test_engine()
    with Session(engine) as session:
        yield session


def make_promotion(store_id: int, headline: str, priority: int, **overrides) -> Promotion:
    now = datetime.utcnow()
    fields = {
        "store_id": store_id,
        "headline_es": headline,
        "headline_en": headline,
        "starts_at": now - timedelta(days=1),
        "ends_at": now + timedelta(days=30),
        "priority": priority,
    }
    fields.update(overrides)
    return Promotion(**fields)


def setup_module(module):
    module._saved_overrides = dict(app.dependency_overrides)
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[auth_get_session] = override_get_session

    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    now = datetime.utcnow()
    with Session(engine) as session:
        store = StoreProfile(name="Vivero Activo", email="activo@plantera.pr")
        closed = StoreProfile(name="Vivero Cerrado", email="cerrado@plantera.pr", is_active=False)
        session.add(store)
        session.add(closed)
        session.commit()
        session.refresh(store)
        session.refresh(closed)

        live_high = make_promotion(store.id, "Prioridad alta", 30)
        live_low = make_promotion(store.id, "Prioridad baja", 10)
        paused = make_promotion(store.id, "Pausada", 99, is_active=False)
        finished = make_promotion(
            store.id,
            "Terminada",
            99,
            starts_at=now - timedelta(days=30),
            ends_at=now - timedelta(days=1),
        )
        future = make_promotion(
            store.id,
            "Futura",
            99,
            starts_at=now + timedelta(days=5),
            ends_at=now + timedelta(days=30),
        )
        orphan = make_promotion(closed.id, "Vivero inactivo", 99)

        for promo in (live_high, live_low, paused, finished, future, orphan):
            session.add(promo)
        session.commit()
        session.refresh(live_high)

        module.store_id = store.id
        module.live_high_id = live_high.id


def teardown_module(module):
    app.dependency_overrides.clear()
    app.dependency_overrides.update(module._saved_overrides)
    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)


client = TestClient(app)

# Populated by setup_module; declared here so they read as module state.
store_id = 0
live_high_id = 0


def test_only_live_promotions_are_served():
    response = client.get("/api/promotions")
    assert response.status_code == 200
    headlines = {promo["headline_es"] for promo in response.json()}
    assert headlines == {"Prioridad alta", "Prioridad baja"}


def test_response_carries_the_vivero_name():
    promo = client.get("/api/promotions").json()[0]
    assert promo["store_name"] == "Vivero Activo"


def test_ranking_puts_higher_priority_first():
    now = datetime(2026, 7, 28, 0, 0, 0)  # hour 0 → no rotation offset
    promos = [
        make_promotion(1, "baja", 1),
        make_promotion(1, "alta", 50),
        make_promotion(1, "media", 10),
    ]
    for index, promo in enumerate(promos, start=1):
        promo.id = index

    ranked = rank_promotions(promos, now)
    assert [promo.headline_es for promo in ranked] == ["alta", "media", "baja"]


def test_ranking_rotates_across_the_day():
    """Equal-priority viveros should take turns rather than the lowest id always winning."""
    promos = []
    for index in range(3):
        promo = make_promotion(1, f"promo-{index}", 0)
        promo.id = index
        promos.append(promo)

    firsts = {rank_promotions(promos, datetime(2026, 7, 28, hour))[0].id for hour in range(24)}
    assert firsts == {0, 1, 2}


def test_rotation_never_demotes_a_higher_priority_promotion():
    """The thing a vivero pays for: a top tier stays on top, all day long."""
    paid = make_promotion(1, "pagada", 50)
    paid.id = 1
    free_a = make_promotion(1, "gratis-a", 0)
    free_a.id = 2
    free_b = make_promotion(1, "gratis-b", 0)
    free_b.id = 3

    for hour in range(24):
        ranked = rank_promotions([paid, free_a, free_b], datetime(2026, 7, 28, hour))
        assert ranked[0].headline_es == "pagada", f"demoted at hour {hour}"

    # The free tier still rotates between itself.
    seconds = {
        rank_promotions([paid, free_a, free_b], datetime(2026, 7, 28, hour))[1].id
        for hour in range(24)
    }
    assert seconds == {2, 3}


def test_event_endpoint_increments_the_right_counter():
    engine = get_test_engine()

    assert (
        client.post(
            f"/api/promotions/{live_high_id}/event", json={"type": "impression"}
        ).status_code
        == 204
    )
    assert (
        client.post(f"/api/promotions/{live_high_id}/event", json={"type": "click"}).status_code
        == 204
    )

    with Session(engine) as session:
        promo = session.get(Promotion, live_high_id)
        assert promo.impressions == 1
        assert promo.clicks == 1


def test_event_endpoint_rejects_unknown_types_and_ids():
    assert (
        client.post(f"/api/promotions/{live_high_id}/event", json={"type": "purchase"}).status_code
        == 400
    )
    assert client.post("/api/promotions/999999/event", json={"type": "click"}).status_code == 404
