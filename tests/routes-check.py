from __future__ import annotations

import json
import sys
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

import _phantom_ci as phantom


def main() -> int:
    print("PHANTOM Routes Check\n")

    route_files = phantom.python_files(phantom.ROUTES_DIR)
    summaries = phantom.route_summaries()
    if not route_files:
        phantom.log("FAIL", "POST route missing under backend/routes")
        return 1

    if not summaries:
        phantom.log("WARN", "No route decorator detected statically, attempting runtime discovery")

    try:
        host = phantom.load_route_host()
    except Exception as exc:
        phantom.log("FAIL", f"Flask app failed to load - {phantom.summarize_exception(exc)}")
        return 1

    phantom.log(
        "PASS",
        f"Flask app runs from {phantom.rel_path(host.path)} via {host.source_kind}:{host.source_name}",
    )

    try:
        rule = phantom.choose_post_route(host.app)
    except Exception as exc:
        phantom.log("FAIL", f"POST route selection failed - {phantom.summarize_exception(exc)}")
        return 1

    if rule is None:
        phantom.log("FAIL", "POST route missing")
        return 1

    phantom.log("PASS", f"POST route found at {rule.rule}")

    client = host.app.test_client()
    payload = phantom.build_request_payload()

    try:
        response = client.post(rule.rule, json=payload)
    except Exception as exc:
        phantom.log("FAIL", f"API request crashed - {phantom.summarize_exception(exc)}")
        return 1

    if response.status_code >= 400:
        body = response.get_data(as_text=True).strip() or "<empty body>"
        phantom.log("FAIL", f"API returned HTTP {response.status_code}: {body[:300]}")
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

    phantom.log("PASS", "API route working")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
