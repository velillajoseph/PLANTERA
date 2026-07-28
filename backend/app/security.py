import hashlib
import os
import secrets
from datetime import datetime, timedelta

VERIFICATION_TTL_MINUTES = int(os.getenv("VERIFICATION_TTL_MINUTES", "30"))

PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = os.getenv("PASSWORD_SALT", "")
    return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()


def hash_vendor_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ITERATIONS
    )
    return f"pbkdf2${PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def verify_vendor_password(password: str, stored: str) -> bool:
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
