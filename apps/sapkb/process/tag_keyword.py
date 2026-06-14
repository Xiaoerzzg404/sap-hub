"""SAPKB 关键词标签（Cowork-Worker 认知模块）

按 configs/sapkb/sapkb_taxonomy.yaml 识别 module(FI/CO/MM/SD/PP) / process / tcode /
table / sap_ai，给标题+摘要打结构化标签。Run 01 走规则匹配（零 LLM，Tier 0），
Run 04 再叠加本地 LLM 实体识别。

返回 [{tag_type, tag_value, confidence, generated_by}]，可直接落 document_tags。
"""
from __future__ import annotations

import pathlib
import re
from typing import Any, Dict, List, Optional

import yaml

_DEFAULT_TAXONOMY = (
    pathlib.Path.home() / "sap-hub" / "configs" / "sapkb" / "sapkb_taxonomy.yaml"
)

_CACHE: Dict[str, Any] = {}


def _load_taxonomy(path: Optional[str] = None) -> Dict[str, Any]:
    key = str(path or _DEFAULT_TAXONOMY)
    if key not in _CACHE:
        with open(key, "r", encoding="utf-8") as f:
            _CACHE[key] = yaml.safe_load(f) or {}
    return _CACHE[key]


def _tcode_regex(tcode: str) -> re.Pattern:
    # tcode 多为字母+数字（F110/FB60/CK11N），用边界匹配避免子串误命中
    return re.compile(r"(?<![A-Za-z0-9])" + re.escape(tcode) + r"(?![A-Za-z0-9])", re.IGNORECASE)


def tag(title: str, summary: Optional[str] = None, taxonomy_path: Optional[str] = None) -> List[Dict[str, Any]]:
    text = " ".join([title or "", summary or ""])
    text_low = text.lower()
    tax = _load_taxonomy(taxonomy_path)
    out: List[Dict[str, Any]] = []
    seen = set()

    def add(tag_type: str, tag_value: str, confidence: float):
        k = (tag_type, tag_value)
        if k in seen:
            return
        seen.add(k)
        out.append({
            "tag_type": tag_type,
            "tag_value": tag_value,
            "confidence": confidence,
            "generated_by": "rule:taxonomy_v3",
        })

    modules = tax.get("modules", {})
    for mod_code, mod in modules.items():
        mod_hit = False
        # 模块名命中
        for name in (mod.get("names") or []):
            if name and name.lower() in text_low:
                mod_hit = True
        # 模块级 tcode/table（MM/SD 直接挂在模块下）
        for tc in (mod.get("tcodes") or []):
            if _tcode_regex(tc).search(text):
                add("tcode", tc, 0.95)
                mod_hit = True
        for tb in (mod.get("tables") or []):
            if _tcode_regex(tb).search(text):
                add("table", tb, 0.9)
                mod_hit = True
        # process 级（FI/CO 下的 AP/AR/GL/AA/Bank/CCA/...）
        for proc_code, proc in (mod.get("processes") or {}).items():
            proc_hit = False
            for name in (proc.get("names") or []):
                if name and name.lower() in text_low:
                    proc_hit = True
            for tc in (proc.get("tcodes") or []):
                if _tcode_regex(tc).search(text):
                    add("tcode", tc, 0.95)
                    proc_hit = True
            for tb in (proc.get("tables") or []):
                if _tcode_regex(tb).search(text):
                    add("table", tb, 0.9)
                    proc_hit = True
            if proc_hit:
                add("process", proc_code, 0.85)
                mod_hit = True
        if mod_hit:
            add("module", mod_code, 0.9)

    # SAP_AI 分支（R14 趋势种子）
    sap_ai = tax.get("SAP_AI", {})
    for group, terms in sap_ai.items():
        for term in (terms or []):
            if term and term.lower() in text_low:
                add("sap_ai", term, 0.8)

    # cross_topics
    for topic in tax.get("cross_topics", []) or []:
        names = [topic.get("name")] + (topic.get("aliases") or [])
        for name in names:
            if name and name.lower() in text_low:
                add("topic", topic.get("name"), 0.75)
                break

    return out
