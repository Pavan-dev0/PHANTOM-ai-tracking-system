from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from device import get_device_anchor
from movement import get_movement_zone
from phantom_engine.fusion import fuse_signals

app = Flask(__name__)
CORS(app)


def _require_non_empty_string(payload: dict, field_name: str) -> str:
    value = payload.get(field_name)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} is required")
    return value.strip()


def _require_object(payload: dict, field_name: str) -> dict:
    value = payload.get(field_name)
    if not isinstance(value, dict):
        raise ValueError(f"{field_name} is required")
    return value


def _require_number(value, field_name: str) -> float:
    if value is None or isinstance(value, bool):
        raise ValueError(f"{field_name} is required")
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} is required") from exc


def _parse_request_payload(payload: dict) -> dict:
    if not isinstance(payload, dict) or not payload:
        raise ValueError("request body is required")

    last_location = _require_object(payload, "last_location")

    return {
        "name": _require_non_empty_string(payload, "name"),
        "last_location": {
            "lat": _require_number(last_location.get("lat"), "last_location"),
            "lng": _require_number(last_location.get("lng"), "last_location"),
        },
        "missing_since_hours": _require_number(payload.get("missing_since_hours"), "missing_since_hours"),
        "phone_last_active": payload.get("phone_last_active"),
        "phone_activity_notes": _require_non_empty_string(payload, "phone_activity_notes"),
        "transport_available": _require_non_empty_string(payload, "transport_available"),
    }


@app.get("/health")
def health():
    return jsonify({"status": "PHANTOM-WRAITH backend healthy"}), 200


@app.post("/analyse")
def analyse():
    payload = request.get_json(silent=True)

    try:
        parsed = _parse_request_payload(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    movement_zone = get_movement_zone(
        lat=parsed["last_location"]["lat"],
        lng=parsed["last_location"]["lng"],
        hours=parsed["missing_since_hours"],
        transport=parsed["transport_available"],
    )
    device_anchor = get_device_anchor(parsed["phone_last_active"])
    fused = fuse_signals(
        movement_zone=movement_zone,
        device_anchor=device_anchor,
        phone_activity_notes=parsed["phone_activity_notes"],
    )

    return jsonify(fused), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
