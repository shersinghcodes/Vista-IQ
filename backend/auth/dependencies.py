from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.models import User
from backend.auth.jwt_handler import verify_access_token
from beanie import PydanticObjectId

bearer_scheme = HTTPBearer()

_401 = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    """
    FastAPI dependency — validates Bearer token, returns the User model.
    Returns 401 for any token issue (expired, malformed, missing).
    Returns 403 if account is deactivated.
    """
    try:
        token = credentials.credentials
        user_id = verify_access_token(token)
        # Verify the token is a valid PydanticObjectId
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        raise _401

    if not user:
        raise _401                    # Don't reveal whether user exists
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support.",
        )
    return user
