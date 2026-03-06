import pytest
from app import create_app
from app.extensions import db as _db
import os

os.environ["FLASK_ENV"] = "test"

@pytest.fixture(scope="session")
def app():
    app = create_app()
    return app

@pytest.fixture(scope="session")
def db(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()

@pytest.fixture(scope="function", autouse=True)
def clean_db(db):
    yield
    db.session.rollback()
    for table in reversed(db.metadata.sorted_tables):
        db.session.execute(table.delete())
    db.session.commit()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def registered_user(client):
    response = client.post("/api/v1/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "123456"
    })
    assert response.status_code == 201
    return {"email":"test@example.com","password":"123456"}

@pytest.fixture
def auth_tokens(client, registered_user):
    response = client.post("/api/v1/login", json=registered_user)
    assert response.status_code == 200
    return response.get_json()

@pytest.fixture
def auth_headers(auth_tokens):
    return {"Authorization": f"Bearer {auth_tokens['access_token']}"}

@pytest.fixture
def org_and_headers(client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
    response = client.post("/api/v1/organizations", json={"name": "Test Org"}, headers=headers)
    assert response.status_code == 201

    login = client.post("/api/v1/login", json={
        "email": "test@example.com",
        "password": "123456"
    })
    tokens = login.get_json()
    return {
        "org": response.get_json(),
        "headers": {"Authorization": f"Bearer {tokens['access_token']}"},
        "tokens": tokens
    }