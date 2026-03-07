from .health import health_bp
from .auth import auth_bp
from .organizations import org_bp
from .projects import projects_bp
from .tasks import tasks_bp
from .comments import comments_bp
from .frontend import front_bp

def register_v1_routes(app, prefix):
    app.register_blueprint(health_bp, url_prefix=prefix)
    app.register_api(auth_bp, url_prefix=prefix)
    app.register_api(org_bp, url_prefix=prefix)
    app.register_api(projects_bp, url_prefix=prefix)
    app.register_api(tasks_bp, url_prefix=prefix)
    app.register_api(comments_bp, url_prefix=prefix)
    app.register_blueprint(front_bp, url_prefix=prefix)