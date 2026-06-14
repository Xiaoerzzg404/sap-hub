"""SAPKB 分块（Cowork-Worker，Run04）

铁律：只对【已授权可全文】的文档分全文；metadata_only/summary_only 文档只对
title+summary 建一个检索块（绝不凭空补全文）。块写入 chunks 表（含 embedding 元数据）。
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

_FULLTEXT_RIGHTS = {"user_imported", "license_purchased", "own_content", "fulltext_allowed"}
TARGET_CHARS = 600        # 每块目标字符数（中文按字符近似 token）
OVERLAP = 80


def estimate_tokens(text: str) -> int:
    # 中文按字符、英文按 ~4 字符/词的粗略估计
    return max(1, len(text or ""))


def _split_long(text: str, target: int = TARGET_CHARS, overlap: int = OVERLAP) -> List[str]:
    text = re.sub(r"\n{3,}", "\n\n", (text or "").strip())
    if len(text) <= target:
        return [text] if text else []
    paras = re.split(r"\n\n+", text)
    chunks: List[str] = []
    buf = ""
    for p in paras:
        if len(buf) + len(p) + 2 <= target:
            buf = (buf + "\n\n" + p) if buf else p
        else:
            if buf:
                chunks.append(buf)
            if len(p) > target:
                for i in range(0, len(p), target - overlap):
                    chunks.append(p[i:i + target])
                buf = ""
            else:
                buf = p
    if buf:
        chunks.append(buf)
    return chunks


def chunk_document(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """doc: {id,title,summary,rights_status,body(可选),source_url}. 返回 chunk dict 列表。"""
    title = doc.get("title") or ""
    summary = doc.get("summary") or ""
    rights = doc.get("rights_status") or "metadata_only"
    body = doc.get("body") if rights in _FULLTEXT_RIGHTS else None

    pieces: List[str] = []
    if body:
        pieces = _split_long(body)
        # 首块前置标题，利于检索
        if pieces:
            pieces[0] = (title + "\n\n" + pieces[0]).strip()
    else:
        head = (title + "\n" + summary).strip()
        if head:
            pieces = [head]

    out: List[Dict[str, Any]] = []
    for i, content in enumerate(pieces):
        out.append({
            "chunk_index": i,
            "heading_path": title if i == 0 else "",
            "content": content,
            "token_count": estimate_tokens(content),
            "source_url": doc.get("source_url"),
        })
    return out
