from flask import Blueprint
from .health import health_bp
from .auth import auth_bp
from .organizations import org_bp
from .projects import projects_bp
from .tasks import tasks_bp
from .comments import comments_bp
from .frontend import front_bp

def register_v1_routes(app, prefix):
    api_v1 = Blueprint("api_v1", __name__, url_prefix=prefix)

    api_v1.register_blueprint(health_bp)
    api_v1.register_blueprint(auth_bp)
    api_v1.register_blueprint(org_bp)
    api_v1.register_blueprint(projects_bp)
    api_v1.register_blueprint(tasks_bp)
    api_v1.register_blueprint(comments_bp)

    app.register_blueprint(api_v1)
    app.register_blueprint(front_bp)