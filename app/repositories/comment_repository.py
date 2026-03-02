from app.models.comment import Comment
from .base_repository import BaseRepository

class CommentRepository(BaseRepository):
    def __init__(self):
        super().__init__(Comment)
    
    def get_all_by_task(self, task_id: int):
        return self.model.query.filter_by(task_id=task_id).all()
    
    def get_by_id_and_task(self, id: int, task_id: int):
        return self.model.query.filter_by(id=id, task_id=task_id).first()