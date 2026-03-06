from datetime import datetime
from app.extensions import db
from app.models.token_blacklist import TokenBlackList
from .base_repository import BaseRepository

class TokenRepository(BaseRepository):
    def __init__(self):
        super().__init__(TokenBlackList)

    def add_to_blacklist(self, jti: str, expires_at: datetime) -> TokenBlackList:
        entry = TokenBlackList(jti=jti, expires_at=expires_at)
        return self.save(entry)

    def is_blacklisted(self, jti: str) -> bool:
        return self.model.query.filter_by(jti=jti).first() is not None

    def delete_expired(self) -> None:
        self.model.query.filter(
            TokenBlackList.expires_at < datetime.utcnow()
        ).delete()
        db.session.commit()