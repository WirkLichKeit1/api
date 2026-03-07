from flask_openapi3.openapi import OpenAPI
from flask_openapi3.models.info import Info
from flask_openapi3.models.security_scheme import SecurityScheme
from .config import config_by_name
from .extensions import db, migrate
from .core.logger import setup_logger
from .core.errors import register_error_handlers
from .api.v1 import register_v1_routes
import os

def create_app():
    env = os.getenv("FLASK_ENV")

    info = Info(
        title="Task Management API",
        version="1.0.0",
        description="API corporativa de gestão de tarefas estilo Jira/Trello"
    )

    security_schemes = {"bearerAuth": SecurityScheme(type="http", scheme="bearer")}

    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    app = OpenAPI(
        __name__,
        info=info,
        security_schemes=security_schemes,
        template_folder=os.path.join(BASE_DIR, "templates"),
        static_folder=os.path.join(BASE_DIR, "static"),
        static_url_path="/static",
    )
    app.config.from_object(config_by_name[env])

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)

    from app import models

    # Logger
    setup_logger(app)

    # Erros
    register_error_handlers(app)

    # API routes
    register_v1_routes(app, app.config["API_PREFIX"])

    return app