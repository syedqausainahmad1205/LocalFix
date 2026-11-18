from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import bcrypt
from jose import jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a stored bcrypt hash."""
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate a secure bcrypt hash for a plain password."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    role: str,
    email: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a signed HMAC-SHA256 JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None


# --- Aadhaar Privacy & Cryptographic Utilities ---
import re
import base64
import hashlib
from cryptography.fernet import Fernet


def _get_fernet() -> Fernet:
    """Generate a deterministic 32-byte URL-safe base64 key from settings.SECRET_KEY."""
    derived_key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest())
    return Fernet(derived_key)


def validate_aadhaar_format(aadhaar: str) -> bool:
    """
    Validate Indian Aadhaar number format:
    Must be exactly 12 numeric digits; first digit cannot be 0 or 1 (UIDAI standard).
    """
    if not aadhaar:
        return False
    clean = re.sub(r"[\s\-]", "", str(aadhaar).strip())
    return bool(re.match(r"^[2-9]\d{11}$", clean))


def encrypt_aadhaar(aadhaar: str) -> str:
    """Encrypt a valid Aadhaar number using AES-128-CBC / HMAC (Fernet) for secure storage at rest."""
    clean = re.sub(r"[\s\-]", "", str(aadhaar).strip())
    fernet = _get_fernet()
    encrypted_bytes = fernet.encrypt(clean.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt_aadhaar(encrypted_token: str) -> str:
    """Decrypt an encrypted Aadhaar number for authorized administrator verification."""
    if not encrypted_token:
        return ""
    try:
        fernet = _get_fernet()
        decrypted_bytes = fernet.decrypt(encrypted_token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception:
        return ""


def mask_aadhaar(aadhaar: Optional[str]) -> str:
    """Return a masked representation (e.g. XXXX-XXXX-1234) to prevent unauthorized exposure."""
    if not aadhaar:
        return "XXXX-XXXX-XXXX"
    clean = re.sub(r"[\s\-]", "", str(aadhaar).strip())
    if len(clean) >= 4:
        return f"XXXX-XXXX-{clean[-4:]}"
    return "XXXX-XXXX-XXXX"

