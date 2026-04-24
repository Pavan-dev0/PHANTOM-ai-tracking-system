"""
PHANTOM Flask stub server.

This server accepts JSON case data from the React frontend and returns a
hardcoded analysis response that matches the current integration contract.
"""

from __future__ import annotations

import time

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


TRANSPORT_PROFILES = {
    "walking": {
        "category": "neighborhood corridor",
        "offset": (0.0032, 0.0024),
        "signals": {"movement": 0.61, "cognitive": 0.73, "device": 0.44},
    },
    "car": {
        "category": "road network exit",
        "offset": (0.0140, 0.0180),
        "signals": {"movement": 0.82, "cognitive": 0.58, "device": 0.67},
    },
    "bus": {
        "category": "bus interchange",
        "offset": (0.0100, 0.0115),
        "signals": {"movement": 0.76, "cognitive": 0.56, "device": 0.72},
    },
    "train": {
        "category": "transit hub",
        "offset": (0.0165, 0.0145),
        "signals": {"movement": 0.84, "cognitive": 0.52, "device": 0.79},
    },
    "bike": {
        "category": "commercial corridor",
        "offset": (0.0070, 0.0090),
        "signals": {"movement": 0.74, "cognitive": 0.63, "device": 0.59},
    },
}

DEFAULT_PROFILE = {
    "category": "mixed-use district",
    "offset": (0.0060, 0.0060),
    "signals": {"movement": 0.68, "cognitive": 0.60, "device": 0.58},
}


def _coerce_non_empty_string(value, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"'{field_name}' must be a non-empty string.")
    return value.strip()


def _coerce_number(value, field_name: str) -> float:
    if isinstance(value, bool) or value is None:
        raise ValueError(f"'{field_name}' must be a number.")
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"'{field_name}' must be a number.") from exc


def _parse_frontend_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")

    return {
        "name": _coerce_non_empty_string(payload.get("name"), "name"),
        "lat": _coerce_number(payload.get("lat"), "lat"),
        "lng": _coerce_number(payload.get("lng"), "lng"),
        "hours_missing": _coerce_number(payload.get("hours_missing"), "hours_missing"),
        "notes": _coerce_non_empty_string(payload.get("notes"), "notes"),
        "transport": _coerce_non_empty_string(payload.get("transport"), "transport"),
    }


def _profile_for_transport(transport: str) -> dict:
    return TRANSPORT_PROFILES.get(transport.strip().lower(), DEFAULT_PROFILE)


def _bounded_hours(hours_missing: float) -> float:
    return max(1.0, min(hours_missing, 12.0))


def _predict_coordinates(lat: float, lng: float, hours_missing: float, transport: str) -> dict:
    profile = _profile_for_transport(transport)
    multiplier = _bounded_hours(hours_missing) / 6.0
    lat_offset, lng_offset = profile["offset"]
    return {
        "lat": round(lat + (lat_offset * multiplier), 6),
        "lng": round(lng + (lng_offset * multiplier), 6),
    }


def make_fake_response(case_data: dict) -> dict:
    profile = _profile_for_transport(case_data["transport"])
    coordinates = _predict_coordinates(
        case_data["lat"],
        case_data["lng"],
        case_data["hours_missing"],
        case_data["transport"],
    )
    confidence = round(min(0.94, 0.62 + (_bounded_hours(case_data["hours_missing"]) * 0.03)), 2)
    reasoning = (
        f"{case_data['name']} has been missing for {case_data['hours_missing']:.1f} hours. "
        f"Using the reported {case_data['transport']} transport mode and the last known "
        f"coordinates, the stub engine points to a {profile['category']} near the projected route. "
        f"Case notes considered: {case_data['notes']}"
    )

    return {
        "coordinates": coordinates,
        "destination_category": profile["category"],
        "category": profile["category"],
        "confidence": confidence,
        "reasoning": reasoning,
        "signal_breakdown": profile["signals"],
        "signals": profile["signals"],
    }


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if not request.is_json:
        return (
            jsonify(
                {
                    "error": "Unsupported Media Type. Send application/json from the React frontend."
                }
            ),
            415,
        )

    raw_data = request.get_json(silent=True)
    if raw_data is None:
        return jsonify({"error": "Invalid JSON body."}), 400

    try:
        case_data = _parse_frontend_payload(raw_data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    response = make_fake_response(case_data)

    print("\n[ANALYZE]")
    print(f"  name={case_data['name']}")
    print(f"  transport={case_data['transport']}")
    print(f"  hours_missing={case_data['hours_missing']}")
    print(f"  coordinates={response['coordinates']['lat']}, {response['coordinates']['lng']}")
    print(f"  category={response['category']}")

    return jsonify(response), 200


@app.route("/api/case/<case_id>", methods=["GET"])
def get_case(case_id: str):
    fake_case = {
        "case_id": case_id,
        "name": "Jordan Smith",
        "status": "active",
        "filed_at": "2026-04-24T10:00:00Z",
        "analysis": make_fake_response(
            {
                "name": "Jordan Smith",
                "lat": 12.9716,
                "lng": 77.5946,
                "hours_missing": 6.0,
                "notes": "Last seen leaving a central transit station after a delayed check-in.",
                "transport": "train",
            }
        ),
    }
    return jsonify(fake_case), 200


@app.route("/api/health", methods=["GET"])
def health():
    return (
        jsonify(
            {
                "status": "healthy",
                "server": "phantom-flask",
                "port": 5000,
                "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
        ),
        200,
    )


if __name__ == "__main__":
    print("PHANTOM Flask server running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
