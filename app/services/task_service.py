from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.repositories.project_repository import ProjectRepository

task_repo = TaskRepository()
project_repo = ProjectRepository()

class TaskService:
    @staticmethod
    def _get_project_or_raise(project_id: int, organization_id: int):
        project = project_repo.get_by_id_and_organization(project_id, organization_id)
        if not project:
            raise ValueError("Project not found")
        return project

    @staticmethod
    def create(data: dict, project_id: int, organization_id: int) -> Task:
        TaskService._get_project_or_raise(
            project_id, organization_id
        )
        task = Task(project_id=project_id, **data)
        return task_repo.save(task)

    @staticmethod
    def get_all(project_id: int, organization_id: int, filters: dict):
        TaskService._get_project_or_raise(
            project_id,
            organization_id
        )
        return task_repo.get_all_by_project(project_id=project_id, **filters)

    @staticmethod
    def get_one(id: int, project_id: int, organization_id: int) -> Task:
        TaskService._get_project_or_raise(
            project_id,
            organization_id
        )

        task = task_repo.get_by_id_and_project(id, project_id)
        if not task:
            raise ValueError("Task not found")
        return task

    @staticmethod
    def update(id: int, data: dict, project_id: int, organization_id: int) -> Task:
        task = TaskService.get_one(id, project_id, organization_id)

        for field, value in data.items():
            setattr(task, field, value)
        
        return task_repo.save(task)

    @staticmethod
    def delete(id: int, project_id: int, organization_id: int) -> None:
        task = TaskService.get_one(id, project_id, organization_id)
        task_repo.soft_delete(task)