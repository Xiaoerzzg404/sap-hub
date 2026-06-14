from __future__ import annotations

import importlib
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ProjectStructureTest(unittest.TestCase):
    def test_required_files_exist(self) -> None:
        required_files = [
            "README.md",
            "config/profile.yaml",
            "config/yearly_goals.yaml",
            "config/quarterly_goals.yaml",
            "config/agent_registry.yaml",
            "config/life_coach_registry.yaml",
            "knowledge/life_coach/coach_index.md",
            "knowledge/life_coach/README.md",
            "templates/daily_checkin.md",
            "templates/weekly_planning.md",
            "templates/topic_deep_dive.md",
            "templates/weekly_review.md",
            "templates/agent_response_format.md",
            "templates/output_tracker.md",
            "scripts/mentor_os.py",
            "scripts/route_agents.py",
            "scripts/build_prompt.py",
            "scripts/new_week.py",
            "scripts/review_week.py",
            "scripts/integrate_life_coach.py",
        ]
        for relative in required_files:
            self.assertTrue((ROOT / relative).is_file(), relative)

    def test_required_directories_exist(self) -> None:
        required_dirs = [
            "logs/daily",
            "logs/weekly",
            "logs/decisions",
            "outputs/usecases",
            "outputs/demos",
            "outputs/articles",
            "outputs/courses",
            "outputs/certifications",
            "outputs/business",
            "knowledge/imported/life-os",
            "knowledge/imported/life-os/人生教练",
            "knowledge/life_coach/enhanced",
            "knowledge/life_coach/cards",
        ]
        for relative in required_dirs:
            self.assertTrue((ROOT / relative).is_dir(), relative)

    def test_agent_files_have_required_sections(self) -> None:
        required_sections = [
            "## Agent 名称",
            "## Agent 角色",
            "## 负责的问题",
            "## 目标",
            "## 需要调查和掌握的领域",
            "## 输出格式",
            "## 禁止事项",
            "## 下次汇报要求",
        ]
        agent_files = sorted((ROOT / "agents").glob("*.md"))
        self.assertEqual(len(agent_files), 14)
        for path in agent_files:
            text = path.read_text(encoding="utf-8")
            for section in required_sections:
                self.assertIn(section, text, f"{path.name} missing {section}")
            self.assertIn("## 人生教练整合来源", text, f"{path.name} missing life coach link")

    def test_life_coach_integration_exists(self) -> None:
        source_files = sorted((ROOT / "knowledge" / "imported" / "life-os" / "人生教练").glob("*.md"))
        enhanced_files = sorted((ROOT / "knowledge" / "life_coach" / "enhanced").glob("*.md"))
        card_files = sorted((ROOT / "knowledge" / "life_coach" / "cards").glob("*.md"))
        self.assertEqual(len(source_files), 14)
        self.assertEqual(len(enhanced_files), 14)
        self.assertGreaterEqual(len(card_files), 150)
        index = (ROOT / "knowledge" / "life_coach" / "coach_index.md").read_text(encoding="utf-8")
        self.assertIn("SAP_Finance_AI_Use_Cases_Period_End_Closing.md", index)

    def test_topic_route_and_prompt(self) -> None:
        sys.path.insert(0, str(ROOT / "scripts"))
        route_agents = importlib.import_module("route_agents")
        build_prompt = importlib.import_module("build_prompt")
        selected, warning = route_agents.route_agents("topic", "月结关账AI助手Demo")
        self.assertIsNone(warning)
        self.assertEqual(selected[:4], ["00_orchestrator", "02_s4hana_finance", "03_sap_business_ai", "06_demo_poc"])
        prompt = build_prompt.build_prompt("topic", {"专题": "月结关账AI助手Demo"}, selected, warning)
        self.assertIn("我的背景", prompt)
        self.assertIn("月结关账AI助手Demo", prompt)
        self.assertIn("S/4HANA Finance 深化导师", prompt)
        self.assertIn("knowledge/life_coach/enhanced/02_s4hana_finance_life_coach.md", prompt)


if __name__ == "__main__":
    unittest.main()
