from app.extensions import db
from .base import BaseModel

class Task(BaseModel):
    __tablename__ = "tasks"

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default="todo")
    priority = db.Column(db.String(50), default="medium")
    deadline = db.Column(db.DateTime)
    deleted_at = db.Column(db.DateTime, nullable=True)

    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id"),
        nullable=False
    )

    assigned_to = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    project = db.relationship("Project", back_populates="tasks")
    assigned_user = db.relationship("User", back_populates="tasks")
    comments = db.relationship("Comment", back_populates="task")