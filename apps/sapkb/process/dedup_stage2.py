"""SAPKB stage2 近重复去重（Cowork-Worker 认知模块，Run02）

设计（routing_policy dedup.stage2）：摘要生成后，对 title+summary 做向量相似度，
判近重复转载；**auto_merge=false** → 疑似对进 needs_review（审计候选），不自动归并，人工确认后再并。

向量后端可插拔：
- 默认 `charngram`：本地 char-trigram 词频余弦，零模型、确定性、可复现，适合搬运近重复标题。
- 预留 `bge_m3`（Ollama embedding）：Run04 模型就绪后切换，阈值用 routing_policy 的 0.92。
不同后端相似度尺度不同，各自带默认阈值（charngram 默认 0.86，语义 embedding 用 0.92）。
"""
from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

_WS_RE = re.compile(r"\s+")
_PUNCT_RE = re.compile(r"[\s\-_/\\:*?\"<>|#^\[\]，。、！？：；（）()【】.]+")

# 双信号阈值：搬运近重复通常【标题几乎一致】（即便正文被改写），
# 或【全文几乎一致】（纯复制粘贴）。任一越线即判候选。
# charngram 标题信号强（实测真转载 title≈0.78、无关对≤0.49，0.72 干净分隔）；
# 语义 embedding(bge_m3) 用 routing_policy 的 0.92。
DEFAULT_THRESHOLDS = {
    "charngram": {"title": 0.72, "combined": 0.86},
    "bge_m3": {"title": 0.90, "combined": 0.92},
}


def _norm(text: str) -> str:
    return _PUNCT_RE.sub("", (text or "").strip().lower())


def _char_ngrams(text: str, n: int = 3) -> Counter:
    t = _norm(text)
    if len(t) < n:
        return Counter([t]) if t else Counter()
    return Counter(t[i:i + n] for i in range(len(t) - n + 1))


def _cosine(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0
    common = set(a) & set(b)
    dot = sum(a[k] * b[k] for k in common)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _vectorize(text: str, backend: str) -> Counter:
    # 目前仅实现 charngram；bge_m3 留作 Run04（需 Ollama embedding 模型）。
    # 防误用（FinalReview W-NIT-3）：bge_m3 未实装时直接报错，杜绝用 char-trigram 相似度
    # 套 0.92 语义阈值导致的静默假阴性。
    if backend == "bge_m3":
        raise NotImplementedError(
            "backend=bge_m3 尚未接入（需 Ollama embedding 模型，Run04）。当前请用 charngram。")
    if backend != "charngram":
        raise ValueError("未知 backend: {}".format(backend))
    return _char_ngrams(text, 3)


def similarity(text_a: str, text_b: str, backend: str = "charngram") -> float:
    return _cosine(_vectorize(text_a, backend), _vectorize(text_b, backend))


def find_near_duplicates(docs: List[Dict[str, Any]], backend: str = "charngram",
                         threshold: Optional[float] = None) -> List[Dict[str, Any]]:
    """对一批文档（每个 dict 含 id/title/summary/canonical_document_id）两两找近重复。

    只比较【正主】之间（canonical_document_id 为空）。对每对算两路相似度：
      title_sim（标题）与 combined_sim（标题+摘要）。任一越各自阈值即判候选。
    返回 [{a,b,a_title,b_title,title_sim,combined_sim,score,signal,backend,threshold}]，
    按 score(取两路较大者) 降序。不修改任何数据（auto_merge=false）。
    """
    th = DEFAULT_THRESHOLDS.get(backend, DEFAULT_THRESHOLDS["charngram"])
    title_th = th["title"]
    combined_th = threshold if threshold is not None else th["combined"]
    primaries = [d for d in docs if not d.get("canonical_document_id")]
    tvec = {d["id"]: _vectorize(d.get("title") or "", backend) for d in primaries}
    cvec = {d["id"]: _vectorize((d.get("title") or "") + " " + (d.get("summary") or ""), backend)
            for d in primaries}
    out: List[Dict[str, Any]] = []
    for i in range(len(primaries)):
        for j in range(i + 1, len(primaries)):
            da, db = primaries[i], primaries[j]
            ts = _cosine(tvec[da["id"]], tvec[db["id"]])
            cs = _cosine(cvec[da["id"]], cvec[db["id"]])
            signals = []
            if ts >= title_th:
                signals.append("title")
            if cs >= combined_th:
                signals.append("combined")
            if signals:
                out.append({"a": da["id"], "b": db["id"], "a_title": da.get("title"),
                            "b_title": db.get("title"), "title_sim": round(ts, 4),
                            "combined_sim": round(cs, 4), "score": round(max(ts, cs), 4),
                            "signal": "+".join(signals), "backend": backend,
                            "threshold": {"title": title_th, "combined": combined_th}})
    out.sort(key=lambda x: x["score"], reverse=True)
    return out
