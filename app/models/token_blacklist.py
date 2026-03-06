from app.extensions import db
from .base import BaseModel

class TokenBlackList(BaseModel):
    __tablename__ = "token_blacklist"

    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)