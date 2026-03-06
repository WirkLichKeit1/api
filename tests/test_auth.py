def test_register_success(client):
    response = client.post("/api/v1/register", json={
        "name": "John Doe",
        "email": "john@example.com",
        "password": "123456"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data["email"] == "john@example.com"
    assert "id" in data

def test_register_duplicate_email(client):
    payload = {"name": "John", "email": "john@example.com", "password": "123456"}
    client.post("/api/v1/register", json=payload)
    response = client.post("/api/v1/register", json=payload)
    assert response.status_code == 400
    assert "already registered" in response.get_json()["error"]

def test_register_invalid_payload(client):
    response = client.post("/api/v1/register", json={
        "name": "Jo",          # muito curto
        "email": "not-an-email",
        "password": "123"      # muito curta
    })
    assert response.status_code == 400

def test_login_success(client, registered_user):
    response = client.post("/api/v1/login", json=registered_user)
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_login_wrong_password(client, registered_user):
    response = client.post("/api/v1/login", json={
        "email": registered_user["email"],
        "password": "wrong_password"
    })
    assert response.status_code == 400
    assert "Invalid credentials" in response.get_json()["error"]

def test_login_nonexistent_user(client):
    response = client.post("/api/v1/login", json={
        "email": "ghost@example.com",
        "password": "123456"
    })
    assert response.status_code == 400

def test_refresh_success(client, auth_tokens):
    response = client.post("/api/v1/refresh", json={
        "refresh_token": auth_tokens["refresh_token"]
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data
    assert "refresh_token" in data
    # tokens novos devem ser diferentes dos originais
    assert data["access_token"] != auth_tokens["access_token"]
    assert data["refresh_token"] != auth_tokens["refresh_token"]

def test_refresh_token_rotation(client, auth_tokens):
    """Refresh token usado uma vez não pode ser reutilizado."""
    client.post("/api/v1/refresh", json={
        "refresh_token": auth_tokens["refresh_token"]
    })
    # tenta usar o mesmo refresh token de novo
    response = client.post("/api/v1/refresh", json={
        "refresh_token": auth_tokens["refresh_token"]
    })
    assert response.status_code == 401
    assert "already used" in response.get_json()["error"]

def test_logout_success(client, auth_tokens):
    response = client.post("/api/v1/logout", json={
        "refresh_token": auth_tokens["refresh_token"]
    })
    assert response.status_code == 200

def test_logout_invalidates_refresh_token(client, auth_tokens):
    """Após logout, o refresh token não pode mais ser usado."""
    client.post("/api/v1/logout", json={
        "refresh_token": auth_tokens["refresh_token"]
    })
    response = client.post("/api/v1/refresh", json={
        "refresh_token": auth_tokens["refresh_token"]
    })
    assert response.status_code == 401

def test_access_protected_route_without_token(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 401

def test_access_protected_route_with_valid_token(client, org_and_headers):
    response = client.get("/api/v1/projects", headers=org_and_headers["headers"])
    assert response.status_code == 200