from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CommentCreateSchema(BaseModel):
    content: str = Field(min_length=1)

class CommentUpdateSchema(BaseModel):
    content: Optional[str] = Field(None, min_length=1)

class CommentResponseSchema(BaseModel):
    id: int
    content: str
    task_id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes":True}