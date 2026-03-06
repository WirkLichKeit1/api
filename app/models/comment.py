from app.extensions import db
from .base import BaseModel

class Comment(BaseModel):
    __tablename__ = "comments"

    content = db.Column(db.Text, nullable=False)

    task_id = db.Column(
        db.Integer,
        db.ForeignKey("tasks.id"),
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    task = db.relationship("Task", back_populates="comments")