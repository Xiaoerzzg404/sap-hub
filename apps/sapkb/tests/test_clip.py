"""SAPKB Run05 人工导入(clip)标准库测试（纯 stdlib unittest）。"""

from __future__ import annotations

import pathlib
import sqlite3
import sys
import tempfile
import unittest
from typing import Any, Dict, Tuple

SAPKB_ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(SAPKB_ROOT) not in sys.path:
    sys.path.insert(0, str(SAPKB_ROOT))

from ingest import clip  # noqa: E402

SCHEMA_FILE = pathlib.Path.home() / "sap-hub" / "configs" / "sapkb" / "schema.sql"


class TestClipImport(unittest.TestCase):
    """Run05 机械活：覆盖人工导入 clip_import 的关键行为。"""

    def _init_db(self, db_path: pathlib.Path) -> None:
        schema_sql = SCHEMA_FILE.read_text(encoding="utf-8")
        conn = sqlite3.connect(str(db_path))
        conn.executescript(schema_sql)
        conn.close()

    def test_basic_import(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_root = pathlib.Path(tmp_dir)
            db_path = temp_root / "sapkb.db"
            vault_root = temp_root / "vault"
            vault_root.mkdir(parents=True, exist_ok=True)
            self._init_db(db_path)

            url = "https://example.com/clip-basic-20260610"
            title = "SAPKB 运行时剪藏验证标题"
            author = "Ryan"
            content = "这是第一版剪藏全文，用于 Run05 基础验证。"

            result: Dict[str, Any] = clip.clip_import(
                url,
                title,
                author,
                content,
                str(db_path),
                str(vault_root),
            )

            self.assertEqual("imported", result.get("status"))
            self.assertEqual("user_imported", result.get("rights_status"))
            doc_id = result.get("doc_id")
            self.assertIsNotNone(doc_id)

            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            try:
                doc_row = conn.execute(
                    "SELECT content_status FROM documents WHERE id = ?",
                    (doc_id,),
                ).fetchone()
                self.assertIsNotNone(doc_row)
                self.assertEqual("fulltext_saved", doc_row["content_status"])

                dc_row = conn.execute(
                    "SELECT markdown_path FROM document_contents WHERE document_id = ?",
                    (doc_id,),
                ).fetchone()
                self.assertIsNotNone(dc_row)
                markdown_path = pathlib.Path(dc_row["markdown_path"])  # type: ignore[index]
                self.assertTrue(markdown_path.exists())
                self.assertTrue(markdown_path.is_file())
                self.assertEqual(content, markdown_path.read_text(encoding="utf-8"))
            finally:
                conn.close()

            inbox_rel = result.get("obsidian_path")
            self.assertIsInstance(inbox_rel, str)
            inbox_path = vault_root / inbox_rel
            self.assertTrue(inbox_path.exists())
            self.assertTrue(inbox_path.is_file())

    def test_required_fields_validation(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_root = pathlib.Path(tmp_dir)
            db_path = temp_root / "sapkb.db"
            vault_root = temp_root / "vault"
            vault_root.mkdir(parents=True, exist_ok=True)
            self._init_db(db_path)

            with self.assertRaises(ValueError):
                clip.clip_import(
                    "",
                    "标题",
                    "Ryan",
                    "正文",
                    str(db_path),
                    str(vault_root),
                )

            with self.assertRaises(ValueError):
                clip.clip_import(
                    "https://example.com/clip-missing-content",
                    "标题",
                    "Ryan",
                    "",
                    str(db_path),
                    str(vault_root),
                )

    def test_idempotent_dedup(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_root = pathlib.Path(tmp_dir)
            db_path = temp_root / "sapkb.db"
            vault_root = temp_root / "vault"
            vault_root.mkdir(parents=True, exist_ok=True)
            self._init_db(db_path)

            url = "https://example.com/clip-dup-20260610"
            first = clip.clip_import(
                url,
                "第一次导入",
                "Ryan",
                "第一次全文内容。",
                str(db_path),
                str(vault_root),
            )
            self.assertEqual("imported", first.get("status"))

            second = clip.clip_import(
                url,
                "第二次导入",
                "Ryan",
                "同链接第二次内容。",
                str(db_path),
                str(vault_root),
            )
            self.assertEqual("duplicate", second.get("status"))

    def test_license_evidence_validation_and_persist(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_root = pathlib.Path(tmp_dir)
            db_path = temp_root / "sapkb.db"
            vault_root = temp_root / "vault"
            vault_root.mkdir(parents=True, exist_ok=True)
            self._init_db(db_path)

            with self.assertRaises(FileNotFoundError):
                clip.clip_import(
                    "https://example.com/clip-license-missing",
                    "授权证据缺失测试",
                    "Ryan",
                    "已购内容。",
                    str(db_path),
                    str(vault_root),
                    license_info={"license_type": "purchase", "evidence_path": str(temp_root / "no_license_evidence.txt")},
                )

            evidence_path = temp_root / "license.txt"
            evidence_path.write_text("evidence data", encoding="utf-8")
            result = clip.clip_import(
                "https://example.com/clip-license-ok",
                "授权证据存在测试",
                "Ryan",
                "已购内容。",
                str(db_path),
                str(vault_root),
                license_info={
                    "license_type": "purchase",
                    "scope": "commercial",
                    "evidence_path": str(evidence_path),
                },
            )

            self.assertEqual("imported", result.get("status"))
            self.assertEqual("license_purchased", result.get("rights_status"))
            doc_id = result.get("doc_id")
            self.assertIsNotNone(doc_id)

            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            try:
                row = conn.execute(
                    "SELECT license_type, evidence_path FROM licenses WHERE document_id = ?",
                    (doc_id,),
                ).fetchone()
                self.assertIsNotNone(row)
                self.assertEqual("purchase", row["license_type"])
                self.assertEqual(str(evidence_path), row["evidence_path"])
            finally:
                conn.close()

    def test_fulltext_in_document_contents_not_documents_body(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_root = pathlib.Path(tmp_dir)
            db_path = temp_root / "sapkb.db"
            vault_root = temp_root / "vault"
            vault_root.mkdir(parents=True, exist_ok=True)
            self._init_db(db_path)

            content = "用于验证全文落库位置的示例内容。"
            result = clip.clip_import(
                "https://example.com/clip-fulltext-separation",
                "测试全文落库离线化",
                "Ryan",
                content,
                str(db_path),
                str(vault_root),
            )
            doc_id = result["doc_id"]

            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            try:
                columns = [row["name"] for row in conn.execute("PRAGMA table_info(documents)")]
                self.assertNotIn("body", columns)

                row = conn.execute(
                    "SELECT markdown_path FROM document_contents WHERE document_id = ?",
                    (doc_id,),
                ).fetchone()
                self.assertIsNotNone(row)
                md_path = pathlib.Path(row["markdown_path"])
                self.assertTrue(md_path.exists())
                self.assertTrue(md_path.is_file())
                self.assertIn(content, md_path.read_text(encoding="utf-8"))
            finally:
                conn.close()

            with self.assertRaises(sqlite3.OperationalError):
                conn = sqlite3.connect(str(db_path))
                conn.execute("SELECT body FROM documents WHERE id = ?", (doc_id,)).fetchone()


if __name__ == "__main__":
    unittest.main(verbosity=2)
