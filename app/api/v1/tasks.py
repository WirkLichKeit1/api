from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from app.utils.serializer import serialize_pagination
from app.middlewares.auth_middleware import auth_required
from app.services.task_service import TaskService
from app.schemas.task_schema import (
    TaskCreateSchema,
    TaskUpdateSchema,
    TaskResponseSchema,
    TaskFilterSchema
)

tasks_bp = Blueprint("tasks", __name__)

@tasks_bp.post("/projects/<int:project_id>/tasks")
@auth_required()
def create_task(project_id):
    try:
        data = TaskCreateSchema(**request.json)
        task = TaskService.create(
            data.model_dump(),
            project_id,
            g.current_user.organization_id
        )
        return jsonify(TaskResponseSchema.model_validate(task).model_dump()), 201
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@tasks_bp.get("/projects/<int:project_id>/tasks")
@auth_required()
def get_all_tasks(project_id):
    try:
        filters = TaskFilterSchema(**request.args).model_dump(exclude_none=True)
        pagination = TaskService.get_all(
            project_id,
            g.current_user.organization_id,
            filters
        )
        return jsonify(serialize_pagination(pagination, TaskResponseSchema))
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@tasks_bp.get("/projects/<int:project_id>/tasks/<int:id>")
@auth_required()
def get_task(project_id, id):
    try:
        task = TaskService.get_one(
            id,
            project_id,
            g.current_user.organization_id
        )
        return jsonify(TaskResponseSchema.model_validate(task).model_dump())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@tasks_bp.patch("/projects/<int:project_id>/tasks/<int:id>")
@auth_required()
def update_task(project_id, id):
    try:
        data = TaskUpdateSchema(**request.json)
        task = TaskService.update(
            id,
            data.model_dump(exclude_none=True),
            project_id,
            g.current_user.organization_id
        )
        return jsonify(TaskResponseSchema.model_validate(task).model_dump())
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@tasks_bp.delete("/projects/<int:project_id>/tasks/<int:id>")
@auth_required()
def delete_task(project_id, id):
    try:
        TaskService.delete(id, project_id, g.current_user.organization_id)
        return jsonify({"message": "Task deleted"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 404