from flask import jsonify, g
from flask_openapi3.blueprint import APIBlueprint
from flask_openapi3.models.tag import Tag
from app.utils.serializer import serialize_pagination
from app.middlewares.auth_middleware import auth_required
from app.services.task_service import TaskService
from app.schemas.task_schema import (
    TaskCreateSchema,
    TaskUpdateSchema,
    TaskResponseSchema,
    TaskFilterSchema
)
from app.schemas.path_schema import ProjectPath, TaskPath

tasks_tag = Tag(name="Tasks", description="Gerenciamento de tarefas")
tasks_bp = APIBlueprint("tasks", __name__, abp_tags=[tasks_tag])

@tasks_bp.post("/projects/<int:project_id>/tasks",
    summary="Criar tarefa",
    responses={"201": TaskResponseSchema, "400": None}
)
@auth_required()
def create_task(path: ProjectPath, body: TaskCreateSchema):
    try:
        task = TaskService.create(body.model_dump(), path.project_id, g.current_user.organization_id)
        return jsonify(TaskResponseSchema.model_validate(task).model_dump()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@tasks_bp.get("/projects/<int:project_id>/tasks",
    summary="Listar tarefas",
    responses={"200": TaskResponseSchema, "404": None}
)
@auth_required()
def get_all_tasks(path: ProjectPath, query: TaskFilterSchema):
    try:
        filters = query.model_dump(exclude_none=True)
        pagination = TaskService.get_all(path.project_id, g.current_user.organization_id, filters)
        return jsonify(serialize_pagination(pagination, TaskResponseSchema))
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@tasks_bp.get("/projects/<int:project_id>/tasks/<int:task_id>",
    summary="Buscar tarefa",
    responses={"200": TaskResponseSchema, "404": None}
)
@auth_required()
def get_task(path: TaskPath):
    try:
        task = TaskService.get_one(path.task_id, path.project_id, g.current_user.organization_id)
        return jsonify(TaskResponseSchema.model_validate(task).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@tasks_bp.patch("/projects/<int:project_id>/tasks/<int:task_id>",
    summary="Atualizar tarefa",
    responses={"200": TaskResponseSchema, "404": None}
)
@auth_required()
def update_task(path: TaskPath, body: TaskUpdateSchema):
    try:
        task = TaskService.update(path.task_id, body.model_dump(exclude_none=True), path.project_id, g.current_user.organization_id)
        return jsonify(TaskResponseSchema.model_validate(task).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@tasks_bp.delete("/projects/<int:project_id>/tasks/<int:task_id>",
    summary="Deletar tarefa",
    responses={"200": None, "404": None}
)
@auth_required()
def delete_task(path: TaskPath):
    try:
        TaskService.delete(path.task_id, path.project_id, g.current_user.organization_id)
        return jsonify({"message": "Task deleted"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 404