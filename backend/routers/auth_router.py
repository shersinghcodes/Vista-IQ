from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
import bcrypt
from backend.models import User
from backend.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    RefreshRequest,
    AccessTokenResponse,
)
from backend.auth.jwt_handler import (
    create_token_pair,
    create_access_token,
    verify_refresh_token,
    blacklist_refresh_token,
)
from backend.auth.oauth_google import get_google_auth_url, exchange_code_for_user_info
from backend.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ─── Email / Password ─────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    """Register a new user with email and password."""
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=payload.email,
        name=payload.name or payload.email.split("@")[0],
        hashed_password=hash_password(payload.password),
    )
    await user.insert()

    return create_token_pair(str(user.id))


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    """Login with email and password."""
    user = await User.find_one(User.email == payload.email)
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return create_token_pair(str(user.id))


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_token(payload: RefreshRequest):
    """Issue a new access token using a valid refresh token."""
    user_id = verify_refresh_token(payload.refresh_token)
    return {
        "access_token": create_access_token(user_id),
        "token_type": "bearer",
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest):
    """Revoke a refresh token (logout)."""
    blacklist_refresh_token(payload.refresh_token)


# ─── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google/status", tags=["Authentication"])
def google_status():
    """
    Diagnostic endpoint — check if Google OAuth is configured.
    Returns whether CLIENT_ID and CLIENT_SECRET are set in the environment.
    """
    has_id     = bool(settings.GOOGLE_CLIENT_ID and "your-google" not in settings.GOOGLE_CLIENT_ID)
    has_secret = bool(settings.GOOGLE_CLIENT_SECRET and "your-google" not in settings.GOOGLE_CLIENT_SECRET)
    configured = has_id and has_secret

    return {
        "configured": configured,
        "client_id_set": has_id,
        "client_secret_set": has_secret,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "message": (
            "Google OAuth is ready ✅"
            if configured
            else "❌ Google OAuth not configured — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env"
        ),
        "setup_guide": "https://console.cloud.google.com/apis/credentials",
    }


@router.get("/google")
def google_login():
    """Redirect the user to Google's OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID or "your-google" in settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env and restart the server.",
        )
    redirect_url = get_google_auth_url()
    return RedirectResponse(url=redirect_url)


@router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback, create/login user, redirect to frontend."""
    google_user = await exchange_code_for_user_info(code)

    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name")
    picture = google_user.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Google did not return an email")

    # Find by google_id first, then fall back to email
    user = await User.find_one(User.google_id == google_id)
    if not user:
        user = await User.find_one(User.email == email)

    if user:
        # Update Google info if this is their first OAuth login
        user.google_id = google_id
        user.avatar_url = picture or user.avatar_url
        user.name = name or user.name
        await user.save()
    else:
        # Create a new OAuth-only account
        user = User(
            email=email,
            name=name,
            avatar_url=picture,
            google_id=google_id,
        )
        await user.insert()

    tokens = create_token_pair(str(user.id))

    # Redirect to frontend dashboard with tokens as query params
    frontend_url = settings.FRONTEND_URL.rstrip('/')
    redirect = (
        f"{frontend_url}/dashboard"
        f"?access_token={tokens['access_token']}"
        f"&refresh_token={tokens['refresh_token']}"
    )
    return RedirectResponse(url=redirect)
