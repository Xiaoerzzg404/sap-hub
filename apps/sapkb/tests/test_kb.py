"""SAPKB Run04 标准库 unittest（机械活）。"""

from __future__ import annotations

import pathlib
import sys
import tempfile
import unittest
from unittest.mock import patch

SAPKB_ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(SAPKB_ROOT) not in sys.path:
    sys.path.insert(0, str(SAPKB_ROOT))

from kb import chunker  # noqa: E402
from kb import embedder  # noqa: E402
from kb.vector_store import VectorStore  # noqa: E402


class TestChunker(unittest.TestCase):
    def test_metadata_only_has_single_title_summary_chunk(self):
        doc = {
            "id": "doc-metadata-only",
            "title": "SAP FICO 元数据导入说明",
            "summary": "仅有摘要，无正文。",
            "rights_status": "metadata_only",
        }

        chunks = chunker.chunk_document(doc)
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0]["chunk_index"], 0)
        self.assertIn(doc["title"], chunks[0]["content"])
        self.assertIn(doc["summary"], chunks[0]["content"])

    def test_own_content_long_body_generates_multiple_chunks(self):
        doc = {
            "id": "doc-own-content",
            "title": "SAP 全文分块测试标题",
            "summary": "用于验证全文分块策略。",
            "rights_status": "own_content",
            "body": "这是一个用于测试分块的长正文内容。" * 100,
        }
        # >=1500 chars for splitting path.
        self.assertGreaterEqual(len(doc["body"]), 1500)

        chunks = chunker.chunk_document(doc)
        self.assertGreater(len(chunks), 1)
        self.assertEqual(chunks[0]["chunk_index"], 0)
        self.assertIn(doc["title"], chunks[0]["content"])

    def test_metadata_only_ignores_body_field(self):
        doc = {
            "id": "doc-metadata-leaksafe",
            "title": "元数据优先策略",
            "summary": "即使有 body 也只能索引 title + summary。",
            "rights_status": "metadata_only",
            "body": "不应被泄漏的正文：" + ("秘密正文内容" * 100),
        }

        chunks = chunker.chunk_document(doc)
        self.assertEqual(len(chunks), 1)
        self.assertNotIn("秘密正文内容", chunks[0]["content"])


class TestVectorStore(unittest.TestCase):
    def test_vector_store_upsert_search_has_and_replace(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = pathlib.Path(temp_dir) / "test_vectors.db"
            store = VectorStore(str(db_path))
            try:
                store.upsert("chunk-1", "doc-1", "mock-model", [1, 0, 0], "2026-06-10T00:00:00Z")
                store.upsert("chunk-2", "doc-2", "mock-model", [0, 1, 0], "2026-06-10T00:00:00Z")
                store.upsert("chunk-3", "doc-3", "mock-model", [0.9, 0.1, 0], "2026-06-10T00:00:00Z")

                self.assertEqual(store.count(), 3)
                self.assertTrue(store.has("chunk-2"))
                self.assertFalse(store.has("chunk-missing"))

                top = store.search([1, 0, 0], k=2)
                self.assertEqual(len(top), 2)
                self.assertEqual(top[0][0], "chunk-1")
                self.assertEqual(top[1][0], "chunk-3")
                self.assertGreaterEqual(top[0][2], top[1][2])

                store.upsert("chunk-2", "doc-2-updated", "mock-model", [1, 0.02, 0], "2026-06-10T00:00:00Z")
                self.assertEqual(store.count(), 3)
            finally:
                store.close()


class TestEmbedder(unittest.TestCase):
    def test_embedder_interface_exists(self):
        self.assertTrue(callable(embedder.embed_text))
        self.assertTrue(callable(embedder.embed_batch))
        self.assertTrue(callable(embedder.available))

    def test_embed_batch_uses_mocked_embed_text(self):
        with patch("kb.embedder.embed_text", return_value=[0.1, 0.2, 0.3]):
            vectors = embedder.embed_batch(["a", "b", "c"], model="mock")
        self.assertEqual(vectors, [[0.1, 0.2, 0.3], [0.1, 0.2, 0.3], [0.1, 0.2, 0.3]])


if __name__ == "__main__":
    unittest.main(verbosity=2)
