import pytest

@pytest.fixture
def project(client, org_and_headers):
    """Cria um projeto e retorna seus dados junto com os headers."""
    response = client.post("/api/v1/projects",
        json={"name": "Test Project"},
        headers=org_and_headers["headers"]
    )
    return {
        "project": response.get_json(),
        "headers": org_and_headers["headers"]
    }

def test_create_task_success(client, project):
    response = client.post(
        f"/api/v1/projects/{project['project']['id']}/tasks",
        json={"title": "My Task"},
        headers=project["headers"]
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "My Task"
    assert data["status"] == "todo"
    assert data["priority"] == "medium"

def test_list_tasks_with_pagination(client, project):
    pid = project["project"]["id"]
    headers = project["headers"]

    for i in range(3):
        client.post(f"/api/v1/projects/{pid}/tasks",
            json={"title": f"Task {i}"},
            headers=headers
        )

    response = client.get(
        f"/api/v1/projects/{pid}/tasks?page=1&per_page=2",
        headers=headers
    )
    assert response.status_code == 200
    data = response.get_json()
    assert len(data["items"]) == 2
    assert data["total"] == 3
    assert data["pages"] == 2

def test_list_tasks_filter_by_status(client, project):
    pid = project["project"]["id"]
    headers = project["headers"]

    client.post(f"/api/v1/projects/{pid}/tasks",
        json={"title": "Todo Task", "status": "todo"},
        headers=headers
    )
    client.post(f"/api/v1/projects/{pid}/tasks",
        json={"title": "Done Task", "status": "done"},
        headers=headers
    )

    response = client.get(
        f"/api/v1/projects/{pid}/tasks?status=done",
        headers=headers
    )
    data = response.get_json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "done"

def test_soft_delete_task(client, project):
    """Task deletada não aparece na listagem."""
    pid = project["project"]["id"]
    headers = project["headers"]

    create = client.post(f"/api/v1/projects/{pid}/tasks",
        json={"title": "To Delete"},
        headers=headers
    )
    task_id = create.get_json()["id"]

    client.delete(f"/api/v1/projects/{pid}/tasks/{task_id}", headers=headers)

    # não aparece na listagem
    list_response = client.get(f"/api/v1/projects/{pid}/tasks", headers=headers)
    ids = [t["id"] for t in list_response.get_json()["items"]]
    assert task_id not in ids

    # não aparece no get direto
    get_response = client.get(f"/api/v1/projects/{pid}/tasks/{task_id}", headers=headers)
    assert get_response.status_code == 404

def test_update_task(client, project):
    pid = project["project"]["id"]
    headers = project["headers"]

    create = client.post(f"/api/v1/projects/{pid}/tasks",
        json={"title": "Old Title"},
        headers=headers
    )
    task_id = create.get_json()["id"]

    response = client.patch(f"/api/v1/projects/{pid}/tasks/{task_id}",
        json={"title": "New Title", "status": "doing"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["title"] == "New Title"
    assert data["status"] == "doing"