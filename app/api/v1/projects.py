from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from app.middlewares.auth_middleware import auth_required
from app.services.project_service import ProjectService
from app.schemas.project_schema import (
    ProjectCreateSchema,
    ProjectUpdateSchema,
    ProjectResponseSchema
)

projects_bp = Blueprint("projects", __name__)

@projects_bp.post("/projects")
@auth_required()
def create_project():
    try:
        data = ProjectCreateSchema(**request.json)
        project= ProjectService.create(
            data.model_dump(),
            g.current_user.organization_id
        )
        return jsonify(ProjectResponseSchema.model_validate(project).model_dump()), 201
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@projects_bp.get("/projects")
@auth_required()
def get_all_projects():
    projects = ProjectService.get_all(g.current_user.organization_id)
    return jsonify([
        ProjectResponseSchema.model_validate(p).model_dump() for p in projects
    ])

@projects_bp.get("/projects/<int:id>")
@auth_required()
def get_project(id):
    try:
        project = ProjectService.get_one(
            id,
            g.current_user.organization_id
        )
        return jsonify(
            ProjectResponseSchema
                .model_validate(project)
                .model_dump()
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@projects_bp.patch("/projects/<int:id>")
@auth_required()
def update_project(id):
    try:
        data = ProjectUpdateSchema(**request.json)
        project = ProjectService.update(
            id,
            data.model_dump(exclude_none=True),
            g.current_user.organization_id
        )
        return jsonify(ProjectResponseSchema.model_validate(project).model_dump())
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@projects_bp.delete("/projects/<int:id>")
@auth_required()
def delete_project(id):
    try:
        ProjectService.delete(id, g.current_user.organization_id)
        return jsonify({"message": "Project deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404