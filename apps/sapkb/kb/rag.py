"""SAPKB 本地 RAG（Cowork-Worker，Run04）

build_index：对 documents 分块→写 chunks 表→bge-m3 嵌入→存向量库（幂等，只补未嵌的块）。
semantic_search：query 向量化→cosine top-k→回带【来源 + 置信 tier】的块。
answer：用本机 gemma4 仅基于检索到的块做有引用的中文回答（qa.require_citations，
allow_uncited_answer=false：检索不到达标块就明确说"资料不足"，绝不脑补）。
所有结果都打 reference 置信提示——外部采集需验证。
"""
from __future__ import annotations

import datetime
import json
import os
import sqlite3
import urllib.request
from typing import Any, Dict, List, Optional

from . import embedder
from . import chunker
from .vector_store import VectorStore

OLLAMA_URL = "http://localhost:11434"
GEN_MODEL = "gemma4:e4b"
MIN_SCORE = 0.6  # 作答门槛（Ryan 2026-06-10 批准 0.45→0.6）：低于此视为相关度不足、拒答不脑补


def _now() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _default_vectors_path(db_path: str) -> str:
    return os.path.join(os.path.dirname(db_path), "vectors.db")


def build_index(db_path: str, vectors_path: Optional[str] = None,
                model: str = embedder.EMBED_MODEL, only_new: bool = True,
                limit: Optional[int] = None) -> Dict[str, Any]:
    vectors_path = vectors_path or _default_vectors_path(db_path)
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    vs = VectorStore(vectors_path)
    stats = {"docs": 0, "chunks_written": 0, "embedded": 0, "skipped_existing": 0, "errors": 0}
    try:
        q = ("SELECT d.id,d.title,d.summary,d.rights_status,d.source_url,dc.markdown_path "
             "FROM documents d LEFT JOIN document_contents dc ON dc.document_id=d.id "
             "WHERE d.content_status!='removed'")
        if limit:
            q += " LIMIT {}".format(int(limit))
        docs = con.execute(q).fetchall()
        for d in docs:
            stats["docs"] += 1
            doc = dict(d)
            # 授权全文文档：从 document_contents 读真正文交给 chunker 分全文块（chunker 仍按 rights 把关）
            mp = doc.get("markdown_path")
            if mp and doc.get("rights_status") in chunker._FULLTEXT_RIGHTS and os.path.exists(mp):
                try:
                    doc["body"] = open(mp, "r", encoding="utf-8").read()
                except Exception:
                    doc["body"] = None
            for ch in chunker.chunk_document(doc):
                chunk_id = "ch_" + doc["id"] + "_" + str(ch["chunk_index"])
                # 写 chunks 表（幂等 UNIQUE(document_id,chunk_index)）
                con.execute(
                    "INSERT OR IGNORE INTO chunks (id,document_id,chunk_index,heading_path,content,"
                    "token_count,source_url,embedding_model,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                    (chunk_id, doc["id"], ch["chunk_index"], ch["heading_path"], ch["content"],
                     ch["token_count"], ch["source_url"], model, _now()),
                )
                stats["chunks_written"] += 1
                if only_new and vs.has(chunk_id):
                    stats["skipped_existing"] += 1
                    continue
                try:
                    vec = embedder.embed_text(ch["content"], model)
                    if not vec:
                        stats["errors"] += 1
                        continue
                    vs.upsert(chunk_id, doc["id"], model, vec, _now())
                    con.execute("UPDATE chunks SET embedded_at=?, vector_id=? WHERE id=?",
                                (_now(), chunk_id, chunk_id))
                    stats["embedded"] += 1
                except Exception:
                    stats["errors"] += 1
        con.commit()
        vs.commit()
        stats["vectors_total"] = vs.count()
        return stats
    finally:
        vs.close()
        con.close()


def semantic_search(query: str, db_path: str, vectors_path: Optional[str] = None,
                    k: int = 5, model: str = embedder.EMBED_MODEL) -> List[Dict[str, Any]]:
    vectors_path = vectors_path or _default_vectors_path(db_path)
    qv = embedder.embed_text(query, model)
    vs = VectorStore(vectors_path)
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        hits = vs.search(qv, k, model=model)
        out = []
        for chunk_id, doc_id, score in hits:
            ch = con.execute("SELECT content,source_url FROM chunks WHERE id=?", (chunk_id,)).fetchone()
            doc = con.execute(
                "SELECT title,source_url,confidence_tier,author_id,rights_status FROM documents WHERE id=?",
                (doc_id,)).fetchone()
            author = None
            if doc and doc["author_id"]:
                a = con.execute("SELECT name FROM authors WHERE id=?", (doc["author_id"],)).fetchone()
                author = a["name"] if a else None
            out.append({
                "score": round(score, 4), "chunk_id": chunk_id, "doc_id": doc_id,
                "title": doc["title"] if doc else None,
                "source_url": (ch["source_url"] if ch else None) or (doc["source_url"] if doc else None),
                "author": author,
                "confidence_tier": doc["confidence_tier"] if doc else "reference",
                "snippet": (ch["content"][:160] if ch else ""),
            })
        return out
    finally:
        vs.close()
        con.close()


def _generate(prompt: str, timeout: int = 180) -> str:
    body = json.dumps({"model": GEN_MODEL, "prompt": prompt, "stream": False}).encode("utf-8")
    req = urllib.request.Request(OLLAMA_URL + "/api/generate", data=body,
                                 headers={"Content-Type": "application/json"})
    data = json.loads(urllib.request.urlopen(req, timeout=timeout).read())
    return (data.get("response") or "").strip()


def answer(query: str, db_path: str, vectors_path: Optional[str] = None, k: int = 5,
           model: str = embedder.EMBED_MODEL, generate: bool = True) -> Dict[str, Any]:
    hits = semantic_search(query, db_path, vectors_path, k, model)
    relevant = [h for h in hits if h["score"] >= MIN_SCORE]
    if not relevant:
        return {"query": query, "answer": "检索到的外部资料相关度不足，无法据此回答（不脑补）。建议换关键词或先扩采。",
                "citations": [], "uncited": False, "note": "置信层 reference，需验证"}
    citations = [{"n": i + 1, "title": h["title"], "source_url": h["source_url"],
                  "author": h["author"], "score": h["score"], "tier": h["confidence_tier"]}
                 for i, h in enumerate(relevant)]
    if not generate or not embedder.available(GEN_MODEL):
        return {"query": query, "answer": None, "citations": citations,
                "retrieved": relevant, "note": "未生成式作答：仅返回检索证据。置信层 reference，需验证"}
    ctx = "\n\n".join("[{}] {}（来源：{}）\n{}".format(
        i + 1, h["title"], h["source_url"], h["snippet"]) for i, h in enumerate(relevant))
    prompt = (
        "你是 SAP 知识助手。**只能**根据下面提供的资料回答，"
        "每个论断后用 [n] 标注来源编号；资料不足就直说不足，绝不编造。"
        "这些是外部采集的 reference 资料，回答末尾提示『以上为外部资料整理，需在系统中验证』。\n\n"
        "资料：\n" + ctx + "\n\n问题：" + query + "\n\n中文回答：")
    try:
        text = _generate(prompt)
        note = "置信层 reference，需验证（答案仅据检索到的外部资料生成）"
    except Exception:
        text = "生成模型调用失败，仅返回检索到的证据（见 citations），未生成式作答。"
        note = "置信层 reference，需验证（生成失败，仅返回检索证据）"
    return {"query": query, "answer": text, "citations": citations, "note": note}
