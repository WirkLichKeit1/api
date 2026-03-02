from app.models.user import User
from app.utils.security import hash_password, verify_password
from app.utils.jwt import generate_access_token
from app.repositories.user_repository import UserRepository

repo = UserRepository()

class AuthService:
    @staticmethod
    def register(data):
        existing = repo.get_by_email(data["email"])
        if existing:
            raise ValueError("Email already registered")

        user = User(
            name=data["name"],
            email=data["email"],
            password_hash=hash_password(data["password"]),
            organization_id=data["organization_id"]
        )
        
        return repo.save(user)

    @staticmethod
    def login(data):
        user = repo.get_by_email(data["email"])
        if not user or not verify_password(user.password_hash, data["password"]):
            raise ValueError("Invalid credentials")

        token = generate_access_token(user.id)

        return {"access_token": token}