from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class OrganizationCreateSchema(BaseModel):
    name: str = Field(min_length=3, max_length=120)

class OrganizationUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=120)

class OrganizationResponseSchema(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes":True}