from app.models.task import Task
from .base_repository import BaseRepository
from datetime import datetime

class TaskRepository(BaseRepository):
    def __init__(self):
        super().__init__(Task)
    
    def get_all_by_project(
        self,
        project_id: int,
        status: str = None,
        priority: str = None,
        assigned_to: int = None,
        page: int = 1,
        per_page: int = 10
    ):
        query = self.model.query.filter_by(
            project_id=project_id,
            deleted_at=None
        )
        
        if status:
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        if assigned_to:
            query = query.filter_by(assigned_to=assigned_to)

        return query.paginate(page=page, per_page=per_page, error_out=False)

    def get_by_id_and_project(self, id: int, project_id: int):
        return self.model.query.filter_by(
            id=id,
            project_id=project_id,
            deleted_at=None
        ).first()

    def soft_delete(self, task: Task):
        task.deleted_at = datetime.utcnow()
        return self.save(task)