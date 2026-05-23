#!/usr/bin/env python3
from __future__ import annotations

import argparse

from life_os_lib import (
    MODULES,
    ROOT,
    format_number,
    module_averages,
    monthly_actuals,
    monthly_target_rows,
    parse_date,
    today_iso,
    top_items,
    write_dashboard_file,
)


def current_month() -> str:
    return today_iso()[:7]


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a monthly summary from Daily Logs.")
    parser.add_argument("--month", default=current_month(), help="Month in YYYY-MM format. Defaults to current month.")
    args = parser.parse_args()

    month = args.month
    data = monthly_actuals(month)
    parsed_logs = data["parsed_logs"]
    target_rows = monthly_target_rows(month)
    averages = module_averages(parsed_logs)
    wins = top_items([item for parsed in parsed_logs for item in parsed["wins"]], 5)
    blockers = top_items([item for parsed in parsed_logs for item in parsed["blockers"]], 5)

    target_path = ROOT / "logs" / "monthly" / f"{month}.md"

    lines = [
        f"# Monthly Review - {month}",
        "",
        f"- 生成日期: {today_iso()}",
        f"- Daily Logs 数量: {len(parsed_logs)}",
        "",
        "## 1. 月度目标达成情况",
        "",
        "| 目标 | 实际 | 目标值 | 状态 |",
        "|---|---:|---:|---|",
    ]

    for row in target_rows:
        lines.append(
            f"| {row['label']} | {format_number(row['actual'])} | {format_number(row['target'])} | {row['status']} |"
        )

    lines.extend(["", "## 2. 模块平均分", "", "| 模块 | 平均分 | 满分 |", "|---|---:|---:|"])
    for module in MODULES:
        key = module["key"]
        lines.append(f"| {module['name']} | {format_number(averages[key])} | {module['max']} |")

    lines.extend(["", "## 3. 本月最小胜利 Top 5", ""])
    lines.extend([f"- {item}" for item in wins] or ["- 暂无记录"])

    lines.extend(["", "## 4. 本月最大阻碍 Top 5", ""])
    lines.extend([f"- {item}" for item in blockers] or ["- 暂无记录"])

    red_rows = [row for row in target_rows if row["status"] == "RED"]
    yellow_rows = [row for row in target_rows if row["status"] == "YELLOW"]

    lines.extend(["", "## 5. 下月建议三件事", ""])
    if red_rows:
        lines.append(f"1. 优先修复 RED 指标：「{red_rows[0]['label']}」。")
    else:
        lines.append("1. 保持当前节奏，把 GREEN 指标沉淀成固定习惯。")
    if yellow_rows:
        lines.append(f"2. 把 YELLOW 指标「{yellow_rows[0]['label']}」拆成每周小目标。")
    else:
        lines.append("2. 选择一条五年主线加码，避免平均用力。")
    lines.append("3. 每周至少一次把项目经验写入知识库，形成可复用资产。")

    lines.extend(["", "## 6. 原始 Daily Logs", ""])
    lines.extend([f"- [[logs/daily/{parsed['date']}|{parsed['date']}]]" for parsed in parsed_logs] or ["- 暂无"])

    content = "\n".join(lines).rstrip() + "\n"
    target_path.write_text(content, encoding="utf-8")
    write_dashboard_file("current_month.md", content)
    print(f"Monthly summary written: {target_path}")
    print("Dashboard current_month.md updated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

