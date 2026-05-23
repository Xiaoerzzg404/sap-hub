#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt

from life_os_lib import (
    MODULES,
    average,
    format_number,
    latest_score_rows_by_date,
    monthly_target_rows,
    parse_date,
    today_iso,
    write_dashboard_file,
)


def as_float(value: str | None) -> float:
    try:
        return float(value or 0)
    except ValueError:
        return 0.0


def current_month() -> str:
    return today_iso()[:7]


def recent_rows(rows: list[dict], days: int = 7) -> list[dict]:
    return rows[-days:]


def week_average(rows: list[dict]) -> float:
    today = parse_date(today_iso())
    start = today - dt.timedelta(days=6)
    values = []
    for row in rows:
        try:
            date_value = parse_date(row["date"])
        except (KeyError, ValueError):
            continue
        if start <= date_value <= today:
            values.append(as_float(row.get("total_score")))
    return average(values)


def month_average(rows: list[dict], month: str) -> float:
    values = [as_float(row.get("total_score")) for row in rows if row.get("date", "").startswith(month)]
    return average(values)


def pillar_status(rows: list[dict]) -> list[dict]:
    recent = recent_rows(rows, 7)
    mapping = [
        ("SAP项目现金流", "sap_project", 25),
        ("SAP AI能力", "sap_ai", 20),
        ("SAP知识库", "knowledge", 15),
        ("Walldorf来信自媒体", "self_media", 15),
        ("SAP日语培训", "speaking", 10),
        ("第二人生基地", "second_life", 5),
        ("家庭与健康", "health_family", 10),
    ]
    result = []
    for label, key, max_score in mapping:
        values = [as_float(row.get(key)) for row in recent]
        avg = average(values)
        ratio = avg / max_score if max_score else 0
        if not values or avg == 0:
            status = "未见记录"
        elif ratio >= 0.7:
            status = "推进行中"
        elif ratio >= 0.4:
            status = "需要补强"
        else:
            status = "偏弱"
        result.append({"label": label, "avg": avg, "status": status})
    return result


def main() -> int:
    rows = latest_score_rows_by_date()
    month = current_month()
    recent = recent_rows(rows, 7)
    target_rows = monthly_target_rows(month)

    lines = [
        "# Life OS Dashboard",
        "",
        f"- 当前日期: {today_iso()}",
        f"- 本周平均分: {format_number(week_average(rows))}",
        f"- 本月平均分: {format_number(month_average(rows, month))}",
        "",
        "## 1. 最近 7 天分数",
        "",
        "| 日期 | 总分 | SAP项目 | SAP AI | 知识库 | 自媒体 | 口播 | 第二人生 | 身体家庭 |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]

    for row in recent:
        lines.append(
            "| {date} | {total_score} | {sap_project} | {sap_ai} | {knowledge} | {self_media} | "
            "{speaking} | {second_life} | {health_family} |".format(**{key: row.get(key, "") for key in [
                "date",
                "total_score",
                "sap_project",
                "sap_ai",
                "knowledge",
                "self_media",
                "speaking",
                "second_life",
                "health_family",
            ]})
        )

    if not recent:
        lines.append("| 暂无 |  |  |  |  |  |  |  |  |")

    lines.extend(["", "## 2. 本月目标达成情况", "", "| 目标 | 实际 | 目标值 | 状态 |", "|---|---:|---:|---|"])
    for row in target_rows:
        lines.append(
            f"| {row['label']} | {format_number(row['actual'])} | {format_number(row['target'])} | {row['status']} |"
        )

    lines.extend(["", "## 3. 七大主线推进状态", "", "| 主线 | 最近7天平均 | 状态 |", "|---|---:|---|"])
    for row in pillar_status(rows):
        lines.append(f"| {row['label']} | {format_number(row['avg'])} | {row['status']} |")

    lines.extend(
        [
            "",
            "## 4. 快速入口",
            "",
            "- [[dashboard/current_week|Current Week]]",
            "- [[dashboard/current_month|Current Month]]",
            "- [[logs/daily/|Daily Logs]]",
            "- [[logs/weekly/|Weekly Reviews]]",
            "- [[logs/monthly/|Monthly Reviews]]",
            "",
            "## 5. 今天建议",
            "",
            "- 先打开今天的 Daily Log。",
            "- 只写一个今日主线任务。",
            "- 晚上填写最小胜利、最大阻碍和明日第一动作。",
        ]
    )

    path = write_dashboard_file("index.md", "\n".join(lines))
    print(f"Dashboard written: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

