"""Dev-only database seed: `python -m app.seed`.

Drops and recreates all tables, then loads the three demo viveros with
credentials, their inventory (matching the frontend catalog), and six
months of demo orders. Re-run any time to reset the local database.
"""

import random
from datetime import datetime, timedelta

from sqlmodel import Session, SQLModel

from .db import engine
from .models import (
    CustomerAccount,
    FavoritePlant,
    InventoryItem,
    Order,
    OrderItem,
    Promotion,
    StoreProfile,
)
from .security import hash_password

DEMO_PASSWORD = "plantera-demo"

CUSTOMER_NAMES = [
    "María Rivera",
    "José Torres",
    "Camila Ortiz",
    "Luis Vázquez",
    "Ana Delgado",
    "Pedro Santiago",
    "Valeria Cruz",
    "Diego Morales",
    "Sofía Ramos",
    "Carlos Meléndez",
]

UNSPLASH = "https://images.unsplash.com/photo-{id}?w=900&q=80"
UNSPLASH_WIDE = "https://images.unsplash.com/photo-{id}?w=1400&q=80"

# Demo shoppers for the account dashboard. Pre-verified so login works straight
# out of the seed — the real signup flow still requires the emailed code.
DEMO_CUSTOMERS = [
    {
        "first_name": "Marisol",
        "last_name": "Rivera",
        "email": "marisol@plantera.pr",
        "phone": "787-555-0142",
        "favorites": 3,
    },
    {
        "first_name": "Andrés",
        "last_name": "Colón",
        "email": "andres@plantera.pr",
        "phone": "787-555-0177",
        "favorites": 2,
    },
]

# One promotion per vivero at different priorities, so the carousel's ranking is
# visibly doing something rather than just listing rows. Photo ids reuse the
# storefront's already visually-verified images.
PROMOTIONS = [
    {
        "vendor_email": "verde-valle@plantera.pr",
        "headline_es": "20% en toda la colección de interior",
        "headline_en": "20% off the whole indoor collection",
        "body_es": "Monstera, filodendro y potos criados en las montañas de Caguas.",
        "body_en": "Monstera, philodendron and pothos raised in the Caguas hills.",
        "cta_href": "/shop?vivero={store_id}",
        "photo": "1545241047-6083a3684587",
        "priority": 30,
    },
    {
        "vendor_email": "jardines-boriken@plantera.pr",
        "headline_es": "Nuevas llegadas desde Ponce",
        "headline_en": "New arrivals from Ponce",
        "body_es": "Suculentas y cactus del sur, listos para el sol de tu balcón.",
        "body_en": "Southern succulents and cacti, ready for your balcony sun.",
        "cta_href": "/shop?sort=new",
        "photo": "1466692476868-aef1dfb1e735",
        "priority": 20,
    },
    {
        "vendor_email": "casa-tropical@plantera.pr",
        "headline_es": "Macetas artesanales hechas en la isla",
        "headline_en": "Handmade pots, made on the island",
        "body_es": "Barro y cerámica de talleres locales, en tamaños para cada planta.",
        "body_en": "Clay and ceramic from local workshops, sized for every plant.",
        "cta_href": "/shop?category=pot",
        "photo": "1470058869958-2a77ade41c02",
        "priority": 10,
    },
]

# Photo ids are Unsplash originals that were opened and visually confirmed to
# show the product described — do not swap one in without looking at it first.
VENDORS = [
    {
        "name": "Vivero Verde Valle",
        "email": "verde-valle@plantera.pr",
        # Backs the "20% en toda la colección de interior" promo banner below —
        # without this the banner advertises a discount that never applies.
        "store_discount_percent": 20,
        "address": "Caguas, PR",
        "bio": "Vivero familiar especializado en plantas tropicales y de interior.",
        "inventory": [
            {
                "name": "Monstera Deliciosa",
                "price": 42.0,
                "stock": 12,
                "photo": "1614594975525-e45190c55d0b",
                "genus": "Monstera",
                "tags": "tropical, interior, hojas grandes",
                "description": (
                    "La reina de las tropicales. Hojas grandes y caladas que "
                    "llenan cualquier sala con presencia."
                ),
            },
            {
                "name": "Ficus Tineke",
                "price": 48.0,
                "stock": 7,
                "photo": "1597055181300-e3633a917c9c",
                "genus": "Ficus",
                "tags": "variegada, interior, escultural",
                "description": ("Gomero variegado de hojas gruesas en tonos crema, verde y rosa."),
            },
            {
                "name": "Maceta artesanal de barro",
                "price": 24.0,
                "stock": 14,
                "photo": "1595351298020-038700609878",
                "category": "pot",
                "tags": "barro, artesanal, 8 pulgadas",
                "description": "Maceta de barro hecha a mano por artesanos de la isla.",
            },
            {
                "name": 'Maceta de terracota 6"',
                "price": 14.0,
                "stock": 26,
                "photo": "1493957988430-a5f2e15f39a3",
                "category": "pot",
                "tags": "terracota, clásica, 6 pulgadas",
                "description": "Terracota clásica con drenaje, ideal para cactus y suculentas.",
            },
        ],
    },
    {
        "name": "Jardines Borikén",
        "email": "jardines-boriken@plantera.pr",
        "address": "Ponce, PR",
        "bio": "Plantas nativas y resistentes, cultivadas para el clima de la isla.",
        "inventory": [
            {
                "name": "Calathea Lancifolia",
                "price": 34.0,
                "stock": 10,
                "photo": "1602923668104-8f9e03e77e62",
                "genus": "Calathea",
                "tags": "follaje, segura para mascotas, sombra",
                "description": ("Conocida como calathea serpiente por el patrón de sus hojas."),
            },
            {
                "name": "Sansevieria",
                # Item-level beats store-level; this one proves it in the demo.
                "discount_percent": 30,
                "price": 26.0,
                "stock": 20,
                "photo": "1593482892290-f54927ae1bb6",
                "genus": "Sansevieria",
                "tags": "fácil cuidado, poca luz, purificadora",
                "description": "Hojas verticales que resisten casi cualquier descuido.",
            },
            {
                "name": "Aloe",
                "price": 18.0,
                "stock": 24,
                "photo": "1509423350716-97f9360b4e09",
                "genus": "Aloe",
                "tags": "suculenta, medicinal, sol",
                "description": "Suculenta medicinal hecha para el sol del Caribe.",
            },
            {
                "name": "Sustrato tropical 5L",
                "price": 12.0,
                "stock": 40,
                "photo": "1416879595882-3373a0480b5b",
                "category": "supply",
                "tags": "sustrato, drenaje, 5 litros",
                "description": "Mezcla aireada con perlita y corteza para plantas tropicales.",
            },
            {
                "name": "Bandeja de propagación",
                "price": 9.0,
                "stock": 5,
                "photo": "1615671524827-c1fe3973b648",
                "category": "supply",
                "tags": "propagación, semillas, vivero",
                "description": "Bandeja de 32 celdas para germinar semillas y esquejes.",
            },
        ],
    },
    {
        "name": "Vivero Casa Tropical",
        "email": "casa-tropical@plantera.pr",
        "address": "San Juan, PR",
        "bio": "Variedades curadas y plantas de bajo mantenimiento para espacios urbanos.",
        "inventory": [
            {
                "name": "Maranta 'Fascinator'",
                "price": 28.0,
                "stock": 18,
                "photo": "1637967886160-fd78dc3ce3f5",
                "genus": "Maranta",
                "tags": "planta de oración, segura para mascotas, colorida",
                "description": "Sus hojas con nervaduras rosadas se elevan al anochecer.",
            },
            {
                "name": "Cactus Cereus",
                "price": 22.0,
                "stock": 15,
                "photo": "1519336056116-bc0f1771dec8",
                "genus": "Cereus",
                "tags": "cactus, sol, bajo mantenimiento",
                "description": "Columnar, escultural y prácticamente indestructible.",
            },
            {
                "name": "Echeveria",
                "price": 16.0,
                "stock": 30,
                "photo": "1485955900006-10f4d324d411",
                "genus": "Echeveria",
                "tags": "suculenta, escritorio, regalo",
                "description": "Rosetas compactas y geométricas, perfectas para escritorios.",
            },
            {
                "name": "Set de macetas de terracota",
                "price": 32.0,
                "stock": 9,
                "photo": "1459156212016-c812468e2115",
                "category": "pot",
                "tags": "set, terracota, suculentas",
                "description": "Set de seis macetas pequeñas de terracota para suculentas.",
            },
            {
                "name": "Maceta cerámica blanca",
                "price": 28.0,
                "stock": 6,
                "photo": "1512428813834-c702c7702b78",
                "category": "pot",
                "tags": "cerámica, minimalista, interior",
                "description": "Cilindro de cerámica mate blanca con plato incluido.",
            },
        ],
    },
]


def seed() -> None:
    rng = random.Random(2026)

    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        stores_by_email: dict[str, StoreProfile] = {}
        all_items: list[InventoryItem] = []

        for vendor_data in VENDORS:
            store = StoreProfile(
                name=vendor_data["name"],
                email=vendor_data["email"],
                address=vendor_data["address"],
                bio=vendor_data["bio"],
                password_hash=hash_password(DEMO_PASSWORD),
                store_discount_percent=vendor_data.get("store_discount_percent", 0),
            )
            session.add(store)
            session.commit()
            session.refresh(store)

            items: list[InventoryItem] = []
            for entry in vendor_data["inventory"]:
                category = entry.get("category", "plant")
                item = InventoryItem(
                    store_id=store.id,
                    plant_name=entry["name"],
                    description=entry.get("description"),
                    price=entry["price"],
                    stock=entry["stock"],
                    image_url=UNSPLASH.format(id=entry["photo"]),
                    tags=entry.get("tags"),
                    genus=entry.get("genus"),
                    category=category,
                    is_featured=category == "plant",
                    discount_percent=entry.get("discount_percent", 0),
                )
                session.add(item)
                items.append(item)
            session.commit()
            for item in items:
                session.refresh(item)

            stores_by_email[store.email] = store
            all_items.extend(items)

            # Six months of demo orders, growing gently month over month.
            now = datetime.utcnow()
            for months_ago in range(5, -1, -1):
                month_start = (
                    now.replace(day=1, hour=12, minute=0, second=0, microsecond=0)
                    - timedelta(days=months_ago * 30)
                ).replace(day=1)
                order_count = rng.randint(6, 9) + (5 - months_ago)
                for _ in range(order_count):
                    created_at = month_start + timedelta(
                        days=rng.randint(0, 27), hours=rng.randint(8, 20)
                    )
                    order = Order(
                        store_id=store.id,
                        customer_name=rng.choice(CUSTOMER_NAMES),
                        total=0.0,
                        created_at=created_at,
                    )
                    session.add(order)
                    session.commit()
                    session.refresh(order)

                    # Mostly single-plant orders of 1 unit, so six months of
                    # demo sales land near a believable ~$3k per vivero.
                    line_count = 1 if rng.random() < 0.75 else min(2, len(items))
                    total = 0.0
                    for item in rng.sample(items, k=line_count):
                        quantity = 1 if rng.random() < 0.8 else 2
                        session.add(
                            OrderItem(
                                order_id=order.id,
                                inventory_item_id=item.id,
                                quantity=quantity,
                                unit_price=item.price,
                            )
                        )
                        total += quantity * item.price
                    order.total = round(total, 2)
                    session.add(order)
                    session.commit()

            print(f"  vendor: {store.email}  password: {DEMO_PASSWORD}")

        # Demo shoppers, each with a few plants already saved so the account
        # dashboard has something to show.
        plants = [item for item in all_items if item.category == "plant"]
        for index, person in enumerate(DEMO_CUSTOMERS):
            customer = CustomerAccount(
                first_name=person["first_name"],
                last_name=person["last_name"],
                email=person["email"],
                phone=person["phone"],
                password_hash=hash_password(DEMO_PASSWORD),
                is_verified=True,
            )
            session.add(customer)
            session.commit()
            session.refresh(customer)

            # Offset the slice per customer so the two dashboards don't look
            # identical side by side in a demo.
            start = index * 2
            for item in plants[start : start + person["favorites"]]:
                session.add(FavoritePlant(customer_id=customer.id, inventory_item_id=item.id))
            session.commit()
            print(f"  customer: {customer.email}  password: {DEMO_PASSWORD}")

        now = datetime.utcnow()
        for promo_data in PROMOTIONS:
            store = stores_by_email[promo_data["vendor_email"]]
            session.add(
                Promotion(
                    store_id=store.id,
                    headline_es=promo_data["headline_es"],
                    headline_en=promo_data["headline_en"],
                    body_es=promo_data["body_es"],
                    body_en=promo_data["body_en"],
                    cta_href=promo_data["cta_href"].format(store_id=store.id),
                    image_url=UNSPLASH_WIDE.format(id=promo_data["photo"]),
                    starts_at=now - timedelta(days=1),
                    ends_at=now + timedelta(days=60),
                    priority=promo_data["priority"],
                )
            )
        session.commit()
        print(f"  promotions: {len(PROMOTIONS)} running")

    print("\nSeed complete. Vendors log in at /acceso/login; customers at /account.")


if __name__ == "__main__":
    print("Seeding Plantera database (drops all existing data)...\n")
    seed()
