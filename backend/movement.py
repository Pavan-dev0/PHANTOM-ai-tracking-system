from __future__ import annotations

TRANSPORT_SPEEDS = {
    "walking": 5.0,
    "bus": 20.0,
    "car": 80.0,
    "train": 60.0,
    "unknown": 10.0,
}

MAX_RADIUS_KM = 50.0
MIN_HOURS = 1.0


def get_movement_zone(lat: float, lng: float, hours: float, transport: str) -> dict:
    normalized_transport = str(transport or "unknown").strip().lower()
    if normalized_transport not in TRANSPORT_SPEEDS:
        normalized_transport = "unknown"

    normalized_hours = float(hours)
    if normalized_hours <= 0:
        normalized_hours = MIN_HOURS

    radius_km = min(TRANSPORT_SPEEDS[normalized_transport] * normalized_hours, MAX_RADIUS_KM)

    return {
        "center_lat": float(lat),
        "center_lng": float(lng),
        "radius_km": float(radius_km),
        "transport_used": normalized_transport,
        "hours_missing": int(normalized_hours) if normalized_hours.is_integer() else normalized_hours,
    }
