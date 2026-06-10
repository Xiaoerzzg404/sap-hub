"""Pytest smoke scaffolding for Run01."""

from __future__ import annotations

import importlib.util
import pathlib
import sqlite3

import pytest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
SAPKB_ROOT = REPO_ROOT / "apps" / "sapkb"
HARVEST_FILE = SAPKB_ROOT / "ingest" / "harvest.py"
SCHEMA_FILE = REPO_ROOT / "configs" / "sapkb" / "schema.sql"


def _load_harvest_module():
    spec = importlib.util.spec_from_file_location("sapkb_ingest_harvest", HARVEST_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError("Failed to load harvest module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_harvest_source_fixture_csdn_smoke():
    module = _load_harvest_module()
    records = list(module.harvest_source("fixture_csdn", str(SAPKB_ROOT / "tests" / "fixtures")))
    assert len(records) >= 20
    assert all("body" not in item for item in records)


def test_schema_sql_can_initialize(tmp_path):
    db_path = tmp_path / "sapkb.db"
    sql = SCHEMA_FILE.read_text(encoding="utf-8")
    conn = sqlite3.connect(str(db_path))
    try:
        conn.executescript(sql)
    finally:
        conn.close()


@pytest.mark.skip(reason="TODO: Lead 实现 run_harvest 接口")
def test_cli_harvest_stub():
    assert True


@pytest.mark.skip(reason="TODO: Lead 实现 run_search 接口")
def test_cli_search_stub():
    assert True
