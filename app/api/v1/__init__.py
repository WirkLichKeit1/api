from flask import Blueprint
from .health import health_bp
from .auth import auth_bp

def register_v1_routes(app, prefix):
    api_v1 = Blueprint("api_v1", __name__, url_prefix=prefix)

    api_v1.register_blueprint(health_bp)
    api_v1.register_blueprint(auth_bp)

    app.register_blueprint(api_v1)