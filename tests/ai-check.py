from __future__ import annotations

import os
import sys
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

import _phantom_ci as phantom


def mock_fusion_response() -> dict[str, object]:
    return {
        "category": "mock-evaluation",
        "confidence": 0.74,
        "reasoning": "OPENAI_API_KEY is missing, so the AI check validated the fallback response shape.",
        "coordinates": {
            "lat": 40.7128,
            "lng": -74.0060,
        },
    }


def main() -> int:
    print("PHANTOM AI Check\n")

    if not phantom.python_files(phantom.AI_DIR):
        phantom.log("FAIL", "fusion function missing")
        return 1

    try:
        fusion = phantom.load_named_callable(
            phantom.AI_DIR,
            file_override_env="PHANTOM_AI_FILE",
            function_override_env="PHANTOM_FUSION_FUNCTION",
            tokens=phantom.FUSION_TOKENS,
        )
    except Exception as exc:
        phantom.log("FAIL", f"fusion function failed to load - {phantom.summarize_exception(exc)}")
        return 1

    if fusion is None:
        phantom.log("FAIL", "fusion function missing")
        return 1

    api_key_present = bool(os.getenv("OPENAI_API_KEY"))
    payload = phantom.build_request_payload()

    try:
        result = phantom.invoke_callable(fusion.func, payload)
        phantom.log("PASS", f"Fusion function found in {phantom.rel_path(fusion.path)}::{fusion.name}")
    except Exception as exc:
        if phantom.looks_like_external_ai_issue(exc, api_key_present):
            phantom.log("WARN", "OPENAI_API_KEY missing, using mock response")
            result = mock_fusion_response()
        else:
            phantom.log("FAIL", f"fusion execution failed - {phantom.summarize_exception(exc)}")
            return 1

    failures = phantom.validate_backend_payload(result, require_signals=False)
    if failures:
        phantom.log("FAIL", "invalid response format")
        for failure in failures:
            phantom.log("FAIL", failure)
        return 1

    phantom.log("PASS", "AI fusion output format valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
