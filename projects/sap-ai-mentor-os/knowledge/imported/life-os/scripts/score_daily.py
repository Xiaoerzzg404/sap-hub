#!/usr/bin/env python3
from __future__ import annotations

import argparse

from life_os_lib import MODULES, append_score_row, daily_log_path, format_number, parse_daily_log, today_iso


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse one Daily Log and append score to dashboard/score_trend.csv.")
    parser.add_argument("--date", default=today_iso(), help="Date in YYYY-MM-DD format. Defaults to today.")
    parser.add_argument("--dry-run", action="store_true", help="Parse and print without appending to score_trend.csv.")
    args = parser.parse_args()

    path = daily_log_path(args.date)
    if not path.exists():
        print(f"Daily Log not found: {path}")
        return 1

    parsed = parse_daily_log(path)
    if not args.dry_run:
        append_score_row(parsed)

    print(f"Date: {parsed['date']}")
    print(f"Raw total: {format_number(parsed['raw_total'])}")
    print(f"Recorded total: {format_number(parsed['total_score'])}")
    for module in MODULES:
        key = module["key"]
        print(f"- {module['name']}: {format_number(parsed['scores'][key])}/{module['max']}")
    if parsed["hard_cap_note"]:
        print(f"Hard cap: {parsed['hard_cap_note']}")
    if args.dry_run:
        print("DRY RUN: score_trend.csv not changed")
    else:
        print("Appended to dashboard/score_trend.csv")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
