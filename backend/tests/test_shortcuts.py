import pytest


def test_create_shortcut(client):
    """Test creating a shortcut"""
    # Create a sound first
    sound_response = client.post(
        "/api/sounds",
        json={
            "name": "Test Sound",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
        },
    )
    sound_id = sound_response.json()["id"]

    # Create shortcut
    response = client.post(
        "/api/shortcuts",
        json={
            "sound_id": sound_id,
            "hotkey": "Ctrl+Alt+1",
            "action": "PLAY",
            "enabled": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["hotkey"] == "Ctrl+Alt+1"
    assert data["action"] == "PLAY"
    assert data["sound_id"] == sound_id


def test_shortcut_conflict(client):
    """Test that duplicate hotkeys are rejected"""
    # Create a sound
    sound_response = client.post(
        "/api/sounds",
        json={
            "name": "Test Sound",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
        },
    )
    sound_id = sound_response.json()["id"]

    # Create first shortcut
    client.post(
        "/api/shortcuts",
        json={
            "sound_id": sound_id,
            "hotkey": "Ctrl+Alt+1",
            "action": "PLAY",
        },
    )

    # Try to create duplicate
    response = client.post(
        "/api/shortcuts",
        json={
            "sound_id": sound_id,
            "hotkey": "Ctrl+Alt+1",
            "action": "PLAY",
        },
    )
    assert response.status_code == 400


def test_check_conflicts(client):
    """Test conflict checking endpoint"""
    # Create a sound
    sound_response = client.post(
        "/api/sounds",
        json={
            "name": "Test Sound",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
        },
    )
    sound_id = sound_response.json()["id"]

    # Create shortcut
    shortcut_response = client.post(
        "/api/shortcuts",
        json={
            "sound_id": sound_id,
            "hotkey": "Ctrl+Alt+1",
            "action": "PLAY",
        },
    )

    # Check for conflict
    response = client.get("/api/shortcuts/conflicts?hotkey=Ctrl+Alt+1")
    assert response.status_code == 200
    data = response.json()
    assert data["conflict"] is True

    # Check non-conflicting hotkey
    response = client.get("/api/shortcuts/conflicts?hotkey=Ctrl+Alt+2")
    assert response.status_code == 200
    data = response.json()
    assert data["conflict"] is False


def test_update_shortcut(client):
    """Test updating a shortcut"""
    # Create sound and shortcut
    sound_response = client.post(
        "/api/sounds",
        json={
            "name": "Test Sound",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
        },
    )
    sound_id = sound_response.json()["id"]

    shortcut_response = client.post(
        "/api/shortcuts",
        json={
            "sound_id": sound_id,
            "hotkey": "Ctrl+Alt+1",
            "action": "PLAY",
        },
    )
    shortcut_id = shortcut_response.json()["id"]

    # Update it
    response = client.put(
        f"/api/shortcuts/{shortcut_id}",
        json={"hotkey": "Ctrl+Alt+2", "action": "TOGGLE"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["hotkey"] == "Ctrl+Alt+2"
    assert data["action"] == "TOGGLE"


def test_delete_shortcut(client):
    """Test deleting a shortcut"""
    # Create sound and shortcut
    sound_response = client.post(
        "/api/sounds",
        json={
            "name": "Test Sound",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
        },
    )
    sound_id = sound_response.json()["id"]

    shortcut_response = client.post(
        "/api/shortcuts",
        json={
            "sound_id": sound_id,
            "hotkey": "Ctrl+Alt+1",
            "action": "PLAY",
        },
    )
    shortcut_id = shortcut_response.json()["id"]

    # Delete it
    response = client.delete(f"/api/shortcuts/{shortcut_id}")
    assert response.status_code == 204

    # Verify it's gone
    get_response = client.get(f"/api/shortcuts/{shortcut_id}")
    assert get_response.status_code == 404
