from app.repositories.token_repository import TokenRepository

repo = TokenRepository()

class TokenService:
    @staticmethod
    def blacklist(jti: str, expires_at) -> None:
        repo.add_to_blacklist(jti, expires_at)

    @staticmethod
    def is_blacklisted(jti: str) -> bool:
        return repo.is_blacklisted(jti)