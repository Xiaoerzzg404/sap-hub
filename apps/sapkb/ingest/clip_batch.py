"""SAPKB 批量全文导入（Cowork-Worker，Run07）

把"你已手动下载的一整个文件夹的文章正文"一次性补进库（走 clip 的全文升级，零账号风险）。
两种用法：
  1) 文件夹模式 by_filename_id：文件名 = CSDN 文章 id（如 151856954.md），自动匹配已采元数据的同 id 文档 → 补全文。
  2) manifest 模式：一个 CSV(url,file[,title,author,author_uid]) 显式映射，支持新文与升级。
批量统一套 CSDN VIP 订阅授权（license_info）。逐条报告 imported/upgraded/duplicate/skipped。

红线同 clip：单条手动确认的下载件、不登录/不cookie/不抓全文。本工具只是把 clip 重复调用包一层。
"""
from __future__ import annotations

import csv
import os
import pathlib
import re
import sqlite3
from typing import Any, Dict, List, Optional

from . import clip

_ID_RE = re.compile(r"^\d{6,}$")   # 仅接受【纯数字】文件名作 CSDN 文章 id，避免日期前缀误配（FinalReview MED-1）


def _existing_by_id(con, article_id: str) -> Optional[Dict[str, Any]]:
    # 精确匹配：文章 id 是 URL 末段（CSDN: .../details/<id> 或 .../<id>，可带 ?query）
    row = con.execute(
        "SELECT d.id,d.source_url,d.title,a.name,a.platform_uid "
        "FROM documents d LEFT JOIN authors a ON a.id=d.author_id "
        "WHERE d.source_url LIKE ? OR d.source_url LIKE ? OR d.source_url LIKE ? LIMIT 1",
        ("%/" + article_id, "%/" + article_id + "?%", "%details/" + article_id + "%")).fetchone()
    if not row:
        return None
    return {"doc_id": row[0], "url": row[1], "title": row[2], "author": row[3], "author_uid": row[4]}


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def run_batch(db_path: str, vault_root: str, folder: Optional[str] = None,
              manifest: Optional[str] = None, by_filename_id: bool = True,
              platform: str = "csdn", license_info: Optional[Dict[str, Any]] = None,
              exts=(".md", ".txt", ".html")) -> Dict[str, Any]:
    summary = {"total": 0, "imported": 0, "upgraded": 0, "duplicate": 0, "skipped": 0, "items": []}
    con = sqlite3.connect(db_path)
    try:
        jobs: List[Dict[str, Any]] = []

        if folder:
            for fn in sorted(os.listdir(folder)):
                fp = os.path.join(folder, fn)
                if not os.path.isfile(fp) or os.path.splitext(fn)[1].lower() not in exts:
                    continue
                stem = os.path.splitext(fn)[0]
                content = _read(fp)
                if by_filename_id:
                    if not _ID_RE.match(stem):
                        jobs.append({"file": fn, "skip": "filename_not_pure_article_id"})
                        continue
                    ex = _existing_by_id(con, stem)
                    if not ex:
                        jobs.append({"file": fn, "skip": "no_matching_metadata_for_id_" + stem})
                        continue
                    jobs.append({"url": ex["url"], "title": ex["title"] or "x", "author": ex["author"] or "",
                                 "author_uid": ex["author_uid"], "content": content, "file": fn})
                else:
                    jobs.append({"file": fn, "skip": "folder_mode_needs_by_filename_id_or_manifest"})

        if manifest:
            mdir = os.path.dirname(os.path.abspath(manifest))
            with open(manifest, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    url = (row.get("url") or "").strip()
                    fileref = (row.get("file") or "").strip()
                    if not url or not fileref:
                        jobs.append({"skip": "manifest_row_missing_url_or_file"})
                        continue
                    fp = fileref if os.path.isabs(fileref) else os.path.join(mdir, fileref)
                    if not os.path.exists(fp):
                        jobs.append({"url": url, "skip": "file_not_found_" + fileref})
                        continue
                    title = (row.get("title") or "").strip()
                    if not title:  # 升级场景标题用已采的
                        ex = con.execute("SELECT title FROM documents WHERE source_url=? LIMIT 1", (url,)).fetchone()
                        title = (ex[0] if ex else "") or url
                    jobs.append({"url": url, "title": title, "author": (row.get("author") or "").strip(),
                                 "author_uid": (row.get("author_uid") or "").strip() or None,
                                 "content": _read(fp), "file": fileref})

        for j in jobs:
            summary["total"] += 1
            if j.get("skip"):
                summary["skipped"] += 1
                summary["items"].append({"file": j.get("file"), "status": "skipped", "reason": j["skip"]})
                continue
            try:
                r = clip.clip_import(j["url"], j["title"], j.get("author") or "", j["content"],
                                     db_path, vault_root, platform=platform,
                                     license_info=license_info, author_uid=j.get("author_uid"))
                st = r.get("status", "?")
                summary[st] = summary.get(st, 0) + 1 if st in ("imported", "upgraded", "duplicate") else summary.get(st, 0)
                summary["items"].append({"file": j.get("file"), "status": st, "doc_id": r.get("doc_id")})
            except Exception as e:
                summary["skipped"] += 1
                summary["items"].append({"file": j.get("file"), "status": "error", "reason": str(e)[:80]})
        return summary
    finally:
        con.close()
