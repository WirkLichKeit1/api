from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ProjectCreateSchema(BaseModel):
    name: str = Field(min_length=3, max_length=120)

class ProjectUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=120)

class ProjectResponseSchema(BaseModel):
    id: int
    name: str
    organization_id: int
    created_at: datetime

    model_config = {"from_attributes":True}