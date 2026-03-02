from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from app.middlewares.auth_middleware import auth_required
from app.services.comment_service import CommentService
from app.schemas.comment_schema import (
    CommentCreateSchema,
    CommentResponseSchema
)

comments_bp = Blueprint("comments", __name__)

@comments_bp.post("/projects/<int:project_id>/tasks/<int:task_id>/comments")
@auth_required()
def create_comment(project_id, task_id):
    try:
        data = CommentCreateSchema(**request.json)
        comment = CommentService.create(
            data.content,
            task_id,
            project_id,
            g.current_user.id
        )
        return jsonify(CommentResponseSchema.model_validate(comment).model_dump()), 201
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@comments_bp.get("/projects/<int:project_id>/tasks/<int:task_id>/comments")
@auth_required()
def get_all_comments(project_id, task_id):
    try:
        comments = CommentService.get_all(task_id, project_id)
        return jsonify([
            CommentResponseSchema.model_validate(c).model_dump() for c in comments
        ])
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@comments_bp.delete("/projects/<int:project_id>/tasks/<int:task_id>/comments/<int:id>")
@auth_required()
def delete_comment(project_id, task_id, id):
    try:
        CommentService.delete(id, task_id, project_id, g.current_user.id)
        return jsonify({"message": "Comment deleted"}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404