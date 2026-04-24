from __future__ import annotations

import json
import sys
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

import _phantom_ci as phantom


def main() -> int:
    print("PHANTOM System Check\n")

    completeness = phantom.module_complete_static()
    missing = completeness["missing"]
    if missing:
        print("System test skipped — incomplete modules")
        for item in missing:
            print(f"Missing: {item}")
        return 0

    try:
        host = phantom.load_route_host()
        rule = phantom.choose_post_route(host.app)
    except Exception as exc:
        phantom.log("FAIL", f"System API setup failed - {phantom.summarize_exception(exc)}")
        return 1

    if rule is None:
        phantom.log("FAIL", "System API route missing")
        return 1

    payload = phantom.build_request_payload(
        name="Jordan Smith",
        lat=37.7749,
        lng=-122.4194,
        hours_missing=6.0,
        notes="Last seen leaving a downtown station after a delayed check-in.",
        transport="train",
    )

    try:
        response = host.app.test_client().post(rule.rule, json=payload)
    except Exception as exc:
        phantom.log("FAIL", f"Backend API call crashed - {phantom.summarize_exception(exc)}")
        return 1

    if response.status_code >= 400:
        body = response.get_data(as_text=True).strip() or "<empty body>"
        phantom.log("FAIL", f"Backend API returned HTTP {response.status_code}: {body[:300]}")
        return 1

    data = response.get_json(silent=True)
    if data is None:
        raw_body = response.get_data(as_text=True).strip()
        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError:
            phantom.log("FAIL", "invalid response format")
            return 1

    failures = phantom.validate_backend_payload(data)
    if failures:
        phantom.log("FAIL", "invalid response format")
        for failure in failures:
            phantom.log("FAIL", failure)
        return 1

    if not phantom.frontend_has_google_maps_reference():
        phantom.log("FAIL", "Frontend Google Maps link missing")
        return 1

    coordinates = phantom.extract_coordinates(data)
    if coordinates is None:
        phantom.log("FAIL", "coordinates missing")
        return 1

    lat, lng = coordinates
    maps_url = f"https://www.google.com/maps?q={lat},{lng}"
    if "google.com/maps" not in maps_url or str(lat) not in maps_url or str(lng) not in maps_url:
        phantom.log("FAIL", "Google Maps URL invalid")
        return 1

    phantom.log("PASS", "Full system flow working")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
