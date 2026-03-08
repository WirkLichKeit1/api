from app.models.organization import Organization
from .base_repository import BaseRepository

class OrganizationRepository(BaseRepository):
    def __init__(self):
        super().__init__(Organization)

    def get_by_name(self, name:str):
        return self.model.query.filter_by(name=name).first()