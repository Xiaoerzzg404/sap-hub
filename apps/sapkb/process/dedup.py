"""SAPKB 去重（Cowork-Worker 认知模块）

铁律：**复用** ~/news/collect/bin/collect_lib.py 的去重原语
(canonical_url / title_norm / text_hash)，**不新写**去重算法。
本模块只是把那套原语接到 SAPKB 自己的 documents 表上做：
  1) URL 规范化去重（幂等：重复 harvest 不重复入库）
  2) 转载归并（不同 URL、相同标题）→ 写 canonical_document_id，累加 repost_count/platform_count

stage2 的 embedding 去重（摘要生成后、阈值 0.92）留给 Run 02，本轮只做 stage1。
"""
from __future__ import annotations

import pathlib
import sys
from typing import Any, Dict, Optional, Tuple

# --- 复用 collect 去重原语（禁止新写） ---
_COLLECT_BIN = pathlib.Path.home() / "news" / "collect" / "bin"
if str(_COLLECT_BIN) not in sys.path:
    sys.path.insert(0, str(_COLLECT_BIN))

try:
    import collect_lib  # type: ignore
    canonical_url = collect_lib.canonical_url
    title_norm = collect_lib.title_norm
    text_hash = collect_lib.text_hash
    REUSED_COLLECT = True
except Exception:  # pragma: no cover - 仅当 collect 不可用时的安全兜底
    REUSED_COLLECT = False
    import hashlib
    import re
    import urllib.parse

    _PUNCT = re.compile(r"[\s\-_/\\:*?\"<>|#^\[\]，。、！？：；（）()【】]+")

    def canonical_url(url: str) -> str:
        raw = (url or "").strip()
        if not raw:
            return ""
        p = urllib.parse.urlsplit(raw)
        netloc = p.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = p.path.rstrip("/") if p.path != "/" else p.path
        return urllib.parse.urlunsplit(((p.scheme or "https").lower(), netloc, path, "", ""))

    def title_norm(title: str) -> str:
        return _PUNCT.sub("", (title or "").strip().lower())

    def text_hash(text: str) -> str:
        clean = re.sub(r"\s+", " ", (text or "").strip())
        return hashlib.sha1(clean.encode("utf-8")).hexdigest()[:24] if clean else ""


def fingerprint(record: Dict[str, Any]) -> Dict[str, str]:
    """对一条采集记录算去重指纹。"""
    return {
        "orig_url": record.get("source_url") or "",
        "canonical_url": canonical_url(record.get("source_url") or ""),
        "title_norm": title_norm(record.get("title") or ""),
        "text_hash": text_hash(record.get("summary") or record.get("title") or ""),
    }


def find_duplicate(con, record: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    """在 documents 表里找重复。

    返回 (dup_type, canonical_id)：
      - ("url", id)   规范化 URL 命中既有正主（含完全相同 URL 的幂等场景）
      - ("title", id) 标题归一命中既有正主 → 判为转载
      - (None, None)  新文章
    只比对正主（canonical_document_id IS NULL），避免把转载再指向转载。
    """
    fp = fingerprint(record)
    # 1) 规范化 URL 命中：对【全部】文档（含已归并的转载行）比对——
    #    保证重复 harvest 的幂等性（转载行自身 URL 再次出现时也判 url-dup，不再重复计热度）。
    all_rows = con.execute(
        "SELECT id, source_url FROM documents WHERE content_status != 'removed'"
    ).fetchall()
    for r in all_rows:
        rid = r[0] if not isinstance(r, dict) else r["id"]
        rurl = r[1] if not isinstance(r, dict) else r["source_url"]
        if fp["canonical_url"] and canonical_url(rurl or "") == fp["canonical_url"]:
            return ("url", rid)
    # 2) 标题归一命中：只对【正主】（canonical_document_id IS NULL）比对 → 判为新转载。
    primaries = con.execute(
        "SELECT id, title FROM documents "
        "WHERE canonical_document_id IS NULL AND content_status != 'removed'"
    ).fetchall()
    for r in primaries:
        rid = r[0] if not isinstance(r, dict) else r["id"]
        rtitle = r[1] if not isinstance(r, dict) else r["title"]
        if fp["title_norm"] and title_norm(rtitle or "") == fp["title_norm"]:
            return ("title", rid)
    return (None, None)


def register_repost(con, canonical_id: str, same_platform: bool = False) -> None:
    """把一条判为转载的记录计入正主的热度信号（R12：去重副产品=免费热度）。"""
    con.execute(
        "UPDATE documents SET repost_count = COALESCE(repost_count,0) + 1, "
        "platform_count = COALESCE(platform_count,1) + ? WHERE id = ?",
        (0 if same_platform else 1, canonical_id),
    )
