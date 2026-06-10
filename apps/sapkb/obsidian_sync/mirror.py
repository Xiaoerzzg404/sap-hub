"""SAPKB 作者/专栏门户镜像（Cowork-Worker，Run03，需求8）

达阈值即在 SAP_EXTKB 生成【纯门户】md（不复制正文）：
- 03_authors/<作者>.md：作者聚合门户（Dataview + DB 静态条数）。
- 02_columns/<作者>__<专栏>.md：专栏门户，**按 seq_in_column 还原篇序**，标"已收 N 篇/最大篇序K/缺失[..]"。

物理文件唯一铁律（docs/07）：门户只放视图，正文仍在 10_articles/00_inbox。
DB 是真相：门户既给 Obsidian 用的 Dataview 块，也给一段 DB 直出的静态篇序表（不依赖插件即可核对）。
回写 columns.mirror_status / mirror_path。绝不写 SAP_FUZHKB。
"""
from __future__ import annotations

import pathlib
import re
import sqlite3
from typing import Any, Dict, List, Optional

_SLUG_BAD = re.compile(r'[/\\:*?"<>|#^\[\]]+')
_SLUG_SPACE = re.compile(r"\s+")

DEFAULT_AUTHOR_THRESHOLD = 5
DEFAULT_COLUMN_THRESHOLD = 3


def _slug(text: str, maxlen: int = 40) -> str:
    clean = _SLUG_BAD.sub("", text or "untitled")
    return _SLUG_SPACE.sub("_", clean.strip())[:maxlen] or "untitled"


def _guard(vault_root: str) -> pathlib.Path:
    root = pathlib.Path(vault_root).expanduser()
    if "SAP_FUZHKB" in str(root):
        raise PermissionError("vault 隔离铁律：禁止写入 SAP_FUZHKB")
    return root


def build_author_portals(con, vault_root: str, threshold: int = DEFAULT_AUTHOR_THRESHOLD) -> List[str]:
    root = _guard(vault_root)
    out_dir = root / "03_authors"
    out_dir.mkdir(parents=True, exist_ok=True)
    written: List[str] = []
    rows = con.execute(
        "SELECT a.id,a.name,a.platform,a.homepage_url,a.manual_rating,COUNT(d.id) AS n "
        "FROM authors a JOIN documents d ON d.author_id=a.id "
        "WHERE d.content_status!='removed' GROUP BY a.id HAVING n >= ?",
        (threshold,),
    ).fetchall()
    for r in rows:
        aid, name, platform, homepage, rating, n = r[0], r[1], r[2], r[3], r[4], r[5]
        fname = _slug(name) + ".md"
        body = [
            "---", "portal: author", "author: {}".format(name),
            "platform: {}".format(platform or ""), "doc_count: {}".format(n),
            "homepage: {}".format(homepage or ""),
            "your_rating: {}".format(rating if rating is not None else ""),
            "---", "", "# 作者门户 · {}".format(name),
            "", "> 已收录 **{} 篇**（来源 {}）。外部采集=reference，作答需验证。".format(n, platform or "未知"),
            "", "## 收录文章（Dataview）", "```dataview",
            'TABLE modules AS 模块, rights_status AS 授权, imported_at AS 收录',
            'FROM "00_inbox" OR "10_articles"',
            'WHERE author = "{}"'.format(name), "SORT imported_at DESC", "```", "",
        ]
        (out_dir / fname).write_text("\n".join(body), encoding="utf-8")
        written.append("03_authors/" + fname)
    return written


def build_column_portals(con, vault_root: str, threshold: int = DEFAULT_COLUMN_THRESHOLD) -> List[Dict[str, Any]]:
    root = _guard(vault_root)
    out_dir = root / "02_columns"
    out_dir.mkdir(parents=True, exist_ok=True)
    results: List[Dict[str, Any]] = []
    cols = con.execute(
        "SELECT c.id,c.title,c.platform,c.source_url,c.item_count,a.name "
        "FROM columns c LEFT JOIN authors a ON a.id=c.author_id "
        "WHERE c.item_count >= ?", (threshold,),
    ).fetchall()
    for c in cols:
        col_id, title, platform, src, item_count, author = c[0], c[1], c[2], c[3], c[4], c[5]
        items = con.execute(
            "SELECT ci.seq_in_column, d.title, d.source_url, d.obsidian_path "
            "FROM column_items ci JOIN documents d ON d.id=ci.document_id "
            "WHERE ci.column_id=? AND d.content_status!='removed' "
            "ORDER BY ci.seq_in_column ASC", (col_id,),
        ).fetchall()
        seqs = [it[0] for it in items if it[0] is not None]
        max_seq = max(seqs) if seqs else 0
        missing = [s for s in range(1, max_seq + 1) if s not in seqs] if max_seq else []
        mirror_status = "full" if (max_seq and not missing) else "partial"
        author = author or "未知作者"

        # DB 直出的静态篇序表（不依赖 Dataview 即可核对篇序还原）
        static_rows = []
        for seq, dtitle, durl, opath in items:
            link = "[[{}|{}]]".format(opath.rsplit('.md', 1)[0], dtitle) if opath else "[{}]({})".format(dtitle, durl)
            static_rows.append("| {} | {} |".format(seq if seq is not None else "-", link))
        progress = "已收录 **{} 篇**，最大篇序 {}".format(item_count, max_seq)
        if missing:
            progress += "，缺失篇序：{}".format(missing)
        else:
            progress += "，篇序连续完整"

        body = [
            "---", "portal: column", "column: {}".format(title),
            "author: {}".format(author), "platform: {}".format(platform or ""),
            "source_url: {}".format(src or ""), "item_count: {}".format(item_count),
            "mirror_status: {}".format(mirror_status), "---", "",
            "# 专栏门户 · {}".format(title), "", "> 作者：{} · {}".format(author, progress), "",
            "## 篇序（DB 直出，权威）", "", "| 篇序 | 文章 |", "| --- | --- |",
        ]
        body += static_rows
        body += [
            "", "## 篇序（Dataview，Obsidian 内）", "```dataview",
            'TABLE rights_status AS 授权, imported_at AS 收录',
            'FROM "00_inbox" OR "10_articles"',
            'WHERE contains(file.frontmatter.columns.name, "{}")'.format(title),
            "SORT columns[0].seq ASC", "```", "",
        ]
        fname = "{}__{}.md".format(_slug(author, 20), _slug(title, 20))
        (out_dir / fname).write_text("\n".join(body), encoding="utf-8")
        rel = "02_columns/" + fname
        con.execute("UPDATE columns SET mirror_status=?, mirror_path=?, updated_at=datetime('now') WHERE id=?",
                    (mirror_status, rel, col_id))
        results.append({"column": title, "author": author, "item_count": item_count,
                        "max_seq": max_seq, "missing": missing, "mirror_status": mirror_status, "path": rel})
    return results


def run_mirror(db_path: str, vault_root: str, author_threshold: int = DEFAULT_AUTHOR_THRESHOLD,
               column_threshold: int = DEFAULT_COLUMN_THRESHOLD) -> Dict[str, Any]:
    con = sqlite3.connect(db_path)
    con.execute("PRAGMA foreign_keys = ON;")
    try:
        authors = build_author_portals(con, vault_root, author_threshold)
        columns = build_column_portals(con, vault_root, column_threshold)
        con.commit()
        return {"author_portals": authors, "author_count": len(authors),
                "column_portals": columns, "column_count": len(columns)}
    finally:
        con.close()
