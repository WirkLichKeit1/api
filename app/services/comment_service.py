from app.models.comment import Comment
from app.repositories.comment_repository import CommentRepository
from app.repositories.task_repository import TaskRepository

comment_repo = CommentRepository()
task_repo = TaskRepository()

class CommentService:
    @staticmethod
    def _get_task_or_raise(task_id: int, project_id: int):
        task = task_repo.get_by_id_and_project(task_id, project_id)
        if not task:
            raise ValueError("Task not found")
        return task

    @staticmethod
    def create(content: str, task_id: int, project_id: int, user_id: int) -> Comment:
        CommentService._get_task_or_raise(task_id, project_id)

        comment = Comment(content=content, task_id=task_id, user_id=user_id)
        return comment_repo.save(comment)

    @staticmethod
    def get_all(task_id: int, project_id: int) -> list[Comment]:
        CommentService._get_task_or_raise(task_id, project_id)
        return comment_repo.get_all_by_task(task_id)

    @staticmethod
    def delete(id: int, task_id: int, project_id: int, user_id: int) -> None:
        comment = comment_repo.get_by_id_and_task(id, task_id)
        if not comment:
            raise ValueError("Comment not found")
        if comment.user_id != user_id:
            raise ValueError("Cannot delete another user's comment")

        comment_repo.delete(comment)