"""SAPKB command line interface."""
from __future__ import annotations

import argparse
import json
import os
from typing import Any, Dict

if __package__ in (None, ""):
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    import pipeline
else:
    from . import pipeline  # type: ignore

DEFAULT_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "sapkb.db"))
DEFAULT_VAULT_ROOT = os.path.expanduser("~/sap-hub/vaults/SAP_EXTKB")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="sapkb")
    subparsers = parser.add_subparsers(dest="command")

    harvest_parser = subparsers.add_parser("harvest", help="Run source harvest")
    harvest_parser.add_argument("--source", required=True)
    harvest_parser.add_argument("--db-path", default=DEFAULT_DB_PATH)
    harvest_parser.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)

    search_parser = subparsers.add_parser("search", help="Search SAPKB documents")
    search_parser.add_argument("query", help="Search keyword")
    search_parser.add_argument("--db-path", default=DEFAULT_DB_PATH)

    s2 = subparsers.add_parser("dedup-stage2", help="近重复扫描（不自动归并，产 needs_review 候选）")
    s2.add_argument("--db-path", default=DEFAULT_DB_PATH)
    s2.add_argument("--backend", default="charngram", choices=["charngram", "bge_m3"])
    s2.add_argument("--threshold", type=float, default=None)
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return
    if args.command == "harvest":
        result = pipeline.run_harvest(args.source, args.db_path, args.vault_root)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "search":
        results = pipeline.run_search(args.query, args.db_path)
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return
    if args.command == "dedup-stage2":
        result = pipeline.run_dedup_stage2(args.db_path, args.backend, args.threshold)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return


def get_default_paths() -> Dict[str, str]:
    return {"db_path": DEFAULT_DB_PATH, "vault_root": DEFAULT_VAULT_ROOT}


if __name__ == "__main__":
    main()
