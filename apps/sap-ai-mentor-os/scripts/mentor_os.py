"""Command line interface for SAP AI Mentor OS."""

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from build_prompt import build_prompt
from route_agents import describe_agents, route_agents


ROOT = Path(__file__).resolve().parents[1]


def ask(label: str, default: str | None = None) -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{label}{suffix}: ").strip()
    return value or (default or "")


def iso_week_label(today: date | None = None) -> str:
    current = today or date.today()
    year, week, _weekday = current.isocalendar()
    return f"{year}-W{week:02d}"


def save_log(relative_path: str, title: str, body: str) -> Path:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    content = f"# {title}\n\n{body.rstrip()}\n"
    path.write_text(content, encoding="utf-8")
    return path


def print_prompt(prompt: str) -> None:
    print("\n【可复制 Prompt 开始】\n")
    print(prompt.rstrip())
    print("\n【可复制 Prompt 结束】")


def render_inputs(inputs: dict[str, str]) -> str:
    return "\n".join(f"- {key}：{value}" for key, value in inputs.items())


def run_daily() -> None:
    today = ask("今天日期", date.today().isoformat())
    inputs = {
        "今天日期": today,
        "今天可投入时间": ask("今天可投入时间"),
        "今天最想推进的事情": ask("今天最想推进的事情"),
        "当前最大阻碍": ask("当前最大阻碍"),
        "昨天完成的具体产出": ask("昨天完成的具体产出"),
    }
    context = " ".join(inputs.values())
    selected_agents, warning = route_agents("daily", context)
    prompt = build_prompt("daily", inputs, selected_agents, warning)

    print("\n建议调用的 Agent：")
    print("\n".join(f"- {line}" for line in describe_agents(selected_agents)))
    if warning:
        print(f"\n提醒：{warning}")
    print_prompt(prompt)

    body = _log_body(inputs, selected_agents, warning, prompt)
    path = save_log(f"logs/daily/{today}.md", f"每日计划 {today}", body)
    print(f"\n已保存：{path}")


def run_weekly() -> None:
    week = iso_week_label()
    inputs = {
        "本周可投入时间": ask("本周可投入时间"),
        "本周工作压力": ask("本周工作压力"),
        "上周完成的产出": ask("上周完成的产出"),
        "上周没完成的任务": ask("上周没完成的任务"),
        "当前最大阻碍": ask("当前最大阻碍"),
        "本周想做的任务": ask("本周想做的任务"),
    }
    context = " ".join(inputs.values())
    selected_agents, warning = route_agents("weekly", context)
    weekly_summary = build_weekly_summary(inputs)
    prompt_inputs = {**inputs, **weekly_summary}
    prompt = build_prompt("weekly", prompt_inputs, selected_agents, warning)

    print(f"\n周次：{week}")
    print("\n本周计划摘要：")
    for key, value in weekly_summary.items():
        print(f"\n{key}：\n{value}")
    print("\n建议调用的 Agent：")
    print("\n".join(f"- {line}" for line in describe_agents(selected_agents)))
    if warning:
        print(f"\n提醒：{warning}")
    print_prompt(prompt)

    body = _log_body(prompt_inputs, selected_agents, warning, prompt)
    path = save_log(f"logs/weekly/{week}.md", f"每周计划 {week}", body)
    print(f"\n已保存：{path}")


def run_topic(topic: str) -> None:
    inputs = {"专题": topic}
    selected_agents, warning = route_agents("topic", topic)
    prompt = build_prompt("topic", inputs, selected_agents, warning)

    print("建议调用的 Agent：")
    print("\n".join(f"- {line}" for line in describe_agents(selected_agents)))
    if warning:
        print(f"\n提醒：{warning}")
    print_prompt(prompt)


def run_review() -> None:
    week = iso_week_label()
    inputs = {
        "本周计划目标": ask("本周计划目标"),
        "本周实际完成": ask("本周实际完成"),
        "完成的具体产出物": ask("完成的具体产出物"),
        "没完成的任务": ask("没完成的任务"),
        "没完成原因": ask("没完成原因"),
        "下周可用时间": ask("下周可用时间"),
    }
    context = " ".join(inputs.values())
    selected_agents, warning = route_agents("review", context)
    prompt = build_prompt("review", inputs, selected_agents, warning)

    print("\n建议调用的 Agent：")
    print("\n".join(f"- {line}" for line in describe_agents(selected_agents)))
    if warning:
        print(f"\n提醒：{warning}")
    print_prompt(prompt)

    body = _log_body(inputs, selected_agents, warning, prompt)
    path = save_log(f"logs/weekly/review-{week}.md", f"周复盘 {week}", body)
    print(f"\n已保存：{path}")


def build_weekly_summary(inputs: dict[str, str]) -> dict[str, str]:
    tasks = split_tasks(inputs.get("本周想做的任务", ""))
    if not tasks:
        tasks = ["明确一个 Finance AI 主题", "产出一个可保存成果", "完成一次周复盘"]
    top_goals = tasks[:3]
    deliverables = [task_to_deliverable(task) for task in top_goals]
    standards = [task_to_standard(task) for task in top_goals]
    return {
        "本周最重要 3 个目标": numbered(top_goals),
        "本周产出物清单": bullets(deliverables),
        "每个任务的最小完成标准": bullets(standards),
    }


def split_tasks(text: str) -> list[str]:
    normalized = text.replace("；", ";").replace("，", ",").replace("、", ",").replace("\n", ",")
    parts = []
    for chunk in normalized.replace(";", ",").split(","):
        item = chunk.strip(" -\t")
        if item:
            parts.append(item)
    return parts


def task_to_deliverable(task: str) -> str:
    return f"{task}：形成一份可保存的 Markdown 输出物或 Demo 草图"


def task_to_standard(task: str) -> str:
    return f"{task}：至少写清背景、目标、步骤、最小成果和下次行动"


def numbered(items: list[str]) -> str:
    return "\n".join(f"{index}. {item}" for index, item in enumerate(items, start=1))


def bullets(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def _log_body(
    inputs: dict[str, str],
    selected_agents: list[str],
    warning: str | None,
    prompt: str,
) -> str:
    warning_text = warning or "无"
    agents = "\n".join(f"- {line}" for line in describe_agents(selected_agents))
    return f"""## 输入

{render_inputs(inputs)}

## 路由结果

{agents}

## 提醒

{warning_text}

## 可复制 Prompt

```text
{prompt.rstrip()}
```
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="SAP AI Mentor OS 本地控制台")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("daily", help="生成每日计划 Prompt")
    subparsers.add_parser("weekly", help="生成每周计划 Prompt")
    topic_parser = subparsers.add_parser("topic", help="生成专题深挖 Prompt")
    topic_parser.add_argument("topic", help="专题名称，例如：月结关账AI助手Demo")
    subparsers.add_parser("review", help="生成周复盘 Prompt")
    args = parser.parse_args()

    if args.command == "daily":
        run_daily()
    elif args.command == "weekly":
        run_weekly()
    elif args.command == "topic":
        run_topic(args.topic)
    elif args.command == "review":
        run_review()


if __name__ == "__main__":
    main()
