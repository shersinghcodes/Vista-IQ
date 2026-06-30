from datetime import datetime, timedelta
from email.message import EmailMessage
import secrets
import smtplib

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
    ForgotPasswordRequest,
    ResetPasswordRequest,
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


def generate_auth_token() -> str:
    return secrets.token_urlsafe(32)


def send_auth_email(to_email: str, subject: str, body: str) -> None:
    if not all([settings.MAIL_SERVER, settings.MAIL_PORT, settings.MAIL_FROM]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email service is not configured",
        )

    message = EmailMessage()
    message["From"] = settings.MAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            if settings.MAIL_USE_TLS:
                server.starttls()
            if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
                server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email",
        ) from exc


def build_frontend_link(path: str, token: str) -> str:
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    return f"{frontend_url}{path}?token={token}"


# ─── Email / Password ─────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    """Register a new user with email and password."""
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    verification_token = generate_auth_token()
    user = User(
        email=payload.email,
        name=payload.name or payload.email.split("@")[0],
        hashed_password=hash_password(payload.password),
        is_verified=False,
        verification_token=verification_token,
        verification_expiry=datetime.utcnow() + timedelta(hours=24),
    )
    await user.insert()

    verification_link = build_frontend_link("/verify-email", verification_token)
    try:
        send_auth_email(
            payload.email,
            "Verify your Vista-IQ account",
            f"Verify your Vista-IQ account by opening this link:\n\n{verification_link}\n\nThis link expires in 24 hours.",
        )
    except HTTPException:
        await user.delete()
        raise

    return {"message": "Verification email sent."}


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
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
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


@router.get("/verify-email")
async def verify_email(token: str):
    user = await User.find_one(User.verification_token == token)
    if user and user.is_verified:
        return {"message": "Email already verified."}
    if not user or not user.verification_expiry or user.verification_expiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link",
        )

    user.is_verified = True
    user.verification_expiry = None
    user.updated_at = datetime.utcnow()
    await user.save()

    return {"message": "Email verified successfully."}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    user = await User.find_one(User.email == payload.email)
    if user and user.hashed_password:
        reset_token = generate_auth_token()
        user.reset_token = reset_token
        user.reset_expiry = datetime.utcnow() + timedelta(minutes=30)
        user.updated_at = datetime.utcnow()
        await user.save()

        reset_link = build_frontend_link("/reset-password", reset_token)
        try:
            send_auth_email(
                payload.email,
                "Reset your Vista-IQ password",
                f"Reset your Vista-IQ password by opening this link:\n\n{reset_link}\n\nThis link expires in 30 minutes.",
            )
        except HTTPException:
            user.reset_token = None
            user.reset_expiry = None
            user.updated_at = datetime.utcnow()
            await user.save()
            raise

    return {"message": "If an account exists, a password reset email has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    user = await User.find_one(User.reset_token == payload.token)
    if not user or not user.reset_expiry or user.reset_expiry < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link",
        )

    user.hashed_password = hash_password(payload.password)
    user.reset_token = None
    user.reset_expiry = None
    user.updated_at = datetime.utcnow()
    await user.save()

    return {"message": "Password updated successfully."}


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
        user.is_verified = True
        user.verification_token = None
        user.verification_expiry = None
        await user.save()
    else:
        # Create a new OAuth-only account
        user = User(
            email=email,
            name=name,
            avatar_url=picture,
            google_id=google_id,
            is_verified=True,
        )
        await user.insert()

    tokens = create_token_pair(str(user.id))

    # Redirect to frontend job market with tokens as query params
    frontend_url = settings.FRONTEND_URL.rstrip('/')
    redirect = (
        f"{frontend_url}/job-market"
        f"?access_token={tokens['access_token']}"
        f"&refresh_token={tokens['refresh_token']}"
    )
    return RedirectResponse(url=redirect)
