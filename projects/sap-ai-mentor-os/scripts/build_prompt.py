"""Prompt builder for SAP AI Mentor OS."""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Mapping

from route_agents import AGENT_META, describe_agents, route_agents


ROOT = Path(__file__).resolve().parents[1]
PROFILE_PATH = ROOT / "config" / "profile.yaml"
AGENTS_DIR = ROOT / "agents"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def extract_section(markdown: str, heading: str) -> str:
    pattern = rf"^## {re.escape(heading)}\s*\n(?P<body>.*?)(?=^## |\Z)"
    match = re.search(pattern, markdown, flags=re.MULTILINE | re.DOTALL)
    if not match:
        return ""
    return match.group("body").strip()


def load_agent_summary(agent_id: str) -> dict[str, str]:
    meta = AGENT_META[agent_id]
    markdown = read_text(AGENTS_DIR / meta.file_name)
    return {
        "id": agent_id,
        "name": extract_section(markdown, "Agent 名称") or meta.name,
        "role": extract_section(markdown, "Agent 角色"),
        "responsibility": extract_section(markdown, "负责的问题"),
        "output_format": extract_section(markdown, "输出格式"),
        "next_report": extract_section(markdown, "下次汇报要求"),
    }


def build_prompt(
    mode: str,
    user_inputs: Mapping[str, str],
    agent_ids: list[str],
    warning: str | None = None,
) -> str:
    profile = read_text(PROFILE_PATH)
    agent_summaries = [load_agent_summary(agent_id) for agent_id in agent_ids]

    current_task = _current_task(mode, user_inputs)
    required_outputs = _required_outputs(mode)
    output_format = _output_format(mode)
    minimum_delivery = _minimum_delivery(mode, user_inputs)
    next_report = _next_report(agent_summaries)
    warning_block = f"\n\n重要提醒：{warning}\n" if warning else ""

    agent_lines = "\n".join(f"- {line}" for line in describe_agents(agent_ids))
    duty_blocks = "\n\n".join(
        (
            f"### {summary['id']}｜{summary['name']}\n"
            f"角色：{summary['role']}\n\n"
            f"本次职责：\n{summary['responsibility']}"
        )
        for summary in agent_summaries
    )

    return f"""请你作为我的 SAP FICO × Business AI × 日本项目实战训练导师团队，按以下要求协作输出。{warning_block}
## 1. 我的背景

以下是我的长期背景和原则，请严格遵守：

```yaml
{profile}
```

## 2. 当前任务

{current_task}

## 3. 本次调用的 Agent

{agent_lines}

## 4. 每个 Agent 的职责

{duty_blocks}

## 5. 需要输出的内容

{required_outputs}

## 6. 输出格式

{output_format}

## 7. 限制条件

- 全部使用中文输出，只有日语话术或 SAP / API / 产品专有名词可以保留原文。
- 不要要求我提供客户机密、个人敏感信息、真实财务数据或系统凭据。
- 不要连接外部系统，不要假设你能访问我的真实 SAP 环境。
- 所有建议必须服务于“SAP Finance 主业 + Business AI 差异化 + 可展示输出物”。
- 每周最多聚焦 3 个目标，每次最多调用 3 个专业 Agent。
- 如果信息不足，请标注“需要我补充”，不要编造。

## 8. 最小可交付成果

{minimum_delivery}

## 9. 下次我应该汇报什么

{next_report}
"""


def _current_task(mode: str, user_inputs: Mapping[str, str]) -> str:
    lines = []
    title = {
        "daily": "每日计划",
        "weekly": "每周计划",
        "topic": "专题深挖",
        "review": "周复盘",
    }.get(mode, mode)
    lines.append(f"任务类型：{title}")
    for key, value in user_inputs.items():
        if value:
            lines.append(f"- {key}：{value}")
    return "\n".join(lines)


def _required_outputs(mode: str) -> str:
    if mode == "daily":
        return "\n".join(
            [
                "- 今天最重要的 1 到 3 个判断。",
                "- 建议调用这些 Agent 的理由。",
                "- 今天行动清单，按优先级排序。",
                "- 今天最小可交付成果。",
                "- 当前阻碍的处理建议。",
            ]
        )
    if mode == "weekly":
        return "\n".join(
            [
                "- 本周最重要 3 个目标。",
                "- 建议调用的 Agent 与调用顺序。",
                "- 本周产出物清单。",
                "- 每个任务的最小完成标准。",
                "- 本周节奏安排和风险提醒。",
            ]
        )
    if mode == "review":
        return "\n".join(
            [
                "- 本周完成与未完成对照。",
                "- 未完成原因分类。",
                "- 值得保留、停止、调整的行为。",
                "- 下周最多 3 个目标。",
                "- 下周最小可交付成果。",
            ]
        )
    return "\n".join(
        [
            "- 专题的业务背景和 SAP Finance 关联流程。",
            "- Business AI / Joule 的可能介入点。",
            "- Demo / PoC 或输出物设计。",
            "- 风险、权限、治理和人工确认边界。",
            "- 可转成文章、课程、模板或商业化素材的部分。",
        ]
    )


def _output_format(mode: str) -> str:
    if mode == "topic":
        return "\n".join(
            [
                "1. 一句话结论",
                "2. 业务流程拆解",
                "3. AI 用例设计",
                "4. Demo / PoC 方案",
                "5. 治理与风险",
                "6. 可产出素材",
                "7. 下一步行动",
            ]
        )
    return "\n".join(
        [
            "1. 先给结论",
            "2. 再给优先级",
            "3. 然后给行动清单",
            "4. 明确最小交付成果",
            "5. 最后列出下次汇报内容",
        ]
    )


def _minimum_delivery(mode: str, user_inputs: Mapping[str, str]) -> str:
    if mode == "daily":
        focus = user_inputs.get("今天最想推进的事情", "一个可展示的小产出")
        return f"今天至少交付：围绕“{focus}”形成一份可保存的输出物，例如用例卡、Demo 草图、文章提纲、日语话术或学习卡。"
    if mode == "weekly":
        return "本周至少交付 1 到 3 个可保存产出物，并为每个目标写清最小完成标准。"
    if mode == "review":
        return "本次至少交付一份下周可执行的 3 目标计划，并明确一个需要删除或延后的任务。"
    topic = user_inputs.get("专题", "当前专题")
    return f"本次至少交付一份“{topic}”专题卡：包含业务痛点、AI 介入点、Demo 思路、风险边界和下一步。"


def _next_report(agent_summaries: list[dict[str, str]]) -> str:
    lines = []
    for summary in agent_summaries:
        if summary["next_report"]:
            lines.append(f"- {summary['name']}：{summary['next_report']}")
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="生成可复制到 ChatGPT 的 Prompt")
    parser.add_argument("mode", choices=["daily", "weekly", "topic", "review"])
    parser.add_argument("text", nargs="*", help="主题或上下文")
    args = parser.parse_args()

    text = " ".join(args.text)
    selected_agents, route_warning = route_agents(args.mode, text)
    prompt = build_prompt(args.mode, {"输入": text}, selected_agents, route_warning)
    print(prompt)
