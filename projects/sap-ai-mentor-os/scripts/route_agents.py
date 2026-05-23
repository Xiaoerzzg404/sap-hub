"""Agent routing rules for SAP AI Mentor OS.

This module intentionally uses only the Python standard library.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class AgentMeta:
    agent_id: str
    name: str
    file_name: str
    is_core: bool = False


AGENT_META: dict[str, AgentMeta] = {
    "00_orchestrator": AgentMeta("00_orchestrator", "总控战略导师", "00_orchestrator.md", True),
    "01_positioning": AgentMeta("01_positioning", "职业定位与市场战略导师", "01_positioning.md"),
    "02_s4hana_finance": AgentMeta("02_s4hana_finance", "S/4HANA Finance 深化导师", "02_s4hana_finance.md"),
    "03_sap_business_ai": AgentMeta("03_sap_business_ai", "SAP Business AI / Joule 导师", "03_sap_business_ai.md"),
    "04_btp_clean_core": AgentMeta("04_btp_clean_core", "BTP / Clean Core 架构导师", "04_btp_clean_core.md"),
    "05_finance_ai_usecases": AgentMeta("05_finance_ai_usecases", "Finance AI 用例设计导师", "05_finance_ai_usecases.md"),
    "06_demo_poc": AgentMeta("06_demo_poc", "Demo / PoC 制作教练", "06_demo_poc.md"),
    "07_data_cfo_reporting": AgentMeta("07_data_cfo_reporting", "数据分析与 CFO 报表导师", "07_data_cfo_reporting.md"),
    "08_ai_governance": AgentMeta("08_ai_governance", "AI 治理 / 安全 / 权限导师", "08_ai_governance.md"),
    "09_japanese_presales": AgentMeta("09_japanese_presales", "日语商务沟通与售前导师", "09_japanese_presales.md"),
    "10_course_productization": AgentMeta("10_course_productization", "知识产品化与课程设计导师", "10_course_productization.md"),
    "11_certification_roadmap": AgentMeta("11_certification_roadmap", "认证与学习路线规划导师", "11_certification_roadmap.md"),
    "12_business_model": AgentMeta("12_business_model", "商业化与产品设计导师", "12_business_model.md"),
    "13_weekly_review": AgentMeta("13_weekly_review", "周复盘与执行教练", "13_weekly_review.md", True),
}


KEYWORD_RULES: dict[str, list[str]] = {
    "01_positioning": ["职业", "定位", "市场", "个人品牌", "差异化", "岗位", "简历"],
    "02_s4hana_finance": [
        "月结",
        "关账",
        "FI",
        "CO",
        "AP",
        "AR",
        "资产",
        "成本",
        "Universal Journal",
        "总账",
        "管理会计",
    ],
    "03_sap_business_ai": ["AI", "Joule", "Generative AI", "Business AI", "copilot", "智能助手"],
    "04_btp_clean_core": ["BTP", "Clean Core", "API", "Integration", "extension", "side-by-side", "架构"],
    "05_finance_ai_usecases": ["用例", "场景", "Finance AI", "业务价值", "pain point", "ROI", "自动化"],
    "06_demo_poc": ["Demo", "PoC", "原型", "演示", "prototype", "可展示"],
    "07_data_cfo_reporting": ["数据", "CFO", "报表", "KPI", "分析", "dashboard", "SAC", "财务分析"],
    "08_ai_governance": ["权限", "安全", "审计", "治理", "合规", "风险", "数据保护", "访问控制"],
    "09_japanese_presales": ["日语", "提案", "客户", "Workshop", "面试", "售前", "商谈", "日本项目"],
    "10_course_productization": ["课程", "训练营", "文章", "模板", "教材", "知识产品", "内容"],
    "11_certification_roadmap": ["认证", "考试", "学习路线", "certification", "备考", "证书"],
    "12_business_model": ["商业化", "收费", "咨询包", "服务产品", "定价", "产品设计", "变现"],
}


GENERIC_HINT = "当前主题过泛，需要缩小到一个业务流程、一个产出物或一个具体场景。"
GENERIC_DEFAULT = ["00_orchestrator", "02_s4hana_finance", "05_finance_ai_usecases", "13_weekly_review"]


def _keyword_hits(text: str, keywords: Iterable[str]) -> int:
    normalized = text.casefold()
    hits = 0
    seen: set[str] = set()
    for keyword in keywords:
        key = keyword.casefold()
        if key in seen:
            continue
        if key and key in normalized:
            hits += 1
            seen.add(key)
    return hits


def score_professional_agents(text: str) -> list[tuple[str, int]]:
    """Return professional agents sorted by keyword score."""

    scores: list[tuple[str, int]] = []
    for agent_id, keywords in KEYWORD_RULES.items():
        score = _keyword_hits(text, keywords)
        if score > 0:
            scores.append((agent_id, score))
    order = {agent_id: index for index, agent_id in enumerate(KEYWORD_RULES)}
    scores.sort(key=lambda item: (-item[1], order[item[0]]))
    return scores


def route_agents(mode: str, text: str) -> tuple[list[str], str | None]:
    """Choose agents for daily, weekly, topic, or review workflows."""

    cleaned = " ".join(text.strip().split())
    scored = score_professional_agents(cleaned)
    warning: str | None = None

    if not cleaned or not scored:
        warning = GENERIC_HINT
        return GENERIC_DEFAULT[:], warning

    top_professionals = [agent_id for agent_id, _score in scored]

    if mode == "daily":
        return _unique(["00_orchestrator", "13_weekly_review", top_professionals[0]]), warning

    if mode == "weekly":
        return _unique(["00_orchestrator", "13_weekly_review", top_professionals[0]]), warning

    if mode == "review":
        return _unique(["00_orchestrator", "13_weekly_review", top_professionals[0]]), warning

    if mode == "topic":
        return _unique(["00_orchestrator", *top_professionals[:3]]), warning

    return _unique(["00_orchestrator", *top_professionals[:3]]), warning


def describe_agents(agent_ids: Iterable[str]) -> list[str]:
    descriptions = []
    for agent_id in agent_ids:
        meta = AGENT_META[agent_id]
        descriptions.append(f"{agent_id}：{meta.name}")
    return descriptions


def _unique(agent_ids: Iterable[str]) -> list[str]:
    result: list[str] = []
    for agent_id in agent_ids:
        if agent_id not in result:
            result.append(agent_id)
    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="测试 Agent 路由规则")
    parser.add_argument("mode", choices=["daily", "weekly", "topic", "review"])
    parser.add_argument("text", nargs="*", help="用于匹配的主题或上下文")
    args = parser.parse_args()

    selected, route_warning = route_agents(args.mode, " ".join(args.text))
    if route_warning:
        print(f"提醒：{route_warning}")
    print("\n".join(describe_agents(selected)))
