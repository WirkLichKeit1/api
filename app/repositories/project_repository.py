from app.models.project import Project
from .base_repository import BaseRepository

class ProjectRepository(BaseRepository):
    def __init__(self):
        super().__init__(Project)
    
    def get_all_by_organization(self, organization_id: int):
        return self.model.query.filter_by(
            organization_id=organization_id
        ).all()
    
    def get_by_id_and_organization(self, id: int, organization_id: int):
        return self.model.query.filter_by(
            id=id,
            organization_id=organization_id
        ).first()