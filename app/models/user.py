from app.extensions import db
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default="member")

    organization_id = db.Column(
        db.Integer,
        db.ForeignKey("organizations.id"),
        nullable=False
    )

    organization = db.relationship("Organization", back_populates="users")
    tasks = db.relationship("Task", back_populates="assigned_user")