from __future__ import annotations

import re

import pytest

from movement import get_movement_zone
from device import get_device_anchor
from app import app


VALID_ANALYSE_BODY = {
    "name": "Ravi Kumar",
    "last_location": {"lat": 13.0827, "lng": 80.2707},
    "missing_since_hours": 6,
    "phone_last_active": {"lat": 13.09, "lng": 80.28},
    "phone_activity_notes": "Searched Chennai Central",
    "transport_available": "bus",
}


@pytest.fixture()
def client():
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    passed = len(terminalreporter.stats.get("passed", []))
    failed = len(terminalreporter.stats.get("failed", []))
    terminalreporter.write_line(f"SUMMARY: {passed} passed, {failed} failed")


# ═══════════════════════════════════════════
# SECTION 1 — movement.py tests
# ═══════════════════════════════════════════

def test_movement_bus_transport_six_hours_caps_at_fifty():
    result = get_movement_zone(13.0827, 80.2707, 6, "bus")

    assert result["radius_km"] == 50.0
    assert result["center_lat"] == 13.0827
    assert result["center_lng"] == 80.2707
    assert result["transport_used"] == "bus"
    assert result["hours_missing"] == 6


def test_movement_walking_transport_three_hours_returns_expected_radius():
    result = get_movement_zone(13.1, 80.25, 3, "walking")

    assert result["radius_km"] == 15.0
    assert result["center_lat"] == 13.1
    assert result["center_lng"] == 80.25


def test_movement_unknown_transport_ten_hours_caps_at_fifty():
    result = get_movement_zone(13.05, 80.21, 10, "unknown")

    assert result["radius_km"] == 50.0


def test_movement_train_transport_one_hour_caps_at_fifty():
    result = get_movement_zone(13.0, 80.0, 1, "train")

    assert result["radius_km"] == 50.0


def test_movement_zero_hours_defaults_to_one_hour():
    result = get_movement_zone(13.0827, 80.2707, 0, "bus")

    assert result["radius_km"] == 20.0
    assert result["hours_missing"] == 1


def test_movement_negative_hours_defaults_to_one_hour():
    result = get_movement_zone(13.0827, 80.2707, -5, "bus")

    assert result["radius_km"] == 20.0


def test_movement_unrecognised_transport_uses_unknown_default_speed():
    result = get_movement_zone(13.0827, 80.2707, 2, "bicycle")

    assert result["radius_km"] == 20.0


def test_movement_return_type_contains_all_expected_keys():
    result = get_movement_zone(13.0827, 80.2707, 2, "bus")

    assert isinstance(result, dict)
    assert "center_lat" in result
    assert "center_lng" in result
    assert "radius_km" in result
    assert "transport_used" in result
    assert "hours_missing" in result


# ═══════════════════════════════════════════
# SECTION 2 — device.py tests
# ═══════════════════════════════════════════

def test_device_valid_coordinates_provided_returns_available_true():
    result = get_device_anchor({"lat": 13.09, "lng": 80.28})

    assert result["lat"] == 13.09
    assert result["lng"] == 80.28
    assert result["available"] is True


def test_device_none_input_returns_unavailable():
    result = get_device_anchor(None)

    assert result["lat"] is None
    assert result["lng"] is None
    assert result["available"] is False


def test_device_empty_dict_returns_unavailable():
    result = get_device_anchor({})

    assert result["available"] is False


def test_device_return_type_contains_all_expected_keys():
    result = get_device_anchor({"lat": 13.09, "lng": 80.28})

    assert isinstance(result, dict)
    assert "lat" in result
    assert "lng" in result
    assert "available" in result


# ═══════════════════════════════════════════
# SECTION 3 — app.py route tests
# ═══════════════════════════════════════════

def test_health_check_route_returns_phantom_wraith_status(client):
    response = client.get("/health")
    data = response.get_json()

    assert response.status_code == 200
    assert "status" in data
    assert "PHANTOM-WRAITH" in data["status"]


def test_analyse_route_with_valid_full_input_returns_complete_response(client):
    response = client.post("/analyse", json=VALID_ANALYSE_BODY)
    data = response.get_json()

    assert response.status_code == 200
    assert "case_id" in data
    assert "timestamp" in data
    assert "search_zone" in data
    assert "destination_category" in data
    assert "confidence" in data
    assert "reasoning" in data
    assert "gaps" in data
    assert "intent_stage" in data
    assert "dominant_engine" in data
    assert "signal_breakdown" in data
    assert "lat" in data["search_zone"]
    assert "lng" in data["search_zone"]
    assert "radius_km" in data["search_zone"]
    assert "movement" in data["signal_breakdown"]
    assert "cognitive" in data["signal_breakdown"]
    assert "device" in data["signal_breakdown"]
    assert isinstance(data["confidence"], float)
    assert 0.0 <= data["confidence"] <= 1.0
    assert data["dominant_engine"] in {"PHANTOM", "WRAITH"}


def test_analyse_route_with_null_phone_data_returns_successfully(client):
    body = dict(VALID_ANALYSE_BODY)
    body["phone_last_active"] = None

    response = client.post("/analyse", json=body)

    assert response.status_code == 200
    assert isinstance(response.get_json(), dict)


def test_analyse_route_missing_name_returns_400_and_mentions_name(client):
    body = dict(VALID_ANALYSE_BODY)
    body.pop("name")

    response = client.post("/analyse", json=body)
    data = response.get_json()

    assert response.status_code == 400
    assert "error" in data
    assert "name" in data["error"]


def test_analyse_route_missing_last_location_returns_400_and_mentions_last_location(client):
    body = dict(VALID_ANALYSE_BODY)
    body.pop("last_location")

    response = client.post("/analyse", json=body)
    data = response.get_json()

    assert response.status_code == 400
    assert "error" in data
    assert "last_location" in data["error"]


def test_analyse_route_missing_missing_since_hours_returns_400_and_mentions_field(client):
    body = dict(VALID_ANALYSE_BODY)
    body.pop("missing_since_hours")

    response = client.post("/analyse", json=body)
    data = response.get_json()

    assert response.status_code == 400
    assert "missing_since_hours" in data["error"]


def test_analyse_route_missing_phone_activity_notes_returns_400(client):
    body = dict(VALID_ANALYSE_BODY)
    body.pop("phone_activity_notes")

    response = client.post("/analyse", json=body)

    assert response.status_code == 400


def test_analyse_route_missing_transport_available_returns_400(client):
    body = dict(VALID_ANALYSE_BODY)
    body.pop("transport_available")

    response = client.post("/analyse", json=body)

    assert response.status_code == 400


def test_analyse_route_with_empty_body_returns_400(client):
    response = client.post("/analyse", json={})

    assert response.status_code == 400


def test_analyse_route_case_id_has_pht_prefix_and_is_string(client):
    response = client.post("/analyse", json=VALID_ANALYSE_BODY)
    data = response.get_json()

    assert isinstance(data["case_id"], str)
    assert data["case_id"].startswith("PHT-")


def test_analyse_route_search_zone_uses_last_location_coordinates(client):
    body = dict(VALID_ANALYSE_BODY)
    body["last_location"] = {"lat": 12.9716, "lng": 77.5946}

    response = client.post("/analyse", json=body)
    data = response.get_json()

    assert data["search_zone"]["lat"] == 12.9716
    assert data["search_zone"]["lng"] == 77.5946
