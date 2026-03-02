from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TaskCreateSchema(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    assigned_to: Optional[int] = None
    deadline: Optional[datetime] = None

class TaskUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    deadline: Optional[datetime] = None

class TaskResponseSchema(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    assigned_to: Optional[int]
    project_id: int
    deadline: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes":True}

class TaskFilterSchema(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    page: int = 1
    per_page: int = 10