from app.extensions import db
from .base import BaseModel

class Project(BaseModel):
    __tablename__ = "projects"

    name = db.Column(db.String(120), nullable=False)

    organization_id = db.Column(
        db.Integer,
        db.ForeignKey("organizations.id"),
        nullable=False
    )

    organization = db.relationship("Organization", back_populates="projects")
    tasks = db.relationship("Task", back_populates="project")