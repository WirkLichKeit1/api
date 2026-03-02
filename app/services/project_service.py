from app.models.project import Project
from app.repositories.project_repository import ProjectRepository

repo = ProjectRepository()

class ProjectService:
    @staticmethod
    def create(data: dict, organization_id: int) -> Project:
        project = Project(
            name=data["name"],
            organization_id=organization_id
        )
        return repo.save(project)
    
    @staticmethod
    def get_all(organization_id: int) -> list[Project]:
        return repo.get_all_by_organization(organization_id)

    @staticmethod
    def get_one(id: int, organization_id: int) -> Project:
        project = repo.get_by_id_and_organization(id, organization_id)
        if not project:
            raise ValueError("Project not found")
        return project

    @staticmethod
    def update(id: int, data: dict, organization_id: int) -> Project:
        project = ProjectService.get_one(id, organization_id)

        if data.get("name"):
            project.name = data["name"]
        
        return repo.save(project)

    @staticmethod
    def delete(id: int, organization_id: int) -> None:
        project = ProjectService.get_one(id, organization_id)
        repo.delete(project)