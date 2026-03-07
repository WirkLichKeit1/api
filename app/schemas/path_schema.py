from pydantic import BaseModel

class IdPath(BaseModel):
    id: int

class ProjectPath(BaseModel):
    project_id: int

class TaskPath(BaseModel):
    project_id: int
    task_id: int

class CommentPath(BaseModel):
    project_id: int
    task_id: int
    id: int