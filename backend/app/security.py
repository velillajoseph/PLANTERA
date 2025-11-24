import hashlib
import os
import secrets
from datetime import datetime, timedelta

VERIFICATION_TTL_MINUTES = int(os.getenv("VERIFICATION_TTL_MINUTES", "30"))


def hash_password(password: str) -> str:
    salt = os.getenv("PASSWORD_SALT", "")
    return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()


def generate_verification_code() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(6))


def hash_verification_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def verification_expiration_time() -> datetime:
    return datetime.utcnow() + timedelta(minutes=VERIFICATION_TTL_MINUTES)
