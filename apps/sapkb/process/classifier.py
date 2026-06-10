"""SAPKB 文章分类器（Cowork-Worker，Run06，Ryan 2026-06-10 指令）

给每篇文章定**一个主分类 category** + **内容类型 content_type** + 关键词，落 document_tags。
- category 优先取 SAP 模块（FI/CO/MM/SD/...）；无模块则取内容类型（news/技术分析/教程/...）。
- content_type：news / 技术分析 / 教程 / 配置 / 故障排查 / 项目经验 / 概念 / 面试。
关键词标签复用 tag_keyword（module/process/tcode/table/sap_ai/topic）。
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from . import tag_keyword

# 内容类型关键词（命中即判该类型；按列表顺序优先）
_CONTENT_RULES = [
    ("news", ["发布", "宣布", "推出", "上线", "release", "announce", "新闻", "财报", "收购", "GA ", "正式可用"]),
    ("教程", ["入门", "教程", "百科全书", "目录", "从入门到", "30天", "手把手", "学习路线", "从零", "系列", "实战(", "tutorial"]),
    ("配置", ["配置", "config", "定制", "customizing", "设置指南", "参数", "FBZP", "IMG"]),
    ("故障排查", ["报错", "排查", "解决", "异常", "troubleshoot", "error", "踩坑", "无法", "失败", "dump"]),
    ("技术分析", ["源码", "源代码", "解析", "原理", "架构", "深入", "底层", "机制", "architecture", "内核", "剖析"]),
    ("项目经验", ["项目", "实施", "上线经验", "复盘", "案例", "经验", "踩过的坑"]),
    ("面试", ["面试", "interview", "面经", "笔试"]),
    ("概念", ["是什么", "概念", "介绍", "overview", "what is", "简介"]),
]

# 模块优先级（同时命中多个时取靠前者作主分类，FICO 主线优先）。
# 注：taxonomy 当前 module 仅 FI/CO/MM/SD；PP/PS/QM/WM/HR/BC 未在 taxonomy，
# 只有 ABAP/BTP/BASIS 经 _TECH_DOMAIN 命中；其余码命中不到则文章落到 content_type 主分类（FinalReview LOW-2）。
_MODULE_PRIORITY = ["FI", "CO", "MM", "SD", "PP", "PS", "QM", "WM", "HR", "BC", "ABAP", "BTP", "BASIS"]
# taxonomy 之外但用户常用的“伪模块”关键词（ABAP/BTP 等技术域），用于主分类兜底
_TECH_DOMAIN = {
    "ABAP": ["abap", "cds view", "amdp", "oo abap", "rap", "ras "],
    "BTP": ["btp", "business technology platform", "cap ", "cloud foundry", "kyma", "fiori", "ui5", "hana cloud"],
    "BASIS": ["basis", "运维", "传输", "tr ", "stms", "权限", "pfcg", "su01"],
}


def _content_type(text_low: str) -> str:
    for ctype, kws in _CONTENT_RULES:
        for kw in kws:
            if kw.lower() in text_low:
                return ctype
    return "概念"


def classify(title: str, summary: Optional[str] = None,
             source_platform: Optional[str] = None,
             taxonomy_path: Optional[str] = None) -> Dict[str, Any]:
    text = " ".join([title or "", summary or ""])
    low = text.lower()

    tags = tag_keyword.tag(title, summary, taxonomy_path)
    modules = [t["tag_value"] for t in tags if t["tag_type"] == "module"]

    # 技术域兜底（ABAP/BTP/BASIS），补进“模块级”候选
    tech_hit = [dom for dom, kws in _TECH_DOMAIN.items() if any(k in low for k in kws)]

    content_type = _content_type(low)
    # 官方新闻源直接判 news
    if (source_platform or "") in ("sap_news", "sap_community"):
        content_type = "news" if content_type in ("概念",) else content_type

    # 主分类：优先真实 SAP 功能模块 → 技术域 → 内容类型
    primary = None
    for m in _MODULE_PRIORITY:
        if m in modules or m in tech_hit:
            primary = m
            break
    category = primary if primary else content_type

    extra: List[Dict[str, Any]] = list(tags)
    extra.append({"tag_type": "category", "tag_value": category, "confidence": 0.8, "generated_by": "rule:classifier_v1"})
    extra.append({"tag_type": "content_type", "tag_value": content_type, "confidence": 0.75, "generated_by": "rule:classifier_v1"})
    for d in tech_hit:
        extra.append({"tag_type": "tech_domain", "tag_value": d, "confidence": 0.7, "generated_by": "rule:classifier_v1"})
    return {"category": category, "content_type": content_type, "modules": modules,
            "tech_domain": tech_hit, "tags": extra}
