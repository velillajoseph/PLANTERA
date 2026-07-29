from datetime import datetime, timedelta
from typing import Generator

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.catalog import get_session as catalog_get_session
from app.main import app, get_session
from app.models import InventoryItem, StoreProfile


def get_test_engine():
    return create_engine("sqlite:///./test_catalog.db", connect_args={"check_same_thread": False})


def override_get_session() -> Generator[Session, None, None]:
    engine = get_test_engine()
    with Session(engine) as session:
        yield session


def setup_module(module):
    module._saved_overrides = dict(app.dependency_overrides)
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[catalog_get_session] = override_get_session

    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        active = StoreProfile(
            name="Vivero Activo", email="activo@plantera.pr", address="Caguas, PR"
        )
        hidden = StoreProfile(
            name="Vivero Inactivo",
            email="inactivo@plantera.pr",
            address="Ponce, PR",
            is_active=False,
        )
        on_sale = StoreProfile(
            name="Vivero Rebajado",
            email="rebajado@plantera.pr",
            address="San Juan, PR",
            store_discount_percent=10,
        )
        session.add(active)
        session.add(hidden)
        session.add(on_sale)
        session.commit()
        session.refresh(active)
        session.refresh(hidden)
        session.refresh(on_sale)

        monstera = InventoryItem(
            store_id=active.id,
            plant_name="Monstera Deliciosa",
            price=42.0,
            stock=12,
            genus="Monstera",
            category="plant",
        )
        adansonii = InventoryItem(
            store_id=active.id,
            plant_name="Monstera Adansonii",
            price=38.0,
            stock=5,
            genus="Monstera",
            category="plant",
        )
        pot = InventoryItem(
            store_id=active.id,
            plant_name="Maceta de terracota",
            price=14.0,
            stock=20,
            category="pot",
        )
        paused = InventoryItem(
            store_id=active.id,
            plant_name="Planta Pausada",
            price=25.0,
            stock=4,
            genus="Pausada",
            category="plant",
            is_active=False,
        )
        sold_out = InventoryItem(
            store_id=active.id,
            plant_name="Planta Agotada",
            price=20.0,
            stock=0,
            category="plant",
        )
        hidden_item = InventoryItem(
            store_id=hidden.id,
            plant_name="Planta Oculta",
            price=10.0,
            stock=3,
            category="plant",
        )
        past = datetime.utcnow() - timedelta(days=1)

        # 25% off, open-ended.
        discounted = InventoryItem(
            store_id=active.id,
            plant_name="Ficus Rebajado",
            price=40.0,
            stock=6,
            category="plant",
            discount_percent=25,
        )
        # Store-wide 10% with no item discount of its own.
        store_sale = InventoryItem(
            store_id=on_sale.id,
            plant_name="Calathea de Tienda",
            price=30.0,
            stock=4,
            category="plant",
        )
        # Item discount already finished — must fall through to the store's.
        expired = InventoryItem(
            store_id=on_sale.id,
            plant_name="Aloe Vencido",
            price=20.0,
            stock=8,
            category="plant",
            discount_percent=50,
            discount_ends_at=past,
        )
        for record in (
            monstera,
            adansonii,
            pot,
            paused,
            sold_out,
            hidden_item,
            discounted,
            store_sale,
            expired,
        ):
            session.add(record)
        session.commit()
        for record in (
            monstera,
            adansonii,
            paused,
            sold_out,
            hidden_item,
            discounted,
            store_sale,
            expired,
        ):
            session.refresh(record)

        module.discounted_id = discounted.id
        module.store_sale_id = store_sale.id
        module.expired_id = expired.id
        module.monstera_id = monstera.id
        module.adansonii_id = adansonii.id
        module.paused_id = paused.id
        module.sold_out_id = sold_out.id
        module.hidden_item_id = hidden_item.id


def teardown_module(module):
    app.dependency_overrides.clear()
    app.dependency_overrides.update(module._saved_overrides)
    engine = get_test_engine()
    SQLModel.metadata.drop_all(engine)


client = TestClient(app)

# Populated by setup_module; declared here so they read as module state
# rather than as bare globals needing a noqa on every use.
discounted_id = 0
store_sale_id = 0
expired_id = 0
monstera_id = 0
adansonii_id = 0
paused_id = 0
sold_out_id = 0
hidden_item_id = 0


def test_catalog_lists_items_with_store_details():
    response = client.get("/api/catalog")
    assert response.status_code == 200
    data = response.json()

    names = [item["plant_name"] for item in data["items"]]
    assert "Monstera Deliciosa" in names
    assert "Maceta de terracota" in names

    item = next(i for i in data["items"] if i["plant_name"] == "Monstera Deliciosa")
    assert item["store_name"] == "Vivero Activo"
    assert item["store_location"] == "Caguas, PR"
    assert item["genus"] == "Monstera"
    assert item["category"] == "plant"


def test_catalog_excludes_inactive_stores():
    data = client.get("/api/catalog").json()
    names = [item["plant_name"] for item in data["items"]]
    assert "Planta Oculta" not in names
    assert all(v["name"] != "Vivero Inactivo" for v in data["facets"]["viveros"])


def test_paused_items_are_hidden_but_sold_out_ones_are_not():
    """Pausing hides a listing; running out of stock does not."""
    data = client.get("/api/catalog").json()
    names = [item["plant_name"] for item in data["items"]]

    assert "Planta Pausada" not in names
    assert "Planta Agotada" in names

    assert client.get(f"/api/catalog/{paused_id}").status_code == 404  # noqa: F821
    assert client.get(f"/api/catalog/{sold_out_id}").status_code == 200  # noqa: F821
    assert "Pausada" not in data["facets"]["genera"]


def test_catalog_facets():
    data = client.get("/api/catalog").json()
    facets = data["facets"]
    assert facets["genera"] == ["Monstera"]
    assert sorted(facets["categories"]) == ["plant", "pot"]
    # Two active viveros carry stock: "Vivero Activo" and "Vivero Rebajado".
    assert [vivero["name"] for vivero in facets["viveros"]] == [
        "Vivero Activo",
        "Vivero Rebajado",
    ]
    # Monstera x2, pot, sold-out plant, discounted ficus — paused is excluded.
    assert facets["viveros"][0]["item_count"] == 5
    # ...plus the store-sale item and the expired-discount item.
    assert facets["viveros"][1]["item_count"] == 2
    assert data["total"] == 7


def test_catalog_detail_returns_related_same_genus():
    response = client.get(f"/api/catalog/{monstera_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["item"]["plant_name"] == "Monstera Deliciosa"

    related_names = [i["plant_name"] for i in data["related"]]
    assert "Monstera Adansonii" in related_names
    # Related stays within the same category, so pots never surface under a plant.
    assert "Maceta de terracota" not in related_names


def test_catalog_detail_404s_for_unknown_and_inactive():
    assert client.get("/api/catalog/999999").status_code == 404
    assert client.get(f"/api/catalog/{hidden_item_id}").status_code == 404  # noqa: F821


# --- discounts ------------------------------------------------------------------


def find(items, item_id):
    return next(entry for entry in items if entry["id"] == item_id)


def test_item_discount_returns_effective_price_and_the_struck_original():
    items = client.get("/api/catalog").json()["items"]
    item = find(items, discounted_id)
    assert item["price"] == 30.0
    assert item["original_price"] == 40.0
    assert item["discount_percent"] == 25
    assert item["discount_source"] == "item"


def test_an_undiscounted_item_reports_none_never_zero():
    """`original_price is not None` is the single on-sale test, so a 0 here
    would make every item look discounted."""
    item = find(client.get("/api/catalog").json()["items"], monstera_id)
    assert item["price"] == 42.0
    assert item["original_price"] is None
    assert item["discount_percent"] is None
    assert item["discount_source"] is None


def test_store_wide_discount_reaches_an_item_with_none_of_its_own():
    item = find(client.get("/api/catalog").json()["items"], store_sale_id)
    assert item["price"] == 27.0
    assert item["original_price"] == 30.0
    assert item["discount_source"] == "store"


def test_an_expired_item_discount_falls_through_to_the_store_discount():
    item = find(client.get("/api/catalog").json()["items"], expired_id)
    assert item["discount_source"] == "store"
    assert item["discount_percent"] == 10
    assert item["price"] == 18.0


def test_detail_and_related_both_carry_the_discount_shape():
    data = client.get(f"/api/catalog/{discounted_id}").json()
    assert data["item"]["original_price"] == 40.0
    for related in data["related"]:
        assert "original_price" in related
        assert "discount_percent" in related


# --- cart re-pricing ------------------------------------------------------------


def test_pricing_endpoint_returns_current_prices():
    response = client.get(f"/api/catalog/pricing?ids={discounted_id},{monstera_id}")
    assert response.status_code == 200
    body = {entry["id"]: entry for entry in response.json()}
    assert body[discounted_id]["price"] == 30.0
    assert body[discounted_id]["original_price"] == 40.0
    assert body[monstera_id]["original_price"] is None
    assert body[monstera_id]["stock"] == 12


def test_pricing_omits_anything_the_shopper_can_no_longer_buy():
    """A missing id is the single signal for deleted, paused, or inactive-store."""
    ids = f"{monstera_id},{paused_id},{hidden_item_id},999999"
    returned = {entry["id"] for entry in client.get(f"/api/catalog/pricing?ids={ids}").json()}
    assert returned == {monstera_id}


def test_pricing_is_not_swallowed_by_the_item_id_route():
    """Declared before /{item_id}; the reverse order parses "pricing" as an id."""
    assert client.get("/api/catalog/pricing?ids=1").status_code == 200
    assert client.get("/api/catalog/pricing").status_code == 422


def test_pricing_ignores_junk_ids():
    assert client.get("/api/catalog/pricing?ids=abc,,-1").json() == []
