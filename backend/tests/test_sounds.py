import pytest
from uuid import uuid4


def test_create_sound(client):
    """Test creating a sound"""
    response = client.post(
        "/api/sounds",
        json={
            "name": "Test Sound",
            "description": "A test sound",
            "tags": ["test"],
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
            "volume": 80,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Sound"
    assert data["source_type"] == "DIRECT_URL"
    assert "id" in data


def test_get_sound(client):
    """Test getting a sound"""
    # Create a sound first
    create_response = client.post(
        "/api/sounds",
        json={
            "name": "Test Sound",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
        },
    )
    sound_id = create_response.json()["id"]

    # Get it
    response = client.get(f"/api/sounds/{sound_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sound_id
    assert data["name"] == "Test Sound"


def test_list_sounds(client):
    """Test listing sounds"""
    # Create a few sounds
    for i in range(3):
        client.post(
            "/api/sounds",
            json={
                "name": f"Sound {i}",
                "source_type": "DIRECT_URL",
                "source_url": f"https://example.com/sound{i}.mp3",
            },
        )

    # List them
    response = client.get("/api/sounds")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3


def test_update_sound(client):
    """Test updating a sound"""
    # Create a sound
    create_response = client.post(
        "/api/sounds",
        json={
            "name": "Original Name",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
        },
    )
    sound_id = create_response.json()["id"]

    # Update it
    response = client.put(
        f"/api/sounds/{sound_id}",
        json={"name": "Updated Name", "volume": 90},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["volume"] == 90


def test_delete_sound(client):
    """Test deleting a sound"""
    # Create a sound
    create_response = client.post(
        "/api/sounds",
        json={
            "name": "To Delete",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/sound.mp3",
        },
    )
    sound_id = create_response.json()["id"]

    # Delete it
    response = client.delete(f"/api/sounds/{sound_id}")
    assert response.status_code == 204

    # Verify it's gone
    get_response = client.get(f"/api/sounds/{sound_id}")
    assert get_response.status_code == 404


def test_search_sounds(client):
    """Test searching sounds"""
    # Create sounds with different names
    client.post(
        "/api/sounds",
        json={
            "name": "Air Horn",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/airhorn.mp3",
        },
    )
    client.post(
        "/api/sounds",
        json={
            "name": "Door Bell",
            "source_type": "DIRECT_URL",
            "source_url": "https://example.com/doorbell.mp3",
        },
    )

    # Search
    response = client.get("/api/sounds?q=Air")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(s["name"] == "Air Horn" for s in data)
