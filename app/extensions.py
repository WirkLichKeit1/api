from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_openapi3.openapi import OpenAPI

db = SQLAlchemy()
migrate = Migrate()