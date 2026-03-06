from app.extensions import db
from .base import BaseModel

class Organization(BaseModel):
    __tablename__ = "organizations"

    name = db.Column(db.String(120), nullable=False, unique=True)

    users = db.relationship("User", back_populates="organization")
    projects = db.relationship("Project", back_populates="organization")