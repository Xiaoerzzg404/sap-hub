"""SAPKB analytics 单测（Cowork 自写——Codex spark token 用尽，Lead 接手）。纯标准库，临时库。"""
import math
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
from process import analytics  # noqa: E402


def _now():
    return "2026-06-10T00:00:00"


class AnalyticsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.db = self.tmp.name
        self.tmp.close()
        con = sqlite3.connect(self.db)
        con.executescript(open(SCHEMA, encoding="utf-8").read())
        # 作者
        con.execute("INSERT INTO authors (id,name,created_at,updated_at,manual_rating) VALUES "
                    "('a1','作者A',?,?,5),('a2','作者B',?,?,0)", (_now(), _now(), _now(), _now()))
        # 文档 A：高热度；B：零
        def doc(i, author, mr, rp, pc, pub):
            con.execute(
                "INSERT INTO documents (id,title,source_url,author_id,imported_at,import_mode,rights_status,"
                "content_status,confidence_tier,manual_rating,repost_count,platform_count,published_at,created_at,updated_at) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (i, "标题"+i, "http://x/"+i, author, _now(), "metadata_only", "metadata_only",
                 "metadata_saved", "reference", mr, rp, pc, pub, _now(), _now()))
        doc("dA", "a1", 5, 3, 2, "2026-04-01")
        doc("dB", "a2", 0, 0, 1, "2026-01-01")
        def tag(d, tt, tv):
            con.execute("INSERT OR IGNORE INTO document_tags (id,document_id,tag_type,tag_value,created_at) "
                        "VALUES (?,?,?,?,?)", (d+tt+tv, d, tt, tv, _now()))
        tag("dA", "category", "FI"); tag("dA", "sap_ai", "MCP"); tag("dA", "content_type", "技术分析")
        tag("dA", "csdn_tag", "Joule")
        tag("dB", "category", "MM"); tag("dB", "content_type", "教程")
        # UNIQUE(doc,type,value)：高频词需出现在 5 个不同文档上，freq 才>=5
        for k in range(5):
            did = "dn%d" % k
            doc(did, "a2", 0, 0, 1, "2026-04-01")
            tag(did, "csdn_tag", "新奇术语XX")
        con.commit(); con.close()

    def tearDown(self):
        os.unlink(self.db)

    def test_popularity_formula(self):
        analytics.recompute_popularity(self.db)
        con = sqlite3.connect(self.db)
        a = con.execute("SELECT popularity_score FROM documents WHERE id='dA'").fetchone()[0]
        b = con.execute("SELECT popularity_score FROM documents WHERE id='dB'").fetchone()[0]
        con.close()
        expect = 3*5 + 2*math.log(1+3) + 1*2 + 1*5 + 2*0
        self.assertAlmostEqual(a, round(expect, 4), places=1)
        self.assertGreater(a, b)

    def test_trend_snapshot(self):
        r = analytics.build_trend_snapshot(self.db)
        self.assertGreater(r["snapshots_written"], 0)
        counts = [h["count"] for h in r["hot"]]
        self.assertEqual(counts, sorted(counts, reverse=True))  # 降序

    def test_term_candidates_excludes_taxonomy(self):
        r = analytics.detect_term_candidates(self.db, min_freq=5)
        terms = [c["term"] for c in r["top"]]
        self.assertIn("新奇术语XX", terms)      # 高频新词入候选
        self.assertNotIn("Joule", terms)        # taxonomy(SAP_AI)已有 → 不入候选

    def test_system_status(self):
        s = analytics.system_status(self.db)
        self.assertEqual(s["documents_total"], s["fulltext"] + s["metadata_only"])
        self.assertGreaterEqual(s["documents_total"], 2)
        self.assertIn("platforms", s)
        self.assertIsInstance(s["top_authors"], list)

    def test_export_brief(self):
        analytics.recompute_popularity(self.db)
        out = os.path.join(self.tmp.name + "_brief.md") if hasattr(self.tmp, "name") else "/tmp/_b.md"
        out = os.path.join("/tmp", "sapkb_brief_test.md")
        r = analytics.build_selection_brief(self.db, out)
        self.assertEqual(r["status"], "written")
        self.assertTrue(os.path.exists(out))
        txt = open(out, encoding="utf-8").read()
        self.assertIn("选题简报", txt)
        self.assertIn("今日选题候选", txt)
        os.unlink(out)
        # FUZHKB 防呆
        with self.assertRaises(PermissionError):
            analytics.build_selection_brief(self.db, "/x/vaults/SAP_FUZHKB/b.md")

    def test_shortlist_ai_first_and_filter(self):
        analytics.recompute_popularity(self.db)
        out = analytics.topic_shortlist(self.db, limit=10)
        self.assertEqual(out[0]["doc_id"], "dA")           # 有 sap_ai + 高热度 → 置顶
        scores = [x["topic_score"] for x in out]
        self.assertEqual(scores, sorted(scores, reverse=True))
        fi = analytics.topic_shortlist(self.db, category="FI", limit=10)
        self.assertTrue(all(x["category"] == "FI" for x in fi))


if __name__ == "__main__":
    unittest.main()
