"""SAPKB Run03 标准库 unittest 回归测试（metadata-only / 机械活）。"""

from __future__ import annotations

import pathlib
import sqlite3
import sys
import tempfile
import unittest
from typing import Dict, List

SAPKB_ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(SAPKB_ROOT) not in sys.path:
    sys.path.insert(0, str(SAPKB_ROOT))

from ingest import harvest  # noqa: E402  # pylint: disable=wrong-import-position
from ingest import compliance_gate
from process import dedup
from process import dedup_stage2
from process import tag_keyword


SCHEMA_FILE = pathlib.Path.home() / "sap-hub" / "configs" / "sapkb" / "schema.sql"
FIXTURES_DIR = SAPKB_ROOT / "tests" / "fixtures"


class TestSapkbRun03(unittest.TestCase):
    """Run03 回归测试套件（不依赖 pytest）。"""

    def test_harvest_fixture_csdn(self):
        records = list(harvest.harvest_source("fixture_csdn", str(FIXTURES_DIR)))
        self.assertGreaterEqual(len(records), 20)
        for item in records:
            self.assertNotIn("body", item)
            self.assertNotIn("content", item)
            self.assertNotIn("text", item)
            self.assertLessEqual(len(item.get("summary", "") or ""), 281)

    def test_compliance_gate_block_and_allowlist(self):
        hard = compliance_gate.evaluate(
            {"source_url": "https://example.com/login",
             "title": "扫码登录后查看 SAP",
             "summary": "请登录后查看全文"}, {})
        self.assertTrue(hard["blocked"])
        self.assertEqual("blocked", hard["rights_status"])
        paid = compliance_gate.evaluate(
            {"source_url": "https://example.com/paid",
             "title": "会员专享 SAP",
             "summary": "需开通会员后查看全文"}, {})
        self.assertFalse(paid["blocked"])
        self.assertTrue(paid["needs_license"])
        self.assertEqual("needs_payment", paid["audit"]["status"])
        normal = compliance_gate.evaluate(
            {"source_url": "https://example.com/open",
             "title": "SAP open content",
             "summary": "public teaching",
             "import_mode": "metadata_only"}, {})
        self.assertFalse(normal["blocked"])
        self.assertEqual("reference", normal["confidence_tier"])
    def test_dedup_reused_collect(self):
        self.assertTrue(dedup.REUSED_COLLECT)

        base_url = "https://blog.csdn.net/fico_master/article/details/130000001"
        fp_a = dedup.fingerprint({
            "source_url": base_url,
            "title": "标题 A",
            "summary": "摘要 A",
        })
        fp_b = dedup.fingerprint({
            "source_url": base_url,
            "title": "标题 B",
            "summary": "摘要 B",
        })
        self.assertEqual(fp_a["canonical_url"], fp_b["canonical_url"])
        self.assertTrue(fp_a["canonical_url"])

    def test_tag_keyword_co_mm_me21n_acdoca(self):
        tags = tag_keyword.tag("SAP CO-PA 与 MM 采购 ME21N", "ACDOCA KE30")
        tag_pairs = {(item.get("tag_type"), item.get("tag_value")) for item in tags}
        expected = {
            ("module", "CO"),
            ("module", "MM"),
            ("tcode", "ME21N"),
            ("table", "ACDOCA"),
        }
        self.assertTrue(expected.issubset(tag_pairs))

    def test_dedup_stage2_near_duplicates(self):
        near_docs: List[Dict[str, str]] = [
            {
                "id": "1",
                "title": "SAP F110 自动付款流程配置：参数与放行规则",
                "summary": "围绕付款参数与执行控制的配置说明。",
                "canonical_document_id": None,
            },
            {
                "id": "2",
                "title": "SAP F110 自动付款流程设置：参数与放行规则",
                "summary": "围绕付款参数与执行控制的简版说明。",
                "canonical_document_id": None,
            },
            {
                "id": "3",
                "title": "SAP MM 物料主数据与价格主张",
                "summary": "库存与物料主数据建模中的其他主题。",
                "canonical_document_id": None,
            },
        ]
        matches = dedup_stage2.find_near_duplicates(near_docs, backend="charngram")
        self.assertEqual(1, len(matches))
        self.assertIn("title", matches[0]["signal"])

        unrelated_docs: List[Dict[str, str]] = [
            {
                "id": "4",
                "title": "SAP FI 与资产会计月末结账要点",
                "summary": "讨论固定资产和总账的月末核对。",
                "canonical_document_id": None,
            },
            {
                "id": "5",
                "title": "如何搭建 SAP PI/PO 开发环境",
                "summary": "介绍系统配置与接口监控。",
                "canonical_document_id": None,
            },
        ]
        self.assertEqual(0, len(dedup_stage2.find_near_duplicates(unrelated_docs, backend="charngram")))

        # bge_m3 已实装(Run04)：未知 backend 才报错
        with self.assertRaises(ValueError):
            dedup_stage2._vectorize("x", "no_such_backend")

    def test_schema_sql_initialize_and_fts(self):
        schema_sql = SCHEMA_FILE.read_text(encoding="utf-8")

        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = pathlib.Path(tmp_dir) / "sapkb.db"
            conn = sqlite3.connect(str(db_path))
            try:
                conn.executescript(schema_sql)
                conn.execute(
                    """
                    INSERT INTO documents (
                      id,
                      title,
                      source_platform,
                      source_url,
                      imported_at,
                      import_mode,
                      rights_status,
                      content_status,
                      confidence_tier,
                      created_at,
                      updated_at,
                      summary
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        "doc-fop-001",
                        "SAP F110 自动付款参数与放行逻辑",
                        "CSDN",
                        "https://example.com/fap/001",
                        "2026-06-10T00:00:00Z",
                        "metadata_only",
                        "metadata_only",
                        "metadata_saved",
                        "reference",
                        "2026-06-10T00:00:00Z",
                        "2026-06-10T00:00:00Z",
                        "本文讲解 SAP F110 的自动付款参数设置与执行控制。",
                    ),
                )
                conn.execute(
                    "INSERT INTO documents_fts(document_id, title, summary, body) VALUES (?, ?, ?, ?)",
                    (
                        "doc-fop-001",
                        "SAP F110 自动付款参数与放行逻辑",
                        "本文讲解 SAP F110 的自动付款参数设置与执行控制。",
                        "示例段落：付款运行配置、自动放行与日志追踪。",
                    ),
                )
                conn.commit()
                matched = conn.execute(
                    "SELECT COUNT(*) FROM documents_fts WHERE documents_fts MATCH ?",
                    ("自动付款",),
                ).fetchone()[0]
                self.assertGreaterEqual(matched, 1)
            finally:
                conn.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
