#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from life_os_lib import ROOT, daily_log_path, today_iso


def render_daily_log(date_text: str) -> str:
    template_path = ROOT / "templates" / "daily_log.md"
    return template_path.read_text(encoding="utf-8").replace("{{date}}", date_text)


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a Daily Log from templates/daily_log.md.")
    parser.add_argument("--date", default=today_iso(), help="Date in YYYY-MM-DD format. Defaults to today.")
    parser.add_argument("--dry-run", action="store_true", help="Print target path without writing.")
    args = parser.parse_args()

    target_path = daily_log_path(args.date)
    if args.dry_run:
        print(f"DRY RUN: would create {target_path}")
        return 0

    if target_path.exists():
        print(f"Daily Log already exists: {target_path}")
        return 0

    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(render_daily_log(args.date), encoding="utf-8")
    print(f"Created Daily Log: {target_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

