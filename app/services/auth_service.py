import jwt as pyjwt
from datetime import datetime
from app.models.user import User
from app.utils.security import hash_password, verify_password
from app.repositories.user_repository import UserRepository
from .token_service import TokenService
from app.utils.jwt import (
    generate_access_token,
    generate_refresh_token,
    decode_token
)

repo = UserRepository()

class AuthService:
    @staticmethod
    def register(data: dict) -> User:
        existing = repo.get_by_email(data["email"])
        if existing:
            raise ValueError("Email already registered")

        user = User(
            name=data["name"],
            email=data["email"],
            password_hash=hash_password(data["password"])
        )
        
        return repo.save(user)

    @staticmethod
    def login(data: dict) -> dict:
        user = repo.get_by_email(data["email"])
        if not user or not verify_password(user.password_hash, data["password"]):
            raise ValueError("Invalid credentials")

        access_token, _, _ = generate_access_token(user.id)
        refresh_token, _, _ = generate_refresh_token(user.id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def refresh(refresh_token: str) -> dict:   
        try:
            payload = decode_token(refresh_token)
        except pyjwt.ExpiredSignatureError:
            raise ValueError("Refresh token expired")
        except pyjwt.InvalidTokenError:
            raise ValueError("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        
        if TokenService.is_blacklisted(payload["jti"]):
            raise ValueError("Refresh token already used or revoked")

        expires_at = datetime.utcfromtimestamp(payload["exp"])
        TokenService.blacklist(payload["jti"], expires_at)

        user_id = int(payload["sub"])
        access_token, _, _ = generate_access_token(user_id)
        refresh_token, _, _ = generate_refresh_token(user_id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def logout(refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token)
        except pyjwt.ExpiredSignatureError:
            return
        except pyjwt.InvalidTokenError:
            raise ValueError("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        
        expires_at = datetime.utcfromtimestamp(payload["exp"])
        TokenService.blacklist(payload["jti"], expires_at)