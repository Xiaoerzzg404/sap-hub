"""SAPKB → SAP_EXTKB/00_inbox 写入（Cowork-Worker 认知模块）

把一条入库记录渲染成带【版权头 frontmatter】的 md，写进 SAP_EXTKB/00_inbox/。
铁律：只写 SAP_EXTKB，绝不写 SAP_FUZHKB；默认不落正文（rights 不足时正文段留空）。

slug 命名（docs/07 v3）：<docid前8位>_<标题清洗后前40字>.md
"""
from __future__ import annotations

import pathlib
import re
from typing import Any, Dict, List, Optional

_SLUG_BAD = re.compile(r'[/\\:*?"<>|#^\[\]]+')
_SLUG_SPACE = re.compile(r"\s+")

# 允许落地全文的 rights
_FULLTEXT_RIGHTS = {"user_imported", "license_purchased", "own_content", "fulltext_allowed"}


def make_slug(doc_id: str, title: str) -> str:
    prefix = (doc_id or "").replace("-", "")[:8] or "00000000"
    clean = _SLUG_BAD.sub("", title or "untitled")
    clean = _SLUG_SPACE.sub("_", clean.strip())[:40]
    return "{}_{}.md".format(prefix, clean or "untitled")


def _yaml_list(items: Optional[List[str]]) -> str:
    if not items:
        return "[]"
    return "[" + ", ".join(str(x) for x in items) + "]"


def render_markdown(doc: Dict[str, Any], tags: Optional[List[Dict[str, Any]]] = None) -> str:
    tags = tags or []
    modules = sorted({t["tag_value"] for t in tags if t["tag_type"] == "module"})
    tcodes = sorted({t["tag_value"] for t in tags if t["tag_type"] == "tcode"})
    tables = sorted({t["tag_value"] for t in tags if t["tag_type"] == "table"})
    obs_tags: List[str] = []
    for t in tags:
        if t["tag_type"] == "process":
            obs_tags.append("process/" + t["tag_value"])
    obs_tags.append("source/" + str(doc.get("source_platform") or "unknown"))

    rights = doc.get("rights_status") or "metadata_only"
    can_repub = "true" if rights in {"own_content", "fulltext_allowed", "license_purchased"} else "false"
    has_fulltext = rights in _FULLTEXT_RIGHTS and bool(doc.get("body"))

    author = doc.get("author") or "未知作者"
    url = doc.get("source_url") or ""
    platform = doc.get("source_platform") or ""

    fm = [
        "---",
        "title: {}".format(doc.get("title") or ""),
        "doc_id: {}".format(doc.get("id") or ""),
        "source_platform: {}".format(platform),
        "author: {}".format(author),
        'author_link: "[[03_authors/{}]]"'.format(author),
        "columns: []",
        "source_url: {}".format(url),
        "published_at: {}".format(doc.get("published_at") or ""),
        "imported_at: {}".format(doc.get("imported_at") or ""),
        "import_mode: {}".format(doc.get("import_mode") or "metadata_only"),
        "rights_status: {}".format(rights),
        "confidence_tier: {}".format(doc.get("confidence_tier") or "reference"),
        "modules: {}".format(_yaml_list(modules)),
        "tcodes: {}".format(_yaml_list(tcodes)),
        "tables: {}".format(_yaml_list(tables)),
        "tags: {}".format(_yaml_list(obs_tags)),
        "can_republish: {}".format(can_repub),
        "triaged: false",
        "---",
        "",
        "> [!warning] 置信层：reference（外部采集，需验证）",
        "> 来源：[{} @ {}]({}) · 导入方式：{}".format(author, platform, url, doc.get("import_mode") or "metadata_only"),
        "",
        "## 摘要",
        (doc.get("summary") or "（metadata_only：仅登记标题与链接，未抓摘要正文）"),
        "",
        "## 关键事实（带来源）",
        "- ",
        "",
        "## 我的笔记 / 验证状态",
        "- [ ] 已在系统验证",
        "- 与 SAP_FUZHKB 对应配置的差异：",
        "",
        "## 原文",
    ]
    if has_fulltext:
        fm.append(str(doc.get("body")))
    else:
        fm.append("（rights_status={}：未授权落地全文，仅保留链接）".format(rights))
    fm.append("")
    return "\n".join(fm)


def write(doc: Dict[str, Any], vault_root: str, tags: Optional[List[Dict[str, Any]]] = None,
          subdir: str = "00_inbox") -> str:
    """渲染并写入 vault，返回相对 vault 的 obsidian_path。"""
    root = pathlib.Path(vault_root).expanduser()
    # 防呆：拒绝写入 FUZHKB
    if "SAP_FUZHKB" in str(root):
        raise PermissionError("vault 隔离铁律：禁止写入 SAP_FUZHKB")
    target_dir = root / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    slug = make_slug(doc.get("id") or "", doc.get("title") or "")
    path = target_dir / slug
    path.write_text(render_markdown(doc, tags), encoding="utf-8")
    return "{}/{}".format(subdir, slug)
