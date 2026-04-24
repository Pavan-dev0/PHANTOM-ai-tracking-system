from __future__ import annotations

import inspect
import sys
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

import _phantom_ci as phantom


def _has_speed_parameter(func: object) -> bool:
    try:
        signature = inspect.signature(func)
    except (TypeError, ValueError):
        return False

    for parameter in signature.parameters.values():
        name = phantom.normalize_name(parameter.name)
        if "speed" in name or "velocity" in name:
            return True
    return False


def main() -> int:
    print("PHANTOM Engine Check\n")

    warnings: list[str] = []
    failures: list[str] = []

    engine_files = phantom.python_files(phantom.ENGINE_DIR)
    if not engine_files:
        warnings.append("movement zone calculator missing")
        warnings.append("device anchor missing")
    else:
        try:
            movement = phantom.load_named_callable(
                phantom.ENGINE_DIR,
                file_override_env="PHANTOM_ENGINE_FILE",
                function_override_env="PHANTOM_MOVEMENT_FUNCTION",
                tokens=phantom.MOVEMENT_TOKENS,
            )
        except Exception as exc:
            failures.append(f"movement zone calculator failed to load - {phantom.summarize_exception(exc)}")
            movement = None

        if movement is None:
            warnings.append("movement zone calculator missing")
        else:
            phantom.log(
                "PASS",
                f"Movement calculator found in {phantom.rel_path(movement.path)}::{movement.name}",
            )

            try:
                zero_result = phantom.invoke_callable(
                    movement.func,
                    phantom.build_request_payload(hours_missing=0.0, transport="walking", speed=5.0),
                )
            except Exception as exc:
                failures.append(f"hours = 0 case crashed - {phantom.summarize_exception(exc)}")
            else:
                zero_radius = phantom.extract_radius(zero_result)
                if zero_radius is not None and abs(float(zero_radius)) > 1e-6:
                    failures.append("radius should be 0 when hours = 0")

            try:
                phantom.invoke_callable(
                    movement.func,
                    phantom.build_request_payload(hours_missing=2.0, transport=None, speed=5.0),
                )
            except Exception as exc:
                failures.append(f"missing transport case crashed - {phantom.summarize_exception(exc)}")

            try:
                phantom.invoke_callable(
                    movement.func,
                    phantom.build_request_payload(
                        hours_missing=2.0,
                        transport="walking",
                        speed=5.0,
                        lat=None,
                        lng=None,
                    ),
                )
            except Exception as exc:
                failures.append(f"null coordinates case crashed - {phantom.summarize_exception(exc)}")

            try:
                if _has_speed_parameter(movement.func):
                    baseline = phantom.invoke_callable(
                        movement.func,
                        phantom.build_request_payload(hours_missing=2.0, transport="walking", speed=5.0),
                    )
                    radius = phantom.extract_radius(baseline)
                    if radius is None:
                        warnings.append("movement radius output not explicit")
                    else:
                        if not 9.5 <= float(radius) <= 10.5:
                            failures.append("radius should follow speed × hours")
                        elif not 0 <= float(radius) <= 1000:
                            failures.append("radius out of reasonable bounds")
                else:
                    one_hour = phantom.invoke_callable(
                        movement.func,
                        phantom.build_request_payload(hours_missing=1.0, transport="walking"),
                    )
                    two_hours = phantom.invoke_callable(
                        movement.func,
                        phantom.build_request_payload(hours_missing=2.0, transport="walking"),
                    )
                    radius_one = phantom.extract_radius(one_hour)
                    radius_two = phantom.extract_radius(two_hours)
                    if radius_one is None or radius_two is None:
                        warnings.append("movement radius output not explicit")
                    else:
                        if float(radius_one) < 0 or float(radius_two) < 0:
                            failures.append("radius out of reasonable bounds")
                        elif float(radius_two) < float(radius_one):
                            failures.append("radius should grow as hours increase")
                        elif float(radius_one) > 0:
                            ratio = float(radius_two) / float(radius_one)
                            if not 1.5 <= ratio <= 2.5:
                                failures.append("radius should scale with hours")
            except Exception as exc:
                failures.append(f"movement radius validation failed - {phantom.summarize_exception(exc)}")

        try:
            device = phantom.load_named_callable(
                phantom.ENGINE_DIR,
                file_override_env="PHANTOM_ENGINE_FILE",
                function_override_env="PHANTOM_DEVICE_FUNCTION",
                tokens=phantom.DEVICE_TOKENS,
            )
        except Exception as exc:
            failures.append(f"device anchor failed to load - {phantom.summarize_exception(exc)}")
            device = None

        if device is None:
            warnings.append("device anchor missing")
        else:
            phantom.log("PASS", f"Device anchor found in {phantom.rel_path(device.path)}::{device.name}")

            try:
                result = phantom.invoke_callable(device.func, phantom.build_request_payload())
            except Exception as exc:
                failures.append(f"device anchor sample case crashed - {phantom.summarize_exception(exc)}")
            else:
                coords = phantom.extract_coordinates(result)
                if coords is not None:
                    lat, lng = coords
                    if not phantom.is_number(lat) or not phantom.is_number(lng):
                        failures.append("device anchor returned invalid coordinates")

            try:
                phantom.invoke_callable(
                    device.func,
                    phantom.build_request_payload(lat=None, lng=None, transport="walking"),
                )
            except Exception as exc:
                failures.append(f"device anchor null coordinates case crashed - {phantom.summarize_exception(exc)}")

    for warning in warnings:
        phantom.log("WARN", warning)

    if failures:
        for failure in failures:
            phantom.log("FAIL", failure)
        return 1

    if warnings:
        phantom.log("PASS", "Engine validation completed with warnings")
        return 0

    phantom.log("PASS", "Engine logic working")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
