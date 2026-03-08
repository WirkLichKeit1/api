from app.models.organization import Organization
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.user_repository import UserRepository

org_repo = OrganizationRepository()
user_repo = UserRepository()

class OrganizationService:
    @staticmethod
    def create(data: dict, user: User) -> Organization:
        existing = org_repo.get_by_name(data["name"])
        if existing:
            raise ValueError("Organization name already taken")

        org = Organization(name=data["name"])
        org_repo.flush(org)

        user.organization_id = org.id
        user.role = "admin"
        org_repo.save_all(org, user)

        return org

    @staticmethod
    def join(id: int, user: User) -> Organization:
        org = OrganizationService.get_one(id)
        user.organization_id = org.id
        user_repo.save(user)
        return org

    @staticmethod
    def get_one(id: int) -> Organization:
        org = org_repo.get_by_id(id)
        if not org:
            raise ValueError("Organization not found")
        return org

    @staticmethod
    def get_members(id: int) -> list:
        OrganizationService.get_one(id)
        return org_repo.get_members(organization_id=id)

    @staticmethod
    def update(id: int, data: dict) -> Organization:
        org = OrganizationService.get_one(id)

        if data.get("name"):
            existing = org_repo.get_by_name(data["name"])
            if existing and existing.id != id:
                raise ValueError("Organization name already taken")
            org.name = data["name"]

        return org_repo.save(org)

    @staticmethod
    def delete(id: int) -> None:
        org = OrganizationService.get_one(id)
        org_repo.delete(org)