#!/usr/bin/env python3
from __future__ import annotations

import argparse

from life_os_lib import (
    MODULES,
    ROOT,
    average,
    daily_logs_between,
    format_number,
    module_averages,
    parse_daily_log,
    parse_date,
    today_iso,
    top_items,
    write_dashboard_file,
)


def build_suggestions(parsed_logs: list[dict]) -> list[str]:
    if not parsed_logs:
        return ["先补齐最近 7 天 Daily Log。", "每天只抓一个主线动作。", "周末再做一次轻量复盘。"]

    averages = module_averages(parsed_logs)
    module_by_key = {module["key"]: module for module in MODULES}
    weakest = sorted(
        MODULES,
        key=lambda module: averages[module["key"]] / module["max"] if module["max"] else 0,
    )[:2]

    suggestions = []
    for module in weakest:
        suggestions.append(f"给「{module['name']}」安排一个每天 30 分钟以内的最小动作。")

    blockers = top_items([item for parsed in parsed_logs for item in parsed["blockers"]], 1)
    if blockers:
        suggestions.append(f"针对高频阻碍「{blockers[0]}」，提前写一个绕行方案。")
    else:
        suggestions.append("下周复盘时明确记录最大阻碍，避免只记流水账。")

    return suggestions[:3]


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a weekly summary from recent 7 Daily Logs.")
    parser.add_argument("--end-date", default=today_iso(), help="End date in YYYY-MM-DD format. Defaults to today.")
    args = parser.parse_args()

    end_date = parse_date(args.end_date)
    paths = daily_logs_between(end_date, days=7)
    parsed_logs = [parse_daily_log(path) for path in paths]
    week_year, week_number, _ = end_date.isocalendar()
    week_id = f"{week_year}-W{week_number:02d}"
    target_path = ROOT / "logs" / "weekly" / f"{week_id}.md"

    scores = [parsed["total_score"] for parsed in parsed_logs]
    averages = module_averages(parsed_logs)
    wins = top_items([item for parsed in parsed_logs for item in parsed["wins"]], 3)
    blockers = top_items([item for parsed in parsed_logs for item in parsed["blockers"]], 3)
    suggestions = build_suggestions(parsed_logs)

    highest = max(parsed_logs, key=lambda parsed: parsed["total_score"]) if parsed_logs else None
    lowest = min(parsed_logs, key=lambda parsed: parsed["total_score"]) if parsed_logs else None

    lines = [
        f"# Weekly Review - {week_id}",
        "",
        f"- 生成日期: {today_iso()}",
        f"- 覆盖范围: 最近 7 天，截至 {end_date.isoformat()}",
        f"- Daily Logs 数量: {len(parsed_logs)}",
        "",
        "## 1. 本周分数概览",
        "",
        "| 指标 | 结果 |",
        "|---|---:|",
        f"| 周平均分 | {format_number(average(scores))} |",
        f"| 最高分 | {highest['date'] + ' / ' + format_number(highest['total_score']) if highest else '无'} |",
        f"| 最低分 | {lowest['date'] + ' / ' + format_number(lowest['total_score']) if lowest else '无'} |",
        "",
        "## 2. 模块平均分",
        "",
        "| 模块 | 平均分 | 满分 |",
        "|---|---:|---:|",
    ]

    for module in MODULES:
        key = module["key"]
        lines.append(f"| {module['name']} | {format_number(averages[key])} | {module['max']} |")

    lines.extend(
        [
            "",
            "## 3. 最小胜利 Top 3",
            "",
        ]
    )
    lines.extend([f"- {item}" for item in wins] or ["- 暂无记录"])

    lines.extend(["", "## 4. 最大阻碍 Top 3", ""])
    lines.extend([f"- {item}" for item in blockers] or ["- 暂无记录"])

    lines.extend(["", "## 5. 下周建议三件事", ""])
    lines.extend([f"{index}. {item}" for index, item in enumerate(suggestions, start=1)])

    lines.extend(["", "## 6. 原始 Daily Logs", ""])
    lines.extend([f"- [[logs/daily/{path.stem}|{path.stem}]]" for path in paths] or ["- 暂无"])

    content = "\n".join(lines).rstrip() + "\n"
    target_path.write_text(content, encoding="utf-8")
    write_dashboard_file("current_week.md", content)
    print(f"Weekly summary written: {target_path}")
    print("Dashboard current_week.md updated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

