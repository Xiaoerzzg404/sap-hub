"""SAPKB 本地向量库（Cowork-Worker，Run04）

派生数据（docs/02 五）：可由 chunks 全量重建，故独立存 sidecar sqlite `data/vectors.db`，
不污染主库、不入 git。向量存 float32 blob，cosine 检索用 numpy。可插拔——将来换 Chroma/LanceDB
只需替换本类，rag.py 不动。
"""
from __future__ import annotations

import sqlite3
from typing import List, Optional, Tuple

import numpy as np

_SCHEMA = """
CREATE TABLE IF NOT EXISTS embeddings (
  chunk_id    TEXT PRIMARY KEY,
  document_id TEXT,
  model       TEXT,
  dim         INTEGER,
  vec         BLOB,
  created_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_emb_doc ON embeddings(document_id);
"""


class VectorStore:
    def __init__(self, path: str):
        self.path = path
        self.con = sqlite3.connect(path)
        self.con.executescript(_SCHEMA)
        self.con.commit()

    def upsert(self, chunk_id: str, document_id: str, model: str, vec: List[float], created_at: str) -> None:
        arr = np.asarray(vec, dtype=np.float32)
        self.con.execute(
            "INSERT OR REPLACE INTO embeddings (chunk_id,document_id,model,dim,vec,created_at) VALUES (?,?,?,?,?,?)",
            (chunk_id, document_id, model, int(arr.shape[0]), arr.tobytes(), created_at),
        )

    def commit(self) -> None:
        self.con.commit()

    def has(self, chunk_id: str) -> bool:
        return self.con.execute("SELECT 1 FROM embeddings WHERE chunk_id=?", (chunk_id,)).fetchone() is not None

    def count(self) -> int:
        return self.con.execute("SELECT COUNT(*) FROM embeddings").fetchone()[0]

    def _matrix(self) -> Tuple[List[str], List[str], "np.ndarray"]:
        rows = self.con.execute("SELECT chunk_id,document_id,vec FROM embeddings").fetchall()
        if not rows:
            return [], [], np.zeros((0, 0), dtype=np.float32)
        ids = [r[0] for r in rows]
        docids = [r[1] for r in rows]
        mat = np.stack([np.frombuffer(r[2], dtype=np.float32) for r in rows])
        return ids, docids, mat

    def search(self, query_vec: List[float], k: int = 5) -> List[Tuple[str, str, float]]:
        ids, docids, mat = self._matrix()
        if mat.shape[0] == 0:
            return []
        q = np.nan_to_num(np.asarray(query_vec, dtype=np.float32))
        mat = np.nan_to_num(mat)
        qn = q / (np.linalg.norm(q) + 1e-9)
        mn = mat / (np.linalg.norm(mat, axis=1, keepdims=True) + 1e-9)
        with np.errstate(divide="ignore", over="ignore", invalid="ignore"):
            sims = np.nan_to_num(mn @ qn)
        order = np.argsort(-sims)[:k]
        return [(ids[i], docids[i], float(sims[i])) for i in order]

    def close(self) -> None:
        self.con.close()
