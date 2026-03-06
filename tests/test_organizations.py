def test_create_organization_success(client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
    response = client.post("/api/v1/organizations", json={"name": "My Org"}, headers=headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "My Org"

def test_create_organization_duplicate_name(client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
    client.post("/api/v1/organizations", json={"name": "My Org"}, headers=headers)

    # registra segundo usuário para tentar criar org com mesmo nome
    client.post("/api/v1/register", json={
        "name": "Other User",
        "email": "other@example.com",
        "password": "123456"
    })
    login = client.post("/api/v1/login", json={
        "email": "other@example.com",
        "password": "123456"
    })
    headers2 = {"Authorization": f"Bearer {login.get_json()['access_token']}"}
    response = client.post("/api/v1/organizations", json={"name": "My Org"}, headers=headers2)
    assert response.status_code == 400

def test_user_becomes_admin_after_creating_org(client, org_and_headers):
    """Quem cria a org vira admin automaticamente."""
    # testa acessando uma rota admin-only
    response = client.patch(
        f"/api/v1/organizations/{org_and_headers['org']['id']}",
        json={"name": "Updated Org"},
        headers=org_and_headers["headers"]
    )
    assert response.status_code == 200

def test_join_organization(client, org_and_headers):
    org_id = org_and_headers["org"]["id"]

    # registra e loga segundo usuário
    client.post("/api/v1/register", json={
        "name": "New Member",
        "email": "member@example.com",
        "password": "123456"
    })
    login = client.post("/api/v1/login", json={
        "email": "member@example.com",
        "password": "123456"
    })
    headers = {"Authorization": f"Bearer {login.get_json()['access_token']}"}

    response = client.post(f"/api/v1/organizations/{org_id}/join", headers=headers)
    assert response.status_code == 200

def test_cannot_join_org_if_already_in_one(client, org_and_headers):
    """Usuário que já está em uma org não pode entrar em outra."""
    org_id = org_and_headers["org"]["id"]
    response = client.post(
        f"/api/v1/organizations/{org_id}/join",
        headers=org_and_headers["headers"]
    )
    assert response.status_code == 400