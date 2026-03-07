from flask import jsonify
from flask_openapi3.blueprint import APIBlueprint
from flask_openapi3.models.tag import Tag
from pydantic import ValidationError
from app.schemas.auth_schema import (
    RegisterSchema,
    LoginSchema,
    RefreshSchema,
    LogoutSchema,
    LoginResponseSchema,
    RegisterResponseSchema
)
from app.services.auth_service import AuthService

auth_tag = Tag(name="Auth", description="Registro, Login e gerenciamento de tokens")
auth_bp = APIBlueprint("auth", __name__, abp_tags=[auth_tag])

@auth_bp.post("/register",
    summary="Registrar usuário",
    responses={"201": RegisterResponseSchema, "400": None}
)
def register(body: RegisterSchema):
    try:
        user = AuthService.register(body.model_dump())
        return jsonify({
            "id": user.id,
            "email": user.email,
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.post("/login",
    summary="Login",
    responses={"200": LoginResponseSchema, "400": None}
)
def login(body: LoginSchema):
    try:
        result = AuthService.login(body.model_dump())
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.post("/refresh",
    summary="Renovar tokens",
    responses={"200": LoginResponseSchema, "401": None}
)
def refresh(body: RefreshSchema):
    try:
        result = AuthService.refresh(body.refresh_token)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

@auth_bp.post("/logout",
    summary="Logout",
    responses={"200": None, "400": None}
)
def logout(body: LogoutSchema):
    try:
        AuthService.logout(body.refresh_token)
        return jsonify({"message": "Logged out successfully"})
    except ValueError as e:
        return jsonify({"error": str(e)})