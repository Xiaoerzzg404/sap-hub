"""SAPKB 本地 embedding（Cowork-Worker，Run04）

走本机 Ollama 的 bge-m3（1024 维），纯本地、不外发。HTTP /api/embeddings，仅 GET 文本→向量。
"""
from __future__ import annotations

import json
import urllib.request
from typing import List, Optional

OLLAMA_URL = "http://localhost:11434"
EMBED_MODEL = "bge-m3"


class KBEmbedError(RuntimeError):
    """Ollama/embedding 不可用时的友好异常（FinalReview H2）。"""


def available(model: str = EMBED_MODEL) -> bool:
    try:
        req = urllib.request.Request(OLLAMA_URL + "/api/tags")
        data = json.loads(urllib.request.urlopen(req, timeout=10).read())
        names = [m.get("name", "") for m in (data.get("models") or [])]
        return any(model in n for n in names)
    except Exception:
        return False


def embed_text(text: str, model: str = EMBED_MODEL, timeout: int = 120) -> List[float]:
    body = json.dumps({"model": model, "prompt": text or ""}).encode("utf-8")
    req = urllib.request.Request(OLLAMA_URL + "/api/embeddings", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=timeout).read())
    except Exception as exc:  # 网络/Ollama 未起/模型缺失 → 友好异常
        raise KBEmbedError(
            "embedding 失败（{}）。请确认本机 Ollama 已启动且已拉取模型："
            "`ollama serve` + `ollama pull {}`".format(type(exc).__name__, model)) from exc
    return data.get("embedding") or []


def embed_batch(texts: List[str], model: str = EMBED_MODEL) -> List[List[float]]:
    return [embed_text(t, model) for t in texts]
