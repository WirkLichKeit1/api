import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class BaseConfig:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY")
    API_PREFIX = "/api/v1"

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if not cls.SECRET_KEY:
            raise RuntimeError("SECRET_KEY não definida")

class DevelopmentConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'dev.db')}"
    DEBUG = True

class TestingCondig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    TESTING = True
    DEBUG = False

class ProductionConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    DEBUG = False

config_by_name = {
    "dev": DevelopmentConfig,
    "test": TestingCondig,
    "prod": ProductionConfig,
}