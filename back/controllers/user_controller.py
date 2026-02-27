from services.user_service import UserService
from flask import Blueprint, request, jsonify

service = UserService()

user_bp = Blueprint("users", __name__, url_prefix="/api")

@user_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "data inválida"}), 400
    
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, email, password]):
        return jsonify({"error": "Campos obrigatórios"}), 400

    return service.register(username, email, password)

@user_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "data inválida"}), 400
    
    email = data.get("email")
    password = data.get("password")
    
    if not all([email, password]):
        return jsonify({"error": "Campos obrigatórios"}), 400

    return service.login(email, password)

@user_bp.route("/all", methods=["GET"])
def get_all_users():
    return service.getAll()

@user_bp.route("/search")
def get_user_by_id():
    id = request.args.get("id")
    return service.getById(id)

@user_bp.route("/ip")
def get_ip():
    ip = request.remote_addr

    return jsonify({
        "IP": ip
    })