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

    def _matrix(self, model: Optional[str] = None) -> Tuple[List[str], List[str], "np.ndarray"]:
        # 按 model 过滤 + 维度守护（FinalReview M3）：换模型重嵌期间避免混维度 np.stack 崩。
        if model:
            rows = self.con.execute(
                "SELECT chunk_id,document_id,vec,dim FROM embeddings WHERE model=?", (model,)).fetchall()
        else:
            rows = self.con.execute("SELECT chunk_id,document_id,vec,dim FROM embeddings").fetchall()
        if not rows:
            return [], [], np.zeros((0, 0), dtype=np.float32)
        # 只保留最常见维度，丢弃异维行（防 np.stack 崩）
        from collections import Counter as _C
        dom_dim = _C(r[3] for r in rows).most_common(1)[0][0]
        rows = [r for r in rows if r[3] == dom_dim]
        ids = [r[0] for r in rows]
        docids = [r[1] for r in rows]
        mat = np.stack([np.frombuffer(r[2], dtype=np.float32) for r in rows])
        return ids, docids, mat

    def search(self, query_vec: List[float], k: int = 5, model: Optional[str] = None) -> List[Tuple[str, str, float]]:
        ids, docids, mat = self._matrix(model)
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
