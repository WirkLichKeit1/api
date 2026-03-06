import jwt as pyjwt
from functools import wraps
from flask import request, jsonify, g
from app.utils.jwt import decode_token
from app.extensions import db
from app.models.user import User
from app.services.token_service import TokenService

def auth_required(role=None, require_org=True):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization")

            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing token"}), 401

            token = auth_header.split(" ")[1]
            try:
                payload = decode_token(token)
                print("payload:", payload)
            except pyjwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except pyjwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401

            if payload.get("type") != "access":
                return jsonify({"error": "Invalid token type"}), 401

            if TokenService.is_blacklisted(payload["jti"]):
                return jsonify({"error": "Token revoked"}), 401
            
            user = db.session.get(User, int(payload["sub"]))
               
            if not user:
                    return jsonify({"error": "User not found"}), 401
                
            if role and user.role != role:
                return jsonify({"error": "Forbidden"}), 403

            if require_org and not user.organization_id:
                return jsonify({"error": "You must belong to an organization"}), 403
                
            g.current_user = user
            
            return fn(*args, **kwargs)
        
        return wrapper

    return decorator