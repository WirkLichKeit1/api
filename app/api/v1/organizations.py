from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from app.middlewares.auth_middleware import auth_required
from app.services.organization_service import OrganizationService
from app.schemas.organization_schema import (
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
    OrganizationResponseSchema
)

org_bp = Blueprint("organizations", __name__)

@org_bp.post("/organizations")
@auth_required(require_org=False)
def create_organization():
    try:
        data = OrganizationCreateSchema(**request.json)
        org = OrganizationService.create(data.model_dump())
        return jsonify(OrganizationResponseSchema.model_validate(org).model_dump()), 201
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@org_bp.post("/organizations/<int:id>/join")
@auth_required(require_org=False)
def join_organization(id):
    try:
        if g.current_user.organization_id:
            return jsonify({"error": "You already belong to an organization"}), 400
        
        org = OrganizationService.join(id, g.current_user)
        return jsonify(OrganizationResponseSchema.model_validate(org).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@org_bp.get("/organizations/<int:id>")
@auth_required()
def get_organization(id):
    try:
        if g.current_user.organization_id != id:
            return jsonify({"error": "Forbidden"}), 403

        org = OrganizationService.get_one(id)
        return jsonify(OrganizationResponseSchema.model_validate(org).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@org_bp.patch("/organizations/<int:id>")
@auth_required(role="admin")
def update_organization(id):
    try:
        if g.current_user.organization_id != id:
            return jsonify({"error": "Forbidden"}), 403

        data = OrganizationUpdateSchema(**request.json)
        org = OrganizationService.update(id, data.model_dump(exclude_none=True))
        return jsonify(OrganizationResponseSchema.model_validate(org).model_dump())
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@org_bp.delete("/organizations/<int:id>")
@auth_required(role="admin")
def delete_organization(id):
    try:
        if g.current_user.organization_id != id:
            return jsonify({"error": "Forbidden"}), 403

        OrganizationService.delete(id)
        return jsonify({"message": "Organization deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404