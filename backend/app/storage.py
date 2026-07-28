"""Image storage for vendor listing photos.

Every disk operation lives here so switching to S3/Cloudinary later means
rewriting this module and nothing else. Callers only ever see the public path
that goes into ``InventoryItem.image_url``.
"""

import os
import uuid
from io import BytesIO
from pathlib import Path
from typing import Optional

from PIL import Image, UnidentifiedImageError

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
PUBLIC_PREFIX = "/uploads"

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_DIMENSION = 1600  # long edge; the browser also downscales before sending
JPEG_QUALITY = 85


class ImageValidationError(ValueError):
    """Raised when uploaded bytes are missing, too large, or not an image."""


def ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_image(data: bytes) -> str:
    """Validate, normalize, and store an image. Returns its public path.

    Re-encoding serves two purposes beyond size: it proves the bytes really are
    an image (an attacker can rename anything ``.jpg``), and it drops EXIF —
    which on a phone photo carries the GPS coordinates of the vivero.
    """
    if not data:
        raise ImageValidationError("empty_file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise ImageValidationError("file_too_large")

    try:
        image = Image.open(BytesIO(data))
        image.verify()  # cheap structural check; consumes the file object
        image = Image.open(BytesIO(data))
    except (UnidentifiedImageError, OSError) as error:
        raise ImageValidationError("not_an_image") from error

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    ensure_upload_dir()
    filename = f"{uuid.uuid4().hex}.jpg"
    image.save(UPLOAD_DIR / filename, format="JPEG", quality=JPEG_QUALITY, optimize=True)

    return f"{PUBLIC_PREFIX}/{filename}"


def delete_image(public_path: Optional[str]) -> None:
    """Remove a previously stored image. External URLs (seed data) are ignored."""
    if not public_path or not public_path.startswith(f"{PUBLIC_PREFIX}/"):
        return

    filename = Path(public_path).name
    # Guard against a stored path trying to escape the upload directory.
    target = (UPLOAD_DIR / filename).resolve()
    if UPLOAD_DIR.resolve() not in target.parents:
        return

    try:
        target.unlink(missing_ok=True)
    except OSError:
        # A missing or locked file should never break the vendor's save.
        pass
