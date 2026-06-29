from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status
from backend.config import get_settings

settings = get_settings()

# Simple in-memory blacklist for revoked refresh tokens
# In production, use Redis or a DB table
_blacklisted_refresh_tokens: set[str] = set()


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Token Creation ────────────────────────────────────────────────────────────

def create_access_token(subject: str | int) -> str:
    """Create a short-lived access JWT (default 15 min)."""
    expire = _now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": _now(),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str | int) -> str:
    """Create a long-lived refresh JWT (default 7 days)."""
    expire = _now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": _now(),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_token_pair(user_id: int) -> dict:
    """Convenience: returns both tokens as a dict."""
    return {
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "token_type": "bearer",
    }


# ─── Token Verification ────────────────────────────────────────────────────────

def _decode(token: str, expected_type: str) -> dict:
    """Decode and validate a JWT, checking the `type` claim."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise credentials_exception

    if payload.get("type") != expected_type:
        raise credentials_exception

    return payload


def verify_access_token(token: str) -> str:
    """Decode access token → returns user_id (str)."""
    payload = _decode(token, "access")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


def verify_refresh_token(token: str) -> str:
    """Decode refresh token → returns user_id (str). Also checks blacklist."""
    if token in _blacklisted_refresh_tokens:
        raise HTTPException(status_code=401, detail="Refresh token has been revoked")
    payload = _decode(token, "refresh")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


# ─── Blacklist ─────────────────────────────────────────────────────────────────

def blacklist_refresh_token(token: str) -> None:
    """Revoke a refresh token (logout)."""
    _blacklisted_refresh_tokens.add(token)
