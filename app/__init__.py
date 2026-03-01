from flask import Flask
from .config import config_by_name
from .extensions import db, migrate
from .core.logger import setup_logger
from .core.errors import register_error_handlers
from .api.v1 import register_v1_routes
import os

def create_app():
    env = os.getenv("FLASK_ENV", "dev")

    app = Flask(__name__)
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