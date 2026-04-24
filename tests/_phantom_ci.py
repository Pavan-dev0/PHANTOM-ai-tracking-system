from __future__ import annotations

import ast
import asyncio
import importlib.util
import inspect
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, is_dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
TESTS_DIR = Path(__file__).resolve().parent

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

FRONTEND_APP_CANDIDATES = [
    ROOT / "frontend" / "src" / "App.js",
    ROOT / "frontend" / "src" / "App.jsx",
    ROOT / "frontend" / "App.js",
    ROOT / "frontend" / "App.jsx",
]

ROUTES_DIR = ROOT / "backend" / "routes"
ENGINE_DIR = ROOT / "backend" / "engine"
AI_DIR = ROOT / "backend" / "ai"

MOVEMENT_TOKENS = ("movement", "zone", "radius", "travel", "distance", "range")
DEVICE_TOKENS = ("device", "anchor", "pin", "triang", "locat", "signal")
FUSION_TOKENS = ("fusion", "fuse", "combine", "synth", "classif", "infer")
ROUTE_TOKENS = ("route", "api", "track", "locate", "predict", "analyze", "phantom")

_MODULE_CACHE: dict[Path, Any] = {}


@dataclass(frozen=True)
class StaticRouteSummary:
    path: Path
    has_route: bool
    has_post_route: bool
    has_flask_object: bool
    has_blueprint_object: bool


@dataclass(frozen=True)
class StaticFunctionRef:
    path: Path
    name: str
    score: int


@dataclass(frozen=True)
class LoadedCallable:
    path: Path
    name: str
    func: Any


@dataclass(frozen=True)
class RouteHost:
    path: Path
    source_name: str
    source_kind: str
    app: Any


def log(level: str, message: str) -> None:
    print(f"{level}: {message}")


def rel_path(path: Path | None) -> str:
    if path is None:
        return "<unknown>"
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def python_files(directory: Path) -> list[Path]:
    if not directory.exists():
        return []
    return sorted(
        path
        for path in directory.rglob("*.py")
        if "__pycache__" not in path.parts and path.is_file()
    )


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def frontend_app_file() -> Path | None:
    for candidate in FRONTEND_APP_CANDIDATES:
        if candidate.exists():
            return candidate
    return None


def frontend_source_files() -> list[Path]:
    source_root = ROOT / "frontend" / "src"
    if not source_root.exists():
        return []
    files: list[Path] = []
    for suffix in (".js", ".jsx", ".ts", ".tsx"):
        files.extend(source_root.rglob(f"*{suffix}"))
    return sorted(path for path in files if path.is_file())


def frontend_has_google_maps_reference() -> bool:
    patterns = (
        "google.com/maps",
        "maps.google.com",
        "google maps",
        "www.google.com/maps",
    )
    for path in frontend_source_files():
        content = read_text(path).lower()
        if any(pattern in content for pattern in patterns):
            return True
    return False


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def parse_ast(path: Path) -> ast.AST | None:
    try:
        return ast.parse(read_text(path), filename=str(path))
    except SyntaxError:
        return None


def _literal_method_names(node: ast.AST | None) -> set[str]:
    if node is None:
        return set()
    if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        values: set[str] = set()
        for item in node.elts:
            if isinstance(item, ast.Constant) and isinstance(item.value, str):
                values.add(item.value.upper())
        return values
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return {node.value.upper()}
    return set()


def _call_name(node: ast.AST | None) -> str:
    if isinstance(node, ast.Attribute):
        return node.attr.lower()
    if isinstance(node, ast.Name):
        return node.id.lower()
    return ""


def route_summaries(directory: Path = ROUTES_DIR) -> list[StaticRouteSummary]:
    summaries: list[StaticRouteSummary] = []
    for path in python_files(directory):
        tree = parse_ast(path)
        if tree is None:
            continue

        has_route = False
        has_post_route = False
        has_flask_object = False
        has_blueprint_object = False

        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                called = _call_name(node.func)
                if called == "flask":
                    has_flask_object = True
                if called == "blueprint":
                    has_blueprint_object = True
                if called in {"route", "get", "post", "put", "patch", "delete"}:
                    has_route = True
                    if called == "post":
                        has_post_route = True
                    for keyword in node.keywords:
                        if keyword.arg == "methods":
                            methods = _literal_method_names(keyword.value)
                            if "POST" in methods:
                                has_post_route = True
                if called == "add_url_rule":
                    has_route = True
                    methods = set()
                    for keyword in node.keywords:
                        if keyword.arg == "methods":
                            methods = _literal_method_names(keyword.value)
                    if "POST" in methods:
                        has_post_route = True

            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call):
                        called = _call_name(decorator.func)
                        if called in {"route", "get", "post", "put", "patch", "delete"}:
                            has_route = True
                            if called == "post":
                                has_post_route = True
                            for keyword in decorator.keywords:
                                if keyword.arg == "methods":
                                    methods = _literal_method_names(keyword.value)
                                    if "POST" in methods:
                                        has_post_route = True

        if has_route or has_flask_object or has_blueprint_object:
            summaries.append(
                StaticRouteSummary(
                    path=path,
                    has_route=has_route,
                    has_post_route=has_post_route,
                    has_flask_object=has_flask_object,
                    has_blueprint_object=has_blueprint_object,
                )
            )

    return sorted(
        summaries,
        key=lambda summary: (
            not summary.has_post_route,
            not summary.has_route,
            not summary.has_flask_object,
            rel_path(summary.path),
        ),
    )


def _score_function_name(name: str, tokens: tuple[str, ...], path: Path) -> int:
    normalized_name = normalize_name(name)
    normalized_path = normalize_name(path.stem)
    score = 0
    for token in tokens:
        if token in normalized_name:
            score += 4
        if token in normalized_path:
            score += 1
    return score


def static_function_refs(
    directory: Path,
    tokens: tuple[str, ...],
) -> list[StaticFunctionRef]:
    refs: list[StaticFunctionRef] = []
    for path in python_files(directory):
        tree = parse_ast(path)
        if tree is None:
            continue
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                score = _score_function_name(node.name, tokens, path)
                if score > 0:
                    refs.append(StaticFunctionRef(path=path, name=node.name, score=score))
    return sorted(refs, key=lambda ref: (-ref.score, rel_path(ref.path), ref.name))


def module_complete_static() -> dict[str, list[str]]:
    missing: list[str] = []

    if frontend_app_file() is None:
        missing.append("frontend App file")

    route_ready = bool(route_summaries()) or bool(python_files(ROUTES_DIR))
    if not route_ready:
        missing.append("backend route")

    if not static_function_refs(ENGINE_DIR, MOVEMENT_TOKENS):
        missing.append("engine movement function")
    if not static_function_refs(ENGINE_DIR, DEVICE_TOKENS):
        missing.append("engine device anchor")
    if not static_function_refs(AI_DIR, FUSION_TOKENS):
        missing.append("fusion function")

    return {"missing": missing}


def resolve_override_path(base_dir: Path, override: str | None) -> Path | None:
    if not override:
        return None

    raw = Path(override)
    candidates = []
    if raw.is_absolute():
        candidates.append(raw)
    else:
        candidates.append(ROOT / raw)
        candidates.append(base_dir / raw)

    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def load_module_from_path(path: Path) -> Any:
    if path in _MODULE_CACHE:
        return _MODULE_CACHE[path]

    module_name = f"phantom_{normalize_name(str(path.relative_to(ROOT)))}"
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module from {rel_path(path)}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    _MODULE_CACHE[path] = module
    return module


def _flask_types() -> tuple[type[Any], type[Any]]:
    try:
        from flask import Blueprint, Flask
    except Exception as exc:  # pragma: no cover - runtime-only guard
        raise RuntimeError("Flask is required to validate backend/routes") from exc

    return Flask, Blueprint


def _supports_zero_arg_factory(candidate: Any) -> bool:
    if not callable(candidate):
        return False
    try:
        signature = inspect.signature(candidate)
    except (TypeError, ValueError):
        return False

    for parameter in signature.parameters.values():
        if (
            parameter.default is inspect._empty
            and parameter.kind
            in (
                inspect.Parameter.POSITIONAL_ONLY,
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                inspect.Parameter.KEYWORD_ONLY,
            )
        ):
            return False
    return True


def _route_host_from_module(module: Any, path: Path, override_attr: str | None) -> RouteHost | None:
    Flask, Blueprint = _flask_types()

    candidates: list[tuple[str, str, Any]] = []
    if override_attr and hasattr(module, override_attr):
        candidates.append((override_attr, "override", getattr(module, override_attr)))
    else:
        for preferred in ("app", "flask_app"):
            if hasattr(module, preferred):
                candidates.append((preferred, "attribute", getattr(module, preferred)))
        for name, value in vars(module).items():
            if name.startswith("_"):
                continue
            candidates.append((name, "attribute", value))

    for name, kind, value in candidates:
        if isinstance(value, Flask):
            value.config["TESTING"] = True
            return RouteHost(path=path, source_name=name, source_kind="flask-app", app=value)

        if isinstance(value, Blueprint):
            temp_app = Flask(f"phantom_blueprint_{normalize_name(name)}")
            temp_app.config["TESTING"] = True
            temp_app.register_blueprint(value)
            return RouteHost(path=path, source_name=name, source_kind="blueprint", app=temp_app)

        if callable(value) and _supports_zero_arg_factory(value):
            try:
                produced = value()
            except Exception:
                continue
            if isinstance(produced, Flask):
                produced.config["TESTING"] = True
                return RouteHost(path=path, source_name=name, source_kind="factory", app=produced)
            if isinstance(produced, Blueprint):
                temp_app = Flask(f"phantom_blueprint_factory_{normalize_name(name)}")
                temp_app.config["TESTING"] = True
                temp_app.register_blueprint(produced)
                return RouteHost(path=path, source_name=name, source_kind="blueprint-factory", app=temp_app)

    return None


def load_route_host() -> RouteHost:
    override_path = resolve_override_path(ROUTES_DIR, os.getenv("PHANTOM_ROUTE_FILE"))
    override_attr = os.getenv("PHANTOM_ROUTE_APP_ATTR")

    candidate_paths: list[Path] = []
    if override_path is not None:
        candidate_paths.append(override_path)
    else:
        candidate_paths.extend(summary.path for summary in route_summaries())
        if not candidate_paths:
            candidate_paths.extend(python_files(ROUTES_DIR))

    if not candidate_paths:
        raise RuntimeError("No route module files found under backend/routes")

    first_error: Exception | None = None
    for path in candidate_paths:
        try:
            module = load_module_from_path(path)
            host = _route_host_from_module(module, path, override_attr)
            if host is not None:
                return host
        except Exception as exc:
            if first_error is None:
                first_error = exc

    if first_error is not None:
        raise first_error
    raise RuntimeError("No Flask app, blueprint, or zero-argument app factory found")


def choose_post_route(app: Any) -> Any | None:
    explicit_path = os.getenv("PHANTOM_ROUTE_PATH")
    rules = [
        rule
        for rule in app.url_map.iter_rules()
        if rule.endpoint != "static" and "POST" in getattr(rule, "methods", set())
    ]
    if explicit_path:
        for rule in rules:
            if rule.rule == explicit_path:
                return rule
        raise RuntimeError(f"Configured PHANTOM_ROUTE_PATH was not found: {explicit_path}")
    if not rules:
        return None

    def score(rule: Any) -> tuple[int, int, str]:
        normalized = normalize_name(rule.rule)
        keyword_score = sum(token in normalized for token in ROUTE_TOKENS)
        return (-keyword_score, len(rule.rule), rule.rule)

    return sorted(rules, key=score)[0]


def build_request_payload(
    *,
    name: str = "Alex Doe",
    lat: float | None = 40.7128,
    lng: float | None = -74.0060,
    hours_missing: float = 4.0,
    notes: str = "Last seen near a transit hub with intermittent device pings.",
    transport: str | None = "car",
    speed: float = 5.0,
) -> dict[str, Any]:
    coordinates = {"lat": lat, "lng": lng}
    signals = {
        "movement": 0.71,
        "cognitive": 0.54,
        "device": 0.82,
    }
    payload = {
        "name": name,
        "person_name": name,
        "subject_name": name,
        "lat": lat,
        "lng": lng,
        "longitude": lng,
        "coordinates": coordinates,
        "location": coordinates,
        "hours": hours_missing,
        "hours_missing": hours_missing,
        "missing_hours": hours_missing,
        "transport": transport,
        "transport_mode": transport,
        "mode": transport,
        "speed": speed,
        "notes": notes,
        "description": notes,
        "signals": signals,
    }
    payload["payload"] = {
        "name": name,
        "coordinates": coordinates,
        "hours_missing": hours_missing,
        "notes": notes,
        "transport": transport,
        "signals": signals,
    }
    return payload


def summarize_exception(exc: BaseException) -> str:
    return f"{exc.__class__.__name__}: {exc}"


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def first_present(mapping: dict[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        if key in mapping:
            return mapping[key]
    return None


def to_data_object(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (dict, list, tuple, str, int, float, bool)):
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("{") or stripped.startswith("["):
                try:
                    return json.loads(stripped)
                except json.JSONDecodeError:
                    return value
        return value
    if is_dataclass(value):
        return asdict(value)
    if hasattr(value, "model_dump") and callable(value.model_dump):
        return value.model_dump()
    if hasattr(value, "dict") and callable(value.dict):
        return value.dict()
    if hasattr(value, "__dict__"):
        return vars(value)
    return value


def extract_coordinates(value: Any) -> tuple[Any, Any] | None:
    data = to_data_object(value)
    if isinstance(data, dict):
        nested = first_present(data, ("coordinates", "coords", "location", "origin"))
        if isinstance(nested, dict):
            lat = first_present(nested, ("lat", "latitude"))
            lng = first_present(nested, ("lng", "lon", "longitude"))
            return lat, lng
        if isinstance(nested, (list, tuple)) and len(nested) >= 2:
            return nested[0], nested[1]
        lat = first_present(data, ("lat", "latitude"))
        lng = first_present(data, ("lng", "lon", "longitude"))
        if lat is not None or lng is not None:
            return lat, lng
    if isinstance(data, (list, tuple)) and len(data) >= 2:
        return data[0], data[1]
    return None


def extract_radius(value: Any) -> Any:
    data = to_data_object(value)
    if is_number(data):
        return data
    if isinstance(data, dict):
        for key in ("radius", "search_radius", "max_radius", "distance", "zone_radius"):
            candidate = data.get(key)
            if is_number(candidate):
                return candidate
        movement = data.get("movement")
        if isinstance(movement, dict):
            return extract_radius(movement)
    if isinstance(data, (list, tuple)):
        for candidate in data:
            if is_number(candidate):
                return candidate
    return None


def validate_backend_payload(
    payload: Any,
    *,
    require_signals: bool = True,
) -> list[str]:
    data = to_data_object(payload)
    failures: list[str] = []

    if not isinstance(data, dict):
        return ["invalid response format"]

    coordinates = extract_coordinates(data)
    if coordinates is None:
        failures.append("coordinates missing")
    else:
        lat, lng = coordinates
        if not is_number(lat) or not is_number(lng):
            failures.append("coordinates.lat/lng must be numeric")

    confidence = data.get("confidence")
    if not is_number(confidence):
        failures.append("confidence must be numeric")
    elif not 0 <= float(confidence) <= 1:
        failures.append("confidence must be between 0 and 1")

    category = data.get("category")
    if not isinstance(category, str) or not category.strip():
        failures.append("category missing")

    reasoning = data.get("reasoning")
    if not isinstance(reasoning, str) or not reasoning.strip():
        failures.append("reasoning missing")

    if require_signals and "signals" not in data:
        failures.append("signals missing")

    return failures


def _parameter_value(parameter_name: str, payload: dict[str, Any]) -> tuple[bool, Any]:
    normalized = normalize_name(parameter_name)

    exact_mapping = {
        "name": payload["name"],
        "personname": payload["name"],
        "subjectname": payload["name"],
        "hours": payload["hours"],
        "hoursmissing": payload["hours_missing"],
        "missinghours": payload["hours_missing"],
        "transport": payload["transport"],
        "transportmode": payload["transport"],
        "mode": payload["transport"],
        "speed": payload["speed"],
        "velocity": payload["speed"],
        "lat": payload["lat"],
        "latitude": payload["lat"],
        "lng": payload["lng"],
        "lon": payload["lng"],
        "longitude": payload["lng"],
        "coordinates": payload["coordinates"],
        "coords": payload["coordinates"],
        "location": payload["coordinates"],
        "origin": payload["coordinates"],
        "position": payload["coordinates"],
        "notes": payload["notes"],
        "description": payload["notes"],
        "signals": payload["signals"],
        "payload": payload["payload"],
        "data": payload["payload"],
        "body": payload["payload"],
        "request": payload["payload"],
        "input": payload["payload"],
        "context": payload["payload"],
        "sample": payload["payload"],
    }
    if normalized in exact_mapping:
        return True, exact_mapping[normalized]

    if "hour" in normalized:
        return True, payload["hours_missing"]
    if "transport" in normalized or normalized.endswith("mode"):
        return True, payload["transport"]
    if "speed" in normalized or "velocity" in normalized:
        return True, payload["speed"]
    if normalized.endswith("lat") or "latitude" in normalized:
        return True, payload["lat"]
    if normalized.endswith("lng") or normalized.endswith("lon") or "longitude" in normalized:
        return True, payload["lng"]
    if "coord" in normalized or "location" in normalized or "origin" in normalized or "position" in normalized:
        return True, payload["coordinates"]
    if "signal" in normalized:
        return True, payload["signals"]
    if "note" in normalized or "reason" in normalized or "desc" in normalized:
        return True, payload["notes"]
    if "name" in normalized:
        return True, payload["name"]
    if "payload" in normalized or "data" in normalized or "request" in normalized:
        return True, payload["payload"]

    return False, None


def _call_attempts(func: Any, payload: dict[str, Any]) -> list[tuple[list[Any], dict[str, Any]]]:
    attempts: list[tuple[list[Any], dict[str, Any]]] = []

    try:
        signature = inspect.signature(func)
    except (TypeError, ValueError):
        return [([], {}), ([payload["payload"]], {}), ([payload["coordinates"]], {})]

    args: list[Any] = []
    kwargs: dict[str, Any] = {}
    compatible = True
    positional_only = False

    for parameter in signature.parameters.values():
        if parameter.kind == inspect.Parameter.VAR_POSITIONAL:
            continue
        if parameter.kind == inspect.Parameter.VAR_KEYWORD:
            continue

        found, value = _parameter_value(parameter.name, payload)
        if not found:
            if parameter.default is inspect._empty:
                compatible = False
                break
            continue

        if parameter.kind == inspect.Parameter.POSITIONAL_ONLY:
            positional_only = True
            args.append(value)
        else:
            kwargs[parameter.name] = value

    if compatible:
        attempts.append((args, kwargs))
        if positional_only and kwargs:
            attempts.append((list(kwargs.values()), {}))

    parameters = list(signature.parameters.values())
    if len(parameters) == 1:
        attempts.append(([payload["payload"]], {}))
        attempts.append(([payload["coordinates"]], {}))
        attempts.append(([payload["hours_missing"]], {}))

    if not attempts:
        attempts.append(([], {}))

    unique_attempts: list[tuple[list[Any], dict[str, Any]]] = []
    seen: set[str] = set()
    for args, kwargs in attempts:
        marker = repr((args, sorted(kwargs.items())))
        if marker not in seen:
            unique_attempts.append((args, kwargs))
            seen.add(marker)
    return unique_attempts


def invoke_callable(func: Any, payload: dict[str, Any]) -> Any:
    last_error: Exception | None = None
    for args, kwargs in _call_attempts(func, payload):
        try:
            result = func(*args, **kwargs)
            if inspect.isawaitable(result):
                return asyncio.run(result)
            return result
        except TypeError as exc:
            last_error = exc
            continue
    if last_error is not None:
        raise last_error
    raise RuntimeError("Unable to invoke callable with PHANTOM sample payload")


def load_named_callable(
    directory: Path,
    *,
    file_override_env: str,
    function_override_env: str,
    tokens: tuple[str, ...],
) -> LoadedCallable | None:
    override_path = resolve_override_path(directory, os.getenv(file_override_env))
    override_name = os.getenv(function_override_env)

    candidate_paths: list[Path] = []
    if override_path is not None:
        candidate_paths.append(override_path)
    else:
        candidate_paths.extend(ref.path for ref in static_function_refs(directory, tokens))
        if not candidate_paths:
            candidate_paths.extend(python_files(directory))

    seen_paths: set[Path] = set()
    unique_paths = [path for path in candidate_paths if not (path in seen_paths or seen_paths.add(path))]

    for path in unique_paths:
        module = load_module_from_path(path)
        if override_name:
            value = getattr(module, override_name, None)
            if callable(value):
                return LoadedCallable(path=path, name=override_name, func=value)

        callables: list[LoadedCallable] = []
        for name, value in vars(module).items():
            if name.startswith("_") or not callable(value):
                continue
            if inspect.isclass(value):
                continue
            if getattr(value, "__module__", None) != module.__name__:
                continue
            score = _score_function_name(name, tokens, path)
            if score > 0:
                callables.append(LoadedCallable(path=path, name=name, func=value))

        if callables:
            return sorted(
                callables,
                key=lambda candidate: (
                    -_score_function_name(candidate.name, tokens, candidate.path),
                    candidate.name,
                ),
            )[0]

    return None


def looks_like_external_ai_issue(exc: BaseException, api_key_present: bool) -> bool:
    if api_key_present:
        return False
    message = str(exc).lower()
    indicators = (
        "openai_api_key",
        "api key",
        "authentication",
        "401",
        "403",
        "connection",
        "timeout",
        "rate limit",
        "no module named 'openai'",
        "module named 'openai'",
    )
    return any(indicator in message for indicator in indicators)
