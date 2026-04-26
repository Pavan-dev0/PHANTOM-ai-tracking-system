from __future__ import annotations

import json
import random
from datetime import datetime


def _current_timestamp() -> str:
    return datetime.now().strftime("%d %B %Y %H:%M")


def _current_case_id() -> str:
    return f"PHT-{datetime.now().year}-{random.randint(1, 999):03d}"


def _movement_signal(movement_zone: dict) -> str:
    transport_used = movement_zone.get("transport_used", "unknown")
    return (
        f"{movement_zone['radius_km']} km radius from "
        f"last known location via {transport_used}"
    )


def _device_signal(device_anchor: dict) -> str:
    if device_anchor.get("available") is True:
        return f"anchored near device coordinates {device_anchor['lat']}, {device_anchor['lng']}"

    return "no device data available"


def fuse_signals(movement_zone: dict, device_anchor: dict, phone_activity_notes: str) -> dict:
    timestamp = _current_timestamp()
    search_zone = {
        "lat": movement_zone["center_lat"],
        "lng": movement_zone["center_lng"],
        "radius_km": movement_zone["radius_km"],
    }
    movement_signal = _movement_signal(movement_zone)

    try:
        try:
            from .gemini_service import classify_intent
        except ImportError:
            from gemini_service import classify_intent

        intent_result = classify_intent(phone_activity_notes)
        confidence = float(intent_result["confidence"])
        confidence_percent = round(confidence * 100)
        dominant_engine = "WRAITH" if confidence > 0.6 else "PHANTOM"

        return {
            "case_id": _current_case_id(),
            "timestamp": timestamp,
            "search_zone": search_zone,
            "destination_category": intent_result["destination_category"],
            "confidence": confidence,
            "reasoning": intent_result["reasoning"],
            "gaps": intent_result["gaps"],
            "intent_stage": intent_result["intent_stage"],
            "dominant_engine": dominant_engine,
            "signal_breakdown": {
                "movement": movement_signal,
                "cognitive": (
                    f"{intent_result['destination_category']} at "
                    f"{confidence_percent} percent confidence"
                ),
                "device": _device_signal(device_anchor),
            },
        }
    except Exception:
        return {
            "case_id": "PHT-0000-000",
            "timestamp": timestamp,
            "search_zone": search_zone,
            "destination_category": "unknown",
            "confidence": 0.0,
            "reasoning": "AI engine unavailable - manual analysis required",
            "gaps": "System could not process phone activity data",
            "intent_stage": "vague",
            "dominant_engine": "PHANTOM",
            "signal_breakdown": {
                "movement": movement_signal,
                "cognitive": "unavailable",
                "device": "unavailable",
            },
        }


if __name__ == "__main__":
    movement_zone = {
        "center_lat": 13.0827,
        "center_lng": 80.2707,
        "radius_km": 30,
    }
    device_anchor = {
        "lat": 13.09,
        "lng": 80.28,
        "available": True,
    }
    phone_activity_notes = (
        "Searched Chennai Central station, "
        "looked up train timings to Bangalore"
    )

    result = fuse_signals(movement_zone, device_anchor, phone_activity_notes)
    print(json.dumps(result, indent=2))
