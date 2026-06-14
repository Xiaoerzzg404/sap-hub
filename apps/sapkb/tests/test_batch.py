"""SAPKB Run07 机械活：clip-batch 与 category 门户的标准库 unittest（纯 stdlib）。"""

from __future__ import annotations

import csv
import pathlib
import sqlite3
import sys
import tempfile
import unittest
from typing import Any, Dict, List, Tuple

SAPKB_ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(SAPKB_ROOT) not in sys.path:
    sys.path.insert(0, str(SAPKB_ROOT))

from ingest import clip  # noqa: E402
from ingest import clip_batch  # noqa: E402
from obsidian_sync import mirror  # noqa: E402

SCHEMA_FILE = SAPKB_ROOT.parent.parent / "configs" / "sapkb" / "schema.sql"


class TestBatchPortalsRun07(unittest.TestCase):
    """覆盖 Run07 里 clip-batch 与 01_by_category 的离线行为。"""

    def _init_db(self, db_path: pathlib.Path) -> None:
        schema_sql = SCHEMA_FILE.read_text(encoding="utf-8")
        conn = sqlite3.connect(str(db_path))
        try:
            conn.executescript(schema_sql)
        finally:
            conn.close()

    def _clip_import_rows(self, db_path: pathlib.Path, vault_root: pathlib.Path,
                         rows: List[Tuple[str, str, str, str]]) -> List[Dict[str, Any]]:
        """rows: (url, title, author, content)."""
        result = []
        for url, title, author, content in rows:
            r = clip.clip_import(url, title, author, content, str(db_path), str(vault_root))
            result.append({
                "url": url,
                "title": title,
                "author": author,
                "doc_id": r["doc_id"],
                "content": content,
            })
        return result

    def _set_content_status(self, db_path: pathlib.Path, doc_ids: List[str], status: str) -> None:
        conn = sqlite3.connect(str(db_path))
        try:
            for doc_id in doc_ids:
                conn.execute("UPDATE documents SET content_status = ? WHERE id = ?", (status, doc_id))
                conn.execute("DELETE FROM audit_logs WHERE target_type='document' AND target_id = ?", (doc_id,))
            conn.commit()
        finally:
            conn.close()

    def test_clip_batch_folder_mode_upgrades_by_filename_id(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            workspace = pathlib.Path(tmp_dir)
            db_path = workspace / "sapkb.db"
            vault_root = workspace / "vault"
            folder = workspace / "batch_files"
            folder.mkdir()
            vault_root.mkdir(parents=True, exist_ok=True)

            self._init_db(db_path)

            ids = [
                ("156017683", "SAPKB 运行文 156017683", "Ryan", "种子元数据正文 01。"),
                ("151856954", "SAPKB 运行文 151856954", "Ryan", "种子元数据正文 02。"),
            ]
            seeded = self._clip_import_rows(db_path, vault_root, [
                ("https://example.com/article/{}".format(item_id), title, author, content)
                for item_id, title, author, content in ids
            ])
            self._set_content_status(db_path, [row["doc_id"] for row in seeded], "metadata_saved")

            for row in ids:
                item_id, _title, _author, _content = row
                (folder / f"{item_id}.md").write_text(f"批量补全文 for {item_id}", encoding="utf-8")

            summary = clip_batch.run_batch(str(db_path), str(vault_root),
                                          folder=str(folder), by_filename_id=True)

            self.assertEqual(2, summary.get("upgraded"))
            self.assertEqual(2, summary.get("total"))
            self.assertEqual(2, summary.get("upgraded"))
            self.assertEqual(0, summary.get("imported"))
            self.assertEqual(0, summary.get("duplicate"))

            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            try:
                for item_id, _title, _author, _content in ids:
                    row = conn.execute(
                        "SELECT content_status FROM documents WHERE source_url = ?",
                        ("https://example.com/article/{}".format(item_id),),
                    ).fetchone()
                    self.assertIsNotNone(row)
                    self.assertEqual("fulltext_saved", row["content_status"])
            finally:
                conn.close()

    def test_clip_batch_manifest_mode_imports_and_counts(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            workspace = pathlib.Path(tmp_dir)
            db_path = workspace / "sapkb.db"
            vault_root = workspace / "vault"
            manifest_dir = workspace / "manifest"
            manifest_dir.mkdir()
            vault_root.mkdir(parents=True, exist_ok=True)

            self._init_db(db_path)

            manifest_rows = [
                {
                    "url": "https://example.com/manifest-a",
                    "file": "a.md",
                    "title": "SAPKB manifest A",
                    "author": "Ryan",
                    "content": "manifest 批量正文 A。",
                },
                {
                    "url": "https://example.com/manifest-b",
                    "file": "b.md",
                    "title": "SAPKB manifest B",
                    "author": "Ryan",
                    "content": "manifest 批量正文 B。",
                },
            ]

            for row in manifest_rows:
                (manifest_dir / row["file"]).write_text(row["content"], encoding="utf-8")

            manifest_path = manifest_dir / "manifest.csv"
            with manifest_path.open("w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["url", "file", "title", "author"])
                writer.writeheader()
                for row in manifest_rows:
                    writer.writerow({
                        "url": row["url"],
                        "file": row["file"],
                        "title": row["title"],
                        "author": row["author"],
                    })

            summary = clip_batch.run_batch(
                str(db_path),
                str(vault_root),
                manifest=str(manifest_path),
            )

            self.assertEqual(2, summary.get("total"))
            self.assertEqual(2, summary.get("imported"))
            self.assertEqual(0, summary.get("upgraded"))
            self.assertEqual(0, summary.get("duplicate"))
            self.assertEqual(0, summary.get("skipped"))

            conn = sqlite3.connect(str(db_path))
            try:
                count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
                self.assertEqual(2, count)
            finally:
                conn.close()

    def test_clip_batch_rejects_fulltext_duplicates(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            workspace = pathlib.Path(tmp_dir)
            db_path = workspace / "sapkb.db"
            vault_root = workspace / "vault"
            folder = workspace / "batch_files"
            folder.mkdir()
            vault_root.mkdir(parents=True, exist_ok=True)

            self._init_db(db_path)

            ids = [
                ("156017683", "已存在文 156017683", "Ryan", "已有全文 01。"),
                ("151856954", "已存在文 151856954", "Ryan", "已有全文 02。"),
            ]
            seeded = self._clip_import_rows(db_path, vault_root, [
                ("https://example.com/dup/{}".format(item_id), title, author, content)
                for item_id, title, author, content in ids
            ])

            for row in ids:
                (folder / f"{row[0]}.md").write_text(f"重复导入正文 for {row[0]}", encoding="utf-8")

            summary = clip_batch.run_batch(str(db_path), str(vault_root),
                                          folder=str(folder), by_filename_id=True)

            self.assertEqual(2, summary.get("duplicate"))
            self.assertEqual(2, summary.get("total"))
            self.assertEqual(0, summary.get("upgraded"))
            self.assertEqual(0, summary.get("imported"))
            conn = sqlite3.connect(str(db_path))
            try:
                count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
                self.assertEqual(len(seeded), count)
            finally:
                conn.close()

    def test_category_portals_generate_pure_view_files(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            workspace = pathlib.Path(tmp_dir)
            db_path = workspace / "sapkb.db"
            vault_root = workspace / "vault"
            vault_root.mkdir(parents=True, exist_ok=True)
            self._init_db(db_path)

            seeded = self._clip_import_rows(db_path, vault_root, [
                (
                    "https://example.com/cat-fi",
                    "SAP FI 分类演示",
                    "Ryan",
                    "BODY_MARKER_SAP_FI_DOCUMENT_A",
                ),
                (
                    "https://example.com/cat-fi-2",
                    "SAP FI 分类演示 B",
                    "Ryan",
                    "BODY_MARKER_SAP_FI_DOCUMENT_B",
                ),
                (
                    "https://example.com/cat-mm",
                    "SAP MM 分类演示",
                    "Ryan",
                    "BODY_MARKER_SAP_MM_DOCUMENT_C",
                ),
            ])

            tags = [
                ("cat-fi", "SAP FI"),
                ("cat-fi-2", "SAP FI"),
                ("cat-mm", "SAP MM"),
            ]
            con = sqlite3.connect(str(db_path))
            try:
                con.execute("DELETE FROM document_tags WHERE tag_type = 'category'")
                for row, (_, category) in zip(seeded, tags):
                    con.execute(
                        "INSERT INTO document_tags (id, document_id, tag_type, tag_value, confidence, generated_by, created_at) "
                        "VALUES (?, ?, 'category', ?, 1.0, 'test', datetime('now'))",
                        (
                            "tc_" + row["doc_id"],
                            row["doc_id"],
                            category,
                        ),
                    )
                con.commit()

                results = mirror.build_category_portals(con, str(vault_root))
            finally:
                con.close()

            self.assertEqual(2, len(results))
            self.assertListEqual(sorted([r["category"] for r in results]), ["SAP FI", "SAP MM"])

            portal_dir = vault_root / "01_by_category"
            self.assertTrue(portal_dir.exists())
            self.assertTrue((portal_dir / "_INDEX.md").exists())

            portal_files = sorted(
                [path.name for path in portal_dir.glob("*.md") if path.name != "_INDEX.md"]
            )
            self.assertListEqual(portal_files, ["SAP_FI.md", "SAP_MM.md"])

            for path in portal_dir.glob("*.md"):
                if path.name == "_INDEX.md":
                    continue
                text = path.read_text(encoding="utf-8")
                self.assertIn("```dataview", text)
                self.assertIn("TABLE author AS 作者, content_type AS 类型, rights_status AS 授权, imported_at AS 收录", text)
                self.assertNotIn("BODY_MARKER_SAP_FI_DOCUMENT_A", text)
                self.assertNotIn("BODY_MARKER_SAP_FI_DOCUMENT_B", text)
                self.assertNotIn("BODY_MARKER_SAP_MM_DOCUMENT_C", text)
