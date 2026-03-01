from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from app.schemas.auth_schema import RegisterSchema, LoginSchema
from app.services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():
    try:
        data = RegisterSchema(**request.json)
        user = AuthService.register(data.model_dump())
        return jsonify({
            "id": user.id,
            "email": user.email,
        }), 201
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.post("/login")
def login():
    try:
        data = LoginSchema(**request.json)
        result = AuthService.login(data.model_dump())
        return jsonify(result)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400