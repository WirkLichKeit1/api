def test_create_project_success(client, org_and_headers):
    response = client.post("/api/v1/projects",
        json={"name": "My Project"},
        headers=org_and_headers["headers"]
    )
    assert response.status_code == 201
    assert response.get_json()["name"] == "My Project"

def test_list_projects(client, org_and_headers):
    client.post("/api/v1/projects", json={"name": "Project 1"}, headers=org_and_headers["headers"])
    client.post("/api/v1/projects", json={"name": "Project 2"}, headers=org_and_headers["headers"])

    response = client.get("/api/v1/projects", headers=org_and_headers["headers"])
    assert response.status_code == 200
    assert len(response.get_json()) == 2

def test_get_project(client, org_and_headers):
    create = client.post("/api/v1/projects",
        json={"name": "My Project"},
        headers=org_and_headers["headers"]
    )
    project_id = create.get_json()["id"]

    response = client.get(f"/api/v1/projects/{project_id}", headers=org_and_headers["headers"])
    assert response.status_code == 200
    assert response.get_json()["id"] == project_id

def test_update_project(client, org_and_headers):
    create = client.post("/api/v1/projects",
        json={"name": "Old Name"},
        headers=org_and_headers["headers"]
    )
    project_id = create.get_json()["id"]

    response = client.patch(f"/api/v1/projects/{project_id}",
        json={"name": "New Name"},
        headers=org_and_headers["headers"]
    )
    assert response.status_code == 200
    assert response.get_json()["name"] == "New Name"

def test_delete_project(client, org_and_headers):
    create = client.post("/api/v1/projects",
        json={"name": "To Delete"},
        headers=org_and_headers["headers"]
    )
    project_id = create.get_json()["id"]

    response = client.delete(f"/api/v1/projects/{project_id}", headers=org_and_headers["headers"])
    assert response.status_code == 200

    get = client.get(f"/api/v1/projects/{project_id}", headers=org_and_headers["headers"])
    assert get.status_code == 404

def test_cannot_access_other_org_project(client, org_and_headers):
    """Isolamento multi-tenant — usuário não vê projeto de outra org."""
    create = client.post("/api/v1/projects",
        json={"name": "Org 1 Project"},
        headers=org_and_headers["headers"]
    )
    project_id = create.get_json()["id"]

    # cria segundo usuário em outra org
    client.post("/api/v1/register", json={
        "name": "Other User", "email": "other@example.com", "password": "123456"
    })
    login = client.post("/api/v1/login", json={
        "email": "other@example.com", "password": "123456"
    })
    token = login.get_json()["access_token"]
    client.post("/api/v1/organizations",
        json={"name": "Other Org"},
        headers={"Authorization": f"Bearer {token}"}
    )
    login2 = client.post("/api/v1/login", json={
        "email": "other@example.com", "password": "123456"
    })
    headers2 = {"Authorization": f"Bearer {login2.get_json()['access_token']}"}

    response = client.get(f"/api/v1/projects/{project_id}", headers=headers2)
    assert response.status_code == 404  # não 403 — não revelamos que existe