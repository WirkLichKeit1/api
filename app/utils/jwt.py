import jwt
import uuid
from datetime import datetime, timedelta
from flask import current_app

def _build_token(user_id: int, token_type: str, expires_in: timedelta) -> tuple[str, str, datetime]:
    jti = str(uuid.uuid4())
    expires_at = datetime.utcnow() + expires_in

    payload = {
        "sub": str(user_id),
        "jti": jti,
        "type": token_type,
        "exp": expires_at,
        "iat": datetime.utcnow()
    }

    token = jwt.encode(
        payload,
        current_app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    if isinstance(token, bytes):
        token = token.decode("utf-8")
    
    return token, jti, expires_at

def generate_access_token(user_id: int) -> tuple[str, str, datetime]:
    return _build_token(user_id, "access", timedelta(minutes=15))

def generate_refresh_token(user_id: int) -> tuple[str, str, datetime]:
    return _build_token(user_id, "refresh", timedelta(days=7))

def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        current_app.config["SECRET_KEY"],
        algorithms=["HS256"]
    )