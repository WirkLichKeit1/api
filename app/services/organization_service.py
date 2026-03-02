from app.models.organization import Organization
from app.repositories.organization_repository import OrganizationRepository

org_repo = OrganizationRepository()

class OrganizationService:
    @staticmethod
    def create(data:dict) -> Organization:
        existing = org_repo.get_by_name(data["name"])
        if existing:
            raise ValueError("Organization name already taken")

        org = Organization(name=data["name"])
        return org_repo.save(org)

    @staticmethod
    def get_one(id:int) -> Organization:
        org = org_repo.get_by_id(id)
        if not org:
            raise ValueError("Organization not found")
        return org

    @staticmethod
    def update(id:int, data:dict) -> Organization:
        org = OrganizationService.get_one(id)

        if data.get("name"):
            existing = org_repo.get_by_name(data["name"])
            if existing and existing.id != id:
                raise ValueError("Organization name already taken")
            org.name = data["name"]

        return org_repo.save(org)

    @staticmethod
    def delete(id:int) -> None:
        org = OrganizationService.get_one(id)
        org_repo.delete(org)