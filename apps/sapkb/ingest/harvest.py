"""Harvest helpers for SAPKB ingest.

This module keeps mechanical responsibilities only:
- parse acquisition source config
- read fixture source payload
- normalize metadata records
- avoid any persistence logic
"""

from __future__ import annotations

import argparse
import json
import pathlib
from typing import Any, Dict, Generator, Optional

import yaml

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
DEFAULT_CONFIG_PATH = REPO_ROOT / "configs" / "sapkb" / "acquisition_sources.yaml"
DEFAULT_FIXTURES_DIR = pathlib.Path(__file__).resolve().parents[1] / "tests" / "fixtures"


def _load_sources_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """Read acquisition source yaml config."""
    path = pathlib.Path(config_path) if config_path else DEFAULT_CONFIG_PATH
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise TypeError("acquisition_sources.yaml must contain a top-level mapping")
    return data


def _find_source_meta(config: Dict[str, Any], source_id: str) -> Dict[str, Any]:
    """Find source item by id, fallback {} when missing."""
    for source in config.get("sources", []):
        if not isinstance(source, dict):
            continue
        if source.get("id") == source_id:
            return source
    return {}


def _iter_fixture_records(fixtures_dir: str) -> Generator[Dict[str, Any], None, None]:
    """Iterate JSONL fixture records and yield dict payloads."""
    fixture_file = pathlib.Path(fixtures_dir) / "csdn_sample.jsonl"
    with fixture_file.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON in {fixture_file}: line {line_no}") from exc
            if not isinstance(record, dict):
                raise TypeError(f"Invalid fixture record at {fixture_file}:{line_no}")
            yield record


def _normalize_metadata_record(
    raw: Dict[str, Any],
    import_mode: str,
) -> Dict[str, Any]:
    """Normalize one raw metadata record to the required harvest schema."""
    normalized: Dict[str, Any] = {
        "source_platform": raw.get("source_platform") or raw.get("platform") or "",
        "source_url": raw.get("source_url"),
        "title": raw.get("title"),
        "author": raw.get("author"),
        "author_uid": raw.get("author_uid"),
        "published_at": raw.get("published_at"),
        "summary": raw.get("summary"),
        "import_mode": import_mode,
    }

    # 明确丢弃正文字段，确保仅持久化元数据。
    for key in ("body", "content", "text", "raw_text"):
        raw.pop(key, None)
    normalized["source_platform"] = (
        normalized["source_platform"].upper() if normalized["source_platform"] else "CSDN"
    )

    # source_id=fixture_csdn 时强制 metadata-only。
    if not normalized["import_mode"]:
        normalized["import_mode"] = "metadata_only"

    return normalized


def harvest_source(
    source_id: str,
    fixtures_dir: str,
) -> Generator[Dict[str, Any], None, None]:
    """Yield normalized metadata records for one source.

    Args:
        source_id: source identifier, supports ``fixture_csdn`` for local smoke flow.
        fixtures_dir: fixture directory path.
    """
    config = _load_sources_config()
    source_meta = _find_source_meta(config, source_id)

    if source_id == "fixture_csdn":
        import_mode = source_meta.get("import_mode", "metadata_only")
        for item in _iter_fixture_records(fixtures_dir):
            normalized = _normalize_metadata_record(
                item,
                import_mode=import_mode,
            )
            yield normalized
        return

    raise NotImplementedError("Harvest source implementation is handled by Lead/Worker in this run")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="SAPKB harvest helper")
    parser.add_argument(
        "--source",
        default="fixture_csdn",
        help="Source id to harvest, currently fixture_csdn is supported.",
    )
    parser.add_argument(
        "--fixtures-dir",
        default=str(DEFAULT_FIXTURES_DIR),
        help="Directory containing tests fixtures JSONL",
    )
    return parser


def main() -> None:
    """CLI entry for local fixture smoke only."""
    args = _build_parser().parse_args()
    for record in harvest_source(args.source, args.fixtures_dir):
        print(json.dumps(record, ensure_ascii=False))


if __name__ == "__main__":
    main()
