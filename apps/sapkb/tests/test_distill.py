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


if __name__ == "__main__":
    unittest.main()
