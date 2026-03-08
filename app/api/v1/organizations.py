from flask import jsonify, g
from flask_openapi3.blueprint import APIBlueprint
from flask_openapi3.models.tag import Tag
from pydantic import ValidationError
from app.middlewares.auth_middleware import auth_required
from app.services.organization_service import OrganizationService
from app.schemas.organization_schema import (
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
    OrganizationResponseSchema,
    MemberResponseSchema
)
from app.schemas.path_schema import IdPath

org_tag = Tag(name="Organizations", description="Gerenciamento de organizações")
org_bp = APIBlueprint("organizations", __name__, abp_tags=[org_tag])

@org_bp.post("/organizations",
    summary="Criar organização",
    responses={"201": OrganizationResponseSchema, "400": None}
)
@auth_required(require_org=False)
def create_organization(body: OrganizationCreateSchema):
    try:
        org = OrganizationService.create(body.model_dump(), g.current_user)
        return jsonify(OrganizationResponseSchema.model_validate(org).model_dump()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@org_bp.post("/organizations/<int:id>/join",
    summary="Entrar em uma organização",
    responses={"200": OrganizationResponseSchema, "400": None}
)
@auth_required(require_org=False)
def join_organization(path: IdPath):
    try:
        if g.current_user.organization_id:
            return jsonify({"error": "You already belong to an organization"}), 400
        org = OrganizationService.join(path.id, g.current_user)
        return jsonify(OrganizationResponseSchema.model_validate(org).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@org_bp.get("/organizations/<int:id>",
    summary="Buscar organização",
    responses={"200": OrganizationResponseSchema, "403": None, "404": None}
)
@auth_required()
def get_organization(path: IdPath):
    try:
        if g.current_user.organization_id != path.id:
            return jsonify({"error": "Forbidden"}), 403
        org = OrganizationService.get_one(path.id)
        return jsonify(OrganizationResponseSchema.model_validate(org).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@org_bp.get("/organizations/<int:id>/members",
    summary="Listar membros da organização",
    responses={"200": MemberResponseSchema, "403": None, "404": None}
)
@auth_required()
def get_organizations_members(path: IdPath):
    try:
        if g.current_user.organization_id != path.id:
            return jsonify({"error": "Forbidden"}), 403
        members = OrganizationService.get_members(path.id)
        return jsonify([MemberResponseSchema.model_validate(m).model_dump() for m in members])
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@org_bp.patch("/organizations/<int:id>",
    summary="Atualizar organização",
    responses={"200": OrganizationResponseSchema, "403": None, "404": None}
)
@auth_required(role="admin")
def update_organization(path: IdPath, body: OrganizationUpdateSchema):
    try:
        if g.current_user.organization_id != path.id:
            return jsonify({"error": "Forbidden"}), 403
        org = OrganizationService.update(path.id, body.model_dump(exclude_none=True))
        return jsonify(OrganizationResponseSchema.model_validate(org).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@org_bp.delete("/organizations/<int:id>",
    summary="Deletar organização",
    responses={"200": None, "403": None, "404": None}
)
@auth_required(role="admin")
def delete_organization(path: IdPath):
    try:
        if g.current_user.organization_id != path.id:
            return jsonify({"error": "Forbidden"}), 403
        OrganizationService.delete(path.id)
        return jsonify({"message": "Organization deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404