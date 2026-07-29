"""Pure crypto helpers.

Deliberately free of DB and FastAPI imports so `seed.py` and the tests can
import it without pulling half the app in. Anything that needs a Session lives
in `auth.py` instead.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta

VERIFICATION_TTL_MINUTES = int(os.getenv("VERIFICATION_TTL_MINUTES", "30"))

PBKDF2_ITERATIONS = 200_000

MIN_PASSWORD_LENGTH = 8


def hash_password(password: str) -> str:
    """PBKDF2-SHA256 with a per-password salt, stored as `pbkdf2$iters$salt$hex`.

    Vendors and customers share this scheme — there was never anything
    vendor-specific about it beyond the old function name.
    """
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ITERATIONS
    )
    return f"pbkdf2${PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iterations, salt, expected = stored.split("$")
        if scheme != "pbkdf2":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt), int(iterations)
        )
        return secrets.compare_digest(digest.hex(), expected)
    except (ValueError, AttributeError):
        return False


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def generate_verification_code() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(6))


def hash_verification_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def verification_expiration_time() -> datetime:
    return datetime.utcnow() + timedelta(minutes=VERIFICATION_TTL_MINUTES)
