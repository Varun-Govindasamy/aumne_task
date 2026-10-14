from datetime import datetime, timedelta, timezone

from app.models import WorkSession


def create_session(client, duration=50):
    response = client.post(
        "/sessions/",
        json={"title": "Deep work", "goal": "Finish the draft", "duration": duration},
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_session_validates_payload(client):
    response = client.post("/sessions/", json={"title": "", "duration": 0})
    assert response.status_code == 422


def test_session_lifecycle_and_history(client):
    session_id = create_session(client)
    assert client.patch(f"/sessions/{session_id}/pause", json={"reason": "break"}).status_code == 409
    assert client.patch(f"/sessions/{session_id}/start").json()["status"] == "active"
    paused = client.patch(f"/sessions/{session_id}/pause", json={"reason": "phone call"})
    assert paused.status_code == 200
    assert paused.json()["status"] == "paused"
    assert client.patch(f"/sessions/{session_id}/resume").json()["status"] == "active"
    second_pause = client.patch(f"/sessions/{session_id}/pause", json={"reason": "stretch break"})
    assert second_pause.json()["status"] == "paused"
    assert client.patch(f"/sessions/{session_id}/resume").json()["status"] == "active"
    completed = client.patch(f"/sessions/{session_id}/complete")
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    history = client.get("/sessions/history").json()
    assert history["completion_ratio"] == 1.0
    assert history["total_pauses"] == 2


def test_fourth_pause_interrupts_session(client):
    session_id = create_session(client)
    client.patch(f"/sessions/{session_id}/start")
    for index in range(4):
        response = client.patch(
            f"/sessions/{session_id}/pause",
            json={"reason": f"interruption {index}"},
        )
        assert response.status_code == 200
        if index < 3:
            assert client.patch(f"/sessions/{session_id}/resume").status_code == 200
    assert response.json()["status"] == "interrupted"
    assert response.json()["pause_count"] == 4


def test_session_completed_after_grace_is_overdue(client, test_session_factory):
    session_id = create_session(client, duration=50)
    client.patch(f"/sessions/{session_id}/start")
    db = test_session_factory()
    work_session = db.query(WorkSession).filter_by(id=session_id).one()
    work_session.start_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=60)
    db.commit()
    db.close()
    response = client.patch(f"/sessions/{session_id}/complete")
    assert response.status_code == 200
    assert response.json()["status"] == "overdue"


def test_unresumed_pause_becomes_abandoned_after_deadline(client, test_session_factory):
    session_id = create_session(client, duration=50)
    client.patch(f"/sessions/{session_id}/start")
    client.patch(f"/sessions/{session_id}/pause", json={"reason": "unexpected interruption"})
    db = test_session_factory()
    work_session = db.query(WorkSession).filter_by(id=session_id).one()
    work_session.start_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=56)
    db.commit()
    db.close()
    history = client.get("/sessions/history").json()
    assert history["sessions"][0]["status"] == "abandoned"
    assert client.patch(f"/sessions/{session_id}/resume").status_code == 409


def test_pause_after_deadline_is_abandoned_immediately(client, test_session_factory):
    session_id = create_session(client, duration=50)
    client.patch(f"/sessions/{session_id}/start")
    db = test_session_factory()
    work_session = db.query(WorkSession).filter_by(id=session_id).one()
    work_session.start_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=56)
    db.commit()
    db.close()
    response = client.patch(f"/sessions/{session_id}/pause", json={"reason": "late interruption"})
    assert response.status_code == 200
    assert response.json()["status"] == "abandoned"


def test_missing_session_returns_not_found(client):
    response = client.patch("/sessions/999/start")
    assert response.status_code == 404
