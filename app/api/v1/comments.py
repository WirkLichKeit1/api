from flask import jsonify, g
from flask_openapi3.blueprint import APIBlueprint
from flask_openapi3.models.tag import Tag
from app.middlewares.auth_middleware import auth_required
from app.services.comment_service import CommentService
from app.schemas.comment_schema import (
    CommentCreateSchema,
    CommentResponseSchema
)
from app.schemas.path_schema import TaskPath, CommentPath

comments_tag = Tag(name="Comments", description="Comentários em tarefas")
comments_bp = APIBlueprint("comments", __name__, abp_tags=[comments_tag])

@comments_bp.post("/projects/<int:project_id>/tasks/<int:task_id>/comments",
    summary="Criar comentário",
    responses={"201": CommentResponseSchema, "400": None}
)
@auth_required()
def create_comment(path: TaskPath, body: CommentCreateSchema):
    try:
        comment = CommentService.create(body.content, path.task_id, path.project_id, g.current_user.id)
        return jsonify(CommentResponseSchema.model_validate(comment).model_dump()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@comments_bp.get("/projects/<int:project_id>/tasks/<int:task_id>/comments",
    summary="Listar comentários",
    responses={"200": CommentResponseSchema, "404": None}
)
@auth_required()
def get_all_comments(path: TaskPath):
    try:
        comments = CommentService.get_all(path.task_id, path.project_id)
        return jsonify([CommentResponseSchema.model_validate(c).model_dump() for c in comments])
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@comments_bp.delete("/projects/<int:project_id>/tasks/<int:task_id>/comments/<int:id>",
    summary="Deletar comentário",
    responses={"200": None, "403": None, "404": None}
)
@auth_required()
def delete_comment(path: CommentPath):
    try:
        CommentService.delete(path.id, path.task_id, path.project_id, g.current_user.id)
        return jsonify({"message": "Comment deleted"}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404