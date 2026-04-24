# PHANTOM AI - Device Anchor
# Day 1 | Developer: Naruto

def get_device_anchor(phone_lat=None, phone_lon=None):
    """
    Takes last phone GPS coordinates.
    Returns them cleanly if available, or empty dict if no phone data.
    """
    if phone_lat is not None and phone_lon is not None:
        return {
            "has_phone_data": True,
            "phone_lat": phone_lat,
            "phone_lon": phone_lon
        }
    else:
        return {
            "has_phone_data": False,
            "phone_lat": None,
            "phone_lon": None
        }


# ── Demo Test Cases ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_cases = [
        {"name": "Case 1 - Phone data available", "lat": 12.9350, "lon": 77.6245},
        {"name": "Case 2 - Phone data available", "lat": 28.5355, "lon": 77.3910},
        {"name": "Case 3 - No phone data",        "lat": None,    "lon": None},
    ]

    print("=== PHANTOM | Device Anchor ===\n")
    for case in test_cases:
        result = get_device_anchor(case["lat"], case["lon"])
        print(f"{case['name']}")
        if result["has_phone_data"]:
            print(f"  Phone Location : ({result['phone_lat']}, {result['phone_lon']})")
        else:
            print(f"  Phone Location : No data available")
        print()
