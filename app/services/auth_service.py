from app.models.user import User
from app.extensions import db
from app.utils.security import hash_password, verify_password
from app.utils.jwt import generate_access_token

class AuthService:
    @staticmethod
    def register(data):
        existing = User.query.filter_by(email=data["email"]).first()
        if existing:
            raise ValueError("Email already registered")

        user = User(
            name=data["name"],
            email=data["email"],
            password_hash=hash_password(data["password"]),
            organization_id=data["organization_id"]
        )
        db.session.add(user)
        db.session.commit()
        
        return user

    @staticmethod
    def login(data):
        user = User.query.filter_by(email=data["email"]).first()
        if not user or not verify_password(user.password_hash, data["password"]):
            raise ValueError("Invalid credentials")

        token = generate_access_token(user.id)

        return {"access_token": token}