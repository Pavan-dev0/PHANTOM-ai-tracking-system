# PHANTOM AI - Movement Zone Calculator
# Day 1 | Developer: Naruto

TRANSPORT_SPEEDS = {
    "walking": 5,   # km/h
    "bus": 40,       # km/h
    "car": 80        # km/h
}

def calculate_movement_zone(last_lat, last_lon, hours_missing, transport_type):
    """
    Takes last known coordinates, hours missing, and transport type.
    Returns center (lat, lon) and radius in kilometres.
    """
    transport_type = transport_type.lower()

    if transport_type not in TRANSPORT_SPEEDS:
        raise ValueError(f"Unknown transport type: '{transport_type}'. Use: walking, bus, or car")

    speed = TRANSPORT_SPEEDS[transport_type]
    radius_km = speed * hours_missing

    return {
        "center_lat": last_lat,
        "center_lon": last_lon,
        "radius_km": radius_km,
        "transport_type": transport_type,
        "hours_missing": hours_missing
    }


# ── Demo Test Cases ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_cases = [
        {"name": "Case 1 - Walker",  "lat": 12.9716, "lon": 77.5946, "hours": 2,   "transport": "walking"},
        {"name": "Case 2 - Bus",     "lat": 28.6139, "lon": 77.2090, "hours": 3,   "transport": "bus"},
        {"name": "Case 3 - Car",     "lat": 19.0760, "lon": 72.8777, "hours": 1.5, "transport": "car"},
    ]

    print("=== PHANTOM | Movement Zone Calculator ===\n")
    for case in test_cases:
        result = calculate_movement_zone(case["lat"], case["lon"], case["hours"], case["transport"])
        print(f"{case['name']}")
        print(f"  Center    : ({result['center_lat']}, {result['center_lon']})")
        print(f"  Radius    : {result['radius_km']} km")
        print()
