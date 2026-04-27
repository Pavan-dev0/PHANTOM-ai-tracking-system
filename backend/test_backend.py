from __future__ import annotations

import pytest

from app import app
from device import get_device_anchor
from movement import get_movement_zone


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


@pytest.fixture(autouse=True)
def fake_intent_engine(monkeypatch):
    def _fake_classify_intent(phone_activity_notes: str) -> dict:
        notes = str(phone_activity_notes).lower()

        if "park" in notes or "trail" in notes:
            return {
                "destination_category": "isolated_outdoor",
                "confidence": 0.61,
                "reasoning": "Phone activity suggests movement toward quieter outdoor areas.",
                "gaps": "Direct destination confirmation is still missing.",
                "intent_stage": "specific",
            }

        if "fuel" in notes or "road" in notes:
            return {
                "destination_category": "urban_crowded",
                "confidence": 0.58,
                "reasoning": "Recent searches indicate likely movement along an urban vehicle route.",
                "gaps": "No device anchor was available to confirm the route.",
                "intent_stage": "narrowing",
            }

        return {
            "destination_category": "transport_hub",
            "confidence": 0.82,
            "reasoning": "Phone activity strongly indicates transit-oriented movement.",
            "gaps": "Historical movement data was limited.",
            "intent_stage": "action",
        }

    monkeypatch.setattr(
        "phantom_engine.gemini_service.classify_intent",
        _fake_classify_intent,
    )


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    passed = len(terminalreporter.stats.get("passed", []))
    failed = len(terminalreporter.stats.get("failed", []))
    terminalreporter.write_line(f"SUMMARY: {passed} passed, {failed} failed")


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


def test_movement_car_transport_is_supported():
    result = get_movement_zone(19.0760, 72.8777, 1.5, "car")

    assert result["radius_km"] == 50.0
    assert result["transport_used"] == "car"


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


@pytest.mark.parametrize(
    ("name", "body", "expected_lat", "expected_lng"),
    [
        (
            "bengaluru",
            {
                "name": "Ravi Kumar",
                "last_location": {"lat": 12.9716, "lng": 77.5946},
                "missing_since_hours": 2,
                "phone_last_active": {"lat": 12.9350, "lng": 77.6245},
                "phone_activity_notes": "Searched Majestic bus stand and checked train timings",
                "transport_available": "bus",
            },
            12.9716,
            77.5946,
        ),
        (
            "delhi",
            {
                "name": "Meera Nair",
                "last_location": {"lat": 28.6139, "lng": 77.2090},
                "missing_since_hours": 3,
                "phone_last_active": {"lat": 28.5355, "lng": 77.3910},
                "phone_activity_notes": "Searched city parks and quiet trail routes",
                "transport_available": "walking",
            },
            28.6139,
            77.2090,
        ),
        (
            "mumbai",
            {
                "name": "Arjun Shah",
                "last_location": {"lat": 19.0760, "lng": 72.8777},
                "missing_since_hours": 1.5,
                "phone_last_active": None,
                "phone_activity_notes": "Recent activity showed road directions and fuel stop searches",
                "transport_available": "car",
            },
            19.0760,
            72.8777,
        ),
    ],
)
def test_demo_cases_return_real_city_coordinates(client, name, body, expected_lat, expected_lng):
    response = client.post("/analyse", json=body)
    data = response.get_json()

    assert response.status_code == 200, name
    assert data["search_zone"]["lat"] == pytest.approx(expected_lat), name
    assert data["search_zone"]["lng"] == pytest.approx(expected_lng), name
    assert isinstance(data["search_zone"]["radius_km"], float), name
