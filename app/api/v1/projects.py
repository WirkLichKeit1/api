from flask import jsonify, g
from flask_openapi3.blueprint import APIBlueprint
from flask_openapi3.models.tag import Tag
from app.middlewares.auth_middleware import auth_required
from app.services.project_service import ProjectService
from app.schemas.project_schema import (
    ProjectCreateSchema,
    ProjectUpdateSchema,
    ProjectResponseSchema
)
from app.schemas.path_schema import IdPath

projects_tag = Tag(name="Projects", description="Gerenciamento de projetos")
projects_bp = APIBlueprint("projects", __name__, abp_tags=[projects_tag])

@projects_bp.post("/projects",
    summary="Criar projeto",
    responses={"201": ProjectResponseSchema, "400": None}
)
@auth_required()
def create_project(body: ProjectCreateSchema):
    try:
        project = ProjectService.create(body.model_dump(), g.current_user.organization_id)
        return jsonify(ProjectResponseSchema.model_validate(project).model_dump()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@projects_bp.get("/projects",
    summary="Listar projetos",
    responses={"200": ProjectResponseSchema}
)
@auth_required()
def get_all_projects():
    projects = ProjectService.get_all(g.current_user.organization_id)
    return jsonify([ProjectResponseSchema.model_validate(p).model_dump() for p in projects])

@projects_bp.get("/projects/<int:id>",
    summary="Buscar projeto",
    responses={"200": ProjectResponseSchema, "404": None}
)
@auth_required()
def get_project(path: IdPath):
    try:
        project = ProjectService.get_one(path.id, g.current_user.organization_id)
        return jsonify(ProjectResponseSchema.model_validate(project).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@projects_bp.patch("/projects/<int:id>",
    summary="Atualizar projeto",
    responses={"200": ProjectResponseSchema, "404": None}
)
@auth_required()
def update_project(path: IdPath, body: ProjectUpdateSchema):
    try:
        project = ProjectService.update(path.id, body.model_dump(exclude_none=True), g.current_user.organization_id)
        return jsonify(ProjectResponseSchema.model_validate(project).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@projects_bp.delete("/projects/<int:id>",
    summary="Deletar projeto",
    responses={"200": None, "404": None}
)
@auth_required()
def delete_project(path: IdPath):
    try:
        ProjectService.delete(path.id, g.current_user.organization_id)
        return jsonify({"message": "Project deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404