"""SAPKB 人工全文导入工具（docs/11 剪藏器·形态2 CLI，Cowork-Worker，Run05）

定位：单条、手动、人在环路。你在自己浏览器里用自己的登录态打开**你有权查看**的文章，
手动复制正文 → 本工具从剪贴板(pbpaste)或 --content-file 读入 + 你给 URL/作者/标题 → 入库为
user_imported 全文。可选登记已购授权(licenses，evidence 文件必须存在)。

红线（写死，违反即不做）：
- 不存/不读账号密码、不替你登录、不持 Cookie/token、不绕验证码、不破付费墙、不代理池、不后台批量。
- 只保存“你当前已能看到的这一页”，单条手动触发。
- 默认 rights_status=user_imported / confidence_tier=reference / can_republish=false。
- 是否可转载仍走版权判定，剪藏动作本身不解锁转载权。
"""
from __future__ import annotations

import datetime
import hashlib
import os
import pathlib
import subprocess
import sys
from typing import Any, Dict, Optional

_HERE = pathlib.Path(__file__).resolve().parent
for _p in (str(_HERE.parent),):
    if _p not in sys.path:
        sys.path.insert(0, _p)


def _now() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _today() -> str:
    return datetime.date.today().isoformat()


def _sid(*parts: str) -> str:
    return hashlib.sha1("|".join(p or "" for p in parts).encode("utf-8")).hexdigest()[:16]


def read_clipboard() -> str:
    """macOS pbpaste 读剪贴板（你手动复制的、你有权查看的正文）。"""
    try:
        out = subprocess.run(["pbpaste"], capture_output=True, timeout=10)
        return out.stdout.decode("utf-8", "ignore")
    except Exception:
        return ""


def clip_import(url: str, title: str, author: str, content: str,
                db_path: str, vault_root: str,
                platform: str = "manual", modules: Optional[list] = None,
                license_info: Optional[Dict[str, Any]] = None,
                author_uid: Optional[str] = None) -> Dict[str, Any]:
    """把一条手动确认的全文导入 SAPKB。url/title/content 必填。"""
    import sqlite3
    from ingest import compliance_gate  # noqa
    from process import dedup, tag_keyword  # noqa
    from obsidian_sync import write_inbox  # noqa

    if not (url and title and content):
        raise ValueError("clip_import 需要 url + title + content（你手动确认的全文）")

    con = sqlite3.connect(db_path)
    con.execute("PRAGMA foreign_keys = ON;")
    try:
        # 去重：复用 collect 指纹，防你重复剪藏同一篇
        dup_type, canon = dedup.find_duplicate(con, {"source_url": url, "title": title})
        if dup_type == "url":
            return {"status": "duplicate", "reason": "url_already_imported", "canonical": canon}

        # 授权判定：有 license 且 evidence 存在 → license_purchased；否则 user_imported（自用全文）
        rights = "user_imported"
        import_mode = "fulltext_user_imported"
        if license_info:
            ev = license_info.get("evidence_path")
            if not ev or not os.path.exists(os.path.expanduser(ev)):
                raise FileNotFoundError(
                    "已购授权登记要求 evidence 文件存在：{}（发票/许可截图）".format(ev))
            rights = "license_purchased"
            import_mode = "license_purchased"

        doc_id = "d_" + _sid(url or title)
        # author_id 与 pipeline._upsert_author 对齐（FinalReview M2/M3）：优先 author_uid，
        # 否则作者名——确保同一作者(如汪子熙 uid=i042416)经 harvest 与 clip 解析到同一 author_id，不拆行。
        uid = author_uid or author or title
        author_id = "a_" + _sid(platform.lower(), str(uid))
        # author upsert
        if author:
            if con.execute("SELECT 1 FROM authors WHERE id=?", (author_id,)).fetchone():
                con.execute("UPDATE authors SET doc_count=COALESCE(doc_count,0)+1, updated_at=? WHERE id=?",
                            (_now(), author_id))
            else:
                con.execute("INSERT INTO authors (id,name,platform,platform_uid,doc_count,created_at,updated_at) "
                            "VALUES (?,?,?,?,1,?,?)", (author_id, author, platform.lower(), str(uid), _now(), _now()))

        summary = content.strip().replace("\n", " ")[:280]
        con.execute(
            "INSERT OR IGNORE INTO documents (id,title,source_platform,source_url,author_id,imported_at,"
            "import_mode,rights_status,content_status,confidence_tier,summary,created_at,updated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (doc_id, title, platform, url, author_id if author else None, _today(),
             import_mode, rights, "fulltext_saved", "reference", summary, _now(), _now()),
        )
        # 全文落 document_contents（独立文件，便于 RAG 分块/重建）
        ft_dir = pathlib.Path(db_path).parent / "fulltext"
        ft_dir.mkdir(parents=True, exist_ok=True)
        ft_path = ft_dir / (doc_id + ".md")
        ft_path.write_text(content, encoding="utf-8")
        text_hash = hashlib.sha1(content.encode("utf-8")).hexdigest()[:24]
        con.execute(
            "INSERT OR REPLACE INTO document_contents (document_id,raw_path,markdown_path,text_hash,token_count) "
            "VALUES (?,?,?,?,?)", (doc_id, str(ft_path), str(ft_path), text_hash, len(content)))

        # FTS：标题+摘要可检索；body 这里是你授权的自用全文，可入 FTS
        con.execute("INSERT OR REPLACE INTO documents_fts (document_id,title,summary,body) VALUES (?,?,?,?)",
                    (doc_id, title, summary, content))

        # 标签
        tags = tag_keyword.tag(title, summary)
        for t in tags:
            con.execute("INSERT OR IGNORE INTO document_tags (id,document_id,tag_type,tag_value,confidence,generated_by,created_at) "
                        "VALUES (?,?,?,?,?,?,?)",
                        ("t_" + _sid(doc_id, t["tag_type"], t["tag_value"]), doc_id, t["tag_type"],
                         t["tag_value"], t.get("confidence"), t.get("generated_by"), _now()))

        # license 登记
        if license_info:
            lic_id = "lic_" + _sid(doc_id, license_info.get("license_type", "purchase"))
            con.execute(
                "INSERT OR REPLACE INTO licenses (id,document_id,license_type,licensor,scope,evidence_path,"
                "purchased_at,expires_at,amount,verified_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (lic_id, doc_id, license_info.get("license_type", "purchase"), license_info.get("licensor"),
                 license_info.get("scope", "individual"), os.path.expanduser(license_info["evidence_path"]),
                 license_info.get("purchased_at"), license_info.get("expires_at"),
                 license_info.get("amount"), "Ryan", _now()))

        # 写 inbox（带全文，因为 rights 允许）
        doc_row = {"id": doc_id, "title": title, "source_url": url, "source_platform": platform,
                   "author": author, "summary": summary, "body": content,
                   "rights_status": rights, "import_mode": import_mode,
                   "confidence_tier": "reference", "imported_at": _today()}
        obs = write_inbox.write(doc_row, vault_root, tags)
        con.execute("UPDATE documents SET obsidian_path=? WHERE id=?", (obs, doc_id))
        # 审计留痕（FinalReview L2）：人工导入/授权登记属敏感动作，记 audit_logs 便于追溯
        import json as _json
        con.execute(
            "INSERT INTO audit_logs (id,target_type,target_id,audit_type,status,risk_level,findings_json,created_by,created_at) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            ("au_clip_" + _sid(doc_id), "document", doc_id, "clip_import", "imported",
             "low", _json.dumps({"rights": rights, "license": bool(license_info),
                                 "chars": len(content)}, ensure_ascii=False), "Ryan(manual)", _now()))
        con.commit()
        return {"status": "imported", "doc_id": doc_id, "rights_status": rights,
                "fulltext_chars": len(content), "license": bool(license_info),
                "obsidian_path": obs, "tags": len(tags)}
    finally:
        con.close()
