from __future__ import annotations


def get_device_anchor(phone_last_active: dict | None) -> dict:
    if isinstance(phone_last_active, dict):
        lat = phone_last_active.get("lat")
        lng = phone_last_active.get("lng")
        if lat is not None and lng is not None:
            return {
                "lat": lat,
                "lng": lng,
                "available": True,
            }

    return {
        "lat": None,
        "lng": None,
        "available": False,
    }
