"""SAPKB distill 单测（Cowork 自写——Codex token 用尽）。验证版权角色硬隔离。纯标准库+临时库+vault。"""
import os
import sqlite3
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
for p in (ROOT, os.path.join(ROOT, "process")):
    if p not in sys.path:
        sys.path.insert(0, p)
SCHEMA = os.path.expanduser("~/sap-hub/configs/sapkb/schema.sql")
from process import distill  # noqa: E402


def _now():
    return "2026-06-10T00:00:00"


class DistillTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.db = os.path.join(self.tmp, "t.db")
        self.vault = os.path.join(self.tmp, "EXTKB")
        con = sqlite3.connect(self.db)
        con.executescript(open(SCHEMA, encoding="utf-8").read())

        def doc(i, rights, cs):
            con.execute(
                "INSERT INTO documents (id,title,source_url,imported_at,import_mode,rights_status,"
                "content_status,confidence_tier,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (i, "标题"+i, "http://x/"+i, _now(), "metadata_only", rights, cs, "reference", _now(), _now()))
        doc("dmeta", "metadata_only", "metadata_saved")
        doc("dfull", "license_purchased", "fulltext_saved")
        con.commit(); con.close()

    def test_metadata_cannot_be_evidence(self):
        with self.assertRaises(ValueError):
            distill.create_insight(self.db, self.vault, "knowledge_card", "卡",
                                   [{"doc_id": "dmeta", "role": "evidence"}])

    def test_normal_create_roles_and_status(self):
        r = distill.create_insight(self.db, self.vault, "knowledge_card", "F110 卡",
                                   [{"doc_id": "dmeta", "role": None}, {"doc_id": "dfull", "role": "evidence"}])
        self.assertEqual(r["status"], "created")
        self.assertEqual(r["evidence"], 1)
        self.assertEqual(r["inspiration"], 1)
        self.assertTrue(os.path.exists(os.path.join(self.vault, r["obsidian_path"])))
        con = sqlite3.connect(self.db)
        # 源置 distilled
        self.assertEqual(con.execute("SELECT count(*) FROM documents WHERE editorial_status='distilled'").fetchone()[0], 2)
        # insight_sources 角色正确
        roles = dict(con.execute("SELECT document_id,role FROM insight_sources").fetchall())
        con.close()
        self.assertEqual(roles["dmeta"], "inspiration")
        self.assertEqual(roles["dfull"], "evidence")

    def test_pure_inspiration_is_topic_card(self):
        r = distill.create_insight(self.db, self.vault, "knowledge_card", "选题卡",
                                   [{"doc_id": "dmeta", "role": None}])
        self.assertEqual(r["evidence"], 0)
        self.assertIsNotNone(r["warn"])  # 提示无 evidence 不能下事实结论
        # md 含"选题卡"免责语
        txt = open(os.path.join(self.vault, r["obsidian_path"]), encoding="utf-8").read()
        self.assertIn("不得在此陈述未经核实", txt)

    def test_fuzhkb_guard(self):
        with self.assertRaises(PermissionError):
            distill.create_insight(self.db, "/tmp/vaults/SAP_FUZHKB", "knowledge_card", "x",
                                   [{"doc_id": "dfull", "role": "evidence"}])

    def test_draft_no_evidence_no_facts(self):
        # 纯 inspiration 卡成稿：不连 LLM(无 evidence 全文)，只给选题角度、不编事实
        r = distill.create_insight(self.db, self.vault, "knowledge_card", "选题卡B",
                                   [{"doc_id": "dmeta", "role": None}])
        d = distill.draft_insight(self.db, self.vault, r["insight_id"])
        self.assertEqual(d["evidence_used"], 0)
        self.assertIn("不含未核实事实", d["note"])
        con = sqlite3.connect(self.db)
        self.assertEqual(con.execute("SELECT status FROM insights WHERE id=?", (r["insight_id"],)).fetchone()[0], "in_review")
        con.close()

    def test_record_publication(self):
        r = distill.create_insight(self.db, self.vault, "knowledge_card", "卡C",
                                   [{"doc_id": "dfull", "role": "evidence"}])
        p = distill.record_publication(self.db, r["insight_id"], "wechat_mp", url="http://x")
        self.assertEqual(p["status"], "published")
        con = sqlite3.connect(self.db)
        self.assertEqual(con.execute("SELECT count(*) FROM publications WHERE insight_id=?", (r["insight_id"],)).fetchone()[0], 1)
        self.assertEqual(con.execute("SELECT status FROM insights WHERE id=?", (r["insight_id"],)).fetchone()[0], "published")
        con.close()
        with self.assertRaises(ValueError):
            distill.record_publication(self.db, r["insight_id"], "invalid_platform")
        # 幂等：同 insight+platform 再登记 → 不重复记账（FinalReview BUG-1）
        distill.record_publication(self.db, r["insight_id"], "wechat_mp", url="http://x2")
        con = sqlite3.connect(self.db)
        self.assertEqual(con.execute("SELECT count(*) FROM publications WHERE insight_id=?", (r["insight_id"],)).fetchone()[0], 1)
        con.close()


if __name__ == "__main__":
    unittest.main()
