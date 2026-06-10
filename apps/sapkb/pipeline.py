# IMPLEMENTATION OWNED BY LEAD (Cowork)
"""SAPKB 管线编排（Cowork-Lead 实现）

闭环：harvest(元数据) → compliance_gate → dedup(复用 collect) → 入 SQLite documents
      → documents_fts → tag_keyword → upsert authors → write_inbox(SAP_EXTKB) → 回写 obsidian_path

铁律：只存元数据+摘要+链接（不碰全文）；幂等（重复 harvest 不重复入库）；
转载归并 canonical_document_id；外部采集恒 confidence_tier=reference；绝不写 SAP_FUZHKB。
"""
from __future__ import annotations

import datetime
import hashlib
import os
import pathlib
import sqlite3
import sys
from typing import Any, Dict, List, Optional

_HERE = pathlib.Path(__file__).resolve().parent
for _p in (str(_HERE), str(_HERE / "ingest"), str(_HERE / "process"), str(_HERE / "obsidian_sync")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from ingest import harvest  # type: ignore
from ingest import compliance_gate  # type: ignore
from process import dedup  # type: ignore
from process import dedup_stage2  # type: ignore
from process import tag_keyword  # type: ignore
from process import classifier  # type: ignore
from obsidian_sync import write_inbox  # type: ignore
from obsidian_sync import mirror  # type: ignore
from process import watchlist  # type: ignore

_DEFAULT_FIXTURES = str(_HERE / "tests" / "fixtures")
_DEFAULT_VAULT = os.path.expanduser("~/sap-hub/vaults/SAP_EXTKB")


def _now() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _today() -> str:
    return datetime.date.today().isoformat()


def _sid(*parts: str) -> str:
    return hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:16]


def _connect(db_path: str) -> sqlite3.Connection:
    con = sqlite3.connect(db_path)
    con.execute("PRAGMA foreign_keys = ON;")
    return con


def _upsert_author(con, record: Dict[str, Any]) -> Optional[str]:
    name = record.get("author")
    if not name:
        return None
    platform = (record.get("source_platform") or "").lower()
    uid = record.get("author_uid") or name
    author_id = "a_" + _sid(platform, str(uid))
    row = con.execute("SELECT id FROM authors WHERE id=?", (author_id,)).fetchone()
    if row:
        con.execute(
            "UPDATE authors SET doc_count = COALESCE(doc_count,0)+1, updated_at=? WHERE id=?",
            (_now(), author_id),
        )
    else:
        con.execute(
            "INSERT INTO authors (id,name,platform,platform_uid,homepage_url,doc_count,created_at,updated_at) "
            "VALUES (?,?,?,?,?,1,?,?)",
            (author_id, name, platform, str(uid), record.get("author_homepage"), _now(), _now()),
        )
    return author_id


def _upsert_columns(con, doc_id: str, author_id: Optional[str], platform: str,
                    columns_meta: Any) -> None:
    """把记录的 columns[{name,seq,source_url}] 写 columns 表 + column_items（保篇序）。"""
    if not isinstance(columns_meta, list):
        return
    for cm in columns_meta:
        if not isinstance(cm, dict) or not cm.get("name"):
            continue
        name = cm["name"]
        seq = cm.get("seq")
        col_src = cm.get("source_url")
        col_id = "c_" + _sid(platform, col_src or name, author_id or "")
        row = con.execute("SELECT id FROM columns WHERE id=?", (col_id,)).fetchone()
        if not row:
            con.execute(
                "INSERT INTO columns (id,author_id,title,platform,source_url,item_count,mirror_status,created_at,updated_at) "
                "VALUES (?,?,?,?,?,0,'none',?,?)",
                (col_id, author_id, name, platform, col_src, _now(), _now()),
            )
        con.execute(
            "INSERT OR IGNORE INTO column_items (column_id,document_id,seq_in_column) VALUES (?,?,?)",
            (col_id, doc_id, seq),
        )
        cnt = con.execute("SELECT COUNT(*) FROM column_items WHERE column_id=?", (col_id,)).fetchone()[0]
        con.execute("UPDATE columns SET item_count=?, updated_at=? WHERE id=?", (cnt, _now(), col_id))


def _log_audit(con, target_type: str, target_id: str, audit: Dict[str, Any]) -> None:
    import json
    con.execute(
        "INSERT INTO audit_logs (id,target_type,target_id,audit_type,status,risk_level,findings_json,created_by,created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (
            "au_" + _sid(target_type, target_id, audit.get("audit_type", ""), _now()),
            target_type, target_id, audit.get("audit_type", ""), audit.get("status", ""),
            audit.get("risk_level"), json.dumps(audit.get("findings_json"), ensure_ascii=False),
            "compliance_gate", _now(),
        ),
    )


def run_harvest(source: str, db_path: str, vault_root: str = _DEFAULT_VAULT,
                fixtures_dir: str = _DEFAULT_FIXTURES) -> Dict[str, Any]:
    con = _connect(db_path)
    stats = {"source": source, "seen": 0, "inserted": 0, "duplicate": 0,
             "blocked": 0, "reposts_merged": 0, "errors": 0}
    source_cfg: Dict[str, Any] = {}
    try:
        try:
            records = list(harvest.harvest_source(source, fixtures_dir))
        except Exception as src_exc:
            # W-LOW-3：源级抓取失败（网络/超时/未配置）记 audit 后优雅返回，不崩整轮。
            stats["errors"] += 1
            stats["source_error"] = str(src_exc)
            _log_audit(con, "source", source,
                       {"audit_type": "harvest_source_error", "status": "error",
                        "risk_level": "medium", "findings_json": {"error": str(src_exc)}})
            con.commit()
            return stats
        for rec in records:
            stats["seen"] += 1
            try:
                # 1) 合规门禁
                gate = compliance_gate.evaluate(rec, source_cfg)
                if gate["blocked"]:
                    _log_audit(con, "document", rec.get("source_url") or "?", gate["audit"])
                    stats["blocked"] += 1
                    continue
                if gate.get("needs_license"):
                    # 付费墙：元数据仍入库，但记“待付费提醒”，让 Ryan 决定是否付费解锁全文
                    _log_audit(con, "document", rec.get("source_url") or "?", gate["audit"])
                    stats["needs_payment"] = stats.get("needs_payment", 0) + 1
                # 2) 去重（复用 collect）
                dup_type, canonical_id = dedup.find_duplicate(con, rec)
                if dup_type == "url":
                    stats["duplicate"] += 1
                    continue  # 幂等：同一文章重复 harvest，不重复入库
                # 3) 入 documents（仅元数据，不碰全文）
                doc_id = "d_" + _sid(rec.get("source_url") or rec.get("title") or _now())
                is_repost = dup_type == "title"
                author_id = _upsert_author(con, rec)
                try:
                    # W1 修复：用真插 + 捕 IntegrityError，杜绝 OR IGNORE 静默 no-op 造成
                    # 「有 FTS/tag/inbox 却无 documents 行」的孤儿。
                    con.execute(
                        "INSERT INTO documents "
                        "(id,title,source_platform,source_url,author_id,published_at,imported_at,"
                        " import_mode,rights_status,content_status,confidence_tier,canonical_document_id,"
                        " summary,language,created_at,updated_at) "
                        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (
                            doc_id, rec.get("title"), rec.get("source_platform"), rec.get("source_url"),
                            author_id, rec.get("published_at"), _today(),
                            gate["import_mode"], gate["rights_status"], "metadata_saved",
                            gate["confidence_tier"], canonical_id if is_repost else None,
                            rec.get("summary"), rec.get("language"), _now(), _now(),
                        ),
                    )
                except sqlite3.IntegrityError as ie:
                    stats["duplicate"] += 1
                    _log_audit(con, "document", rec.get("source_url") or "?",
                               {"audit_type": "insert_conflict", "status": "skipped",
                                "risk_level": "low", "findings_json": {"error": str(ie)}})
                    continue
                if is_repost:
                    # 转载：仅记录（链 canonical）+ 累加热度信号，不重复写 FTS/标签/inbox，
                    # 避免在待 triage 的 inbox 里堆近重复笔记（去重的意义）。
                    # W5 修复：按真实平台判定 same_platform，避免污染 R12 platform_count。
                    canon_plat = con.execute(
                        "SELECT source_platform FROM documents WHERE id=?", (canonical_id,)
                    ).fetchone()
                    same_platform = bool(canon_plat) and (
                        (canon_plat[0] or "").lower() == (rec.get("source_platform") or "").lower()
                    )
                    dedup.register_repost(con, canonical_id, same_platform=same_platform)
                    con.execute(
                        "UPDATE documents SET content_status='metadata_saved', obsidian_path="
                        "(SELECT obsidian_path FROM documents WHERE id=?) WHERE id=?",
                        (canonical_id, doc_id),
                    )
                    stats["reposts_merged"] += 1
                    stats["inserted"] += 1
                    continue
                # 4) FTS（body 恒空——绝不存全文）
                con.execute(
                    "INSERT INTO documents_fts (document_id,title,summary,body) VALUES (?,?,?,?)",
                    (doc_id, rec.get("title") or "", rec.get("summary") or "", ""),
                )
                # 5) 标签 + 主分类（Run06：每篇定 category + content_type）
                tags = classifier.classify(rec.get("title") or "", rec.get("summary"),
                                           rec.get("source_platform"))["tags"]
                for t in tags:
                    con.execute(
                        "INSERT OR IGNORE INTO document_tags "
                        "(id,document_id,tag_type,tag_value,confidence,generated_by,created_at) "
                        "VALUES (?,?,?,?,?,?,?)",
                        ("t_" + _sid(doc_id, t["tag_type"], t["tag_value"]), doc_id,
                         t["tag_type"], t["tag_value"], t.get("confidence"), t.get("generated_by"), _now()),
                    )
                # 5b) 专栏关系（需求8）
                if rec.get("columns"):
                    _upsert_columns(con, doc_id, author_id, rec.get("source_platform") or "", rec["columns"])
                # 6) 写 inbox + 回写 obsidian_path
                doc_row = dict(rec)
                doc_row.update({"id": doc_id, "rights_status": gate["rights_status"],
                                "confidence_tier": gate["confidence_tier"],
                                "import_mode": gate["import_mode"], "imported_at": _today()})
                obs_path = write_inbox.write(doc_row, vault_root, tags)
                con.execute("UPDATE documents SET obsidian_path=? WHERE id=?", (obs_path, doc_id))
                stats["inserted"] += 1
            except Exception as exc:  # 单条失败不拖垮整轮
                stats["errors"] += 1
                _log_audit(con, "document", rec.get("source_url") or "?",
                           {"audit_type": "pipeline_error", "status": "error",
                            "risk_level": "medium", "findings_json": {"error": str(exc)}})
        con.commit()
    finally:
        con.close()
    return stats


def run_search(query: str, db_path: str, limit: int = 20) -> List[Dict[str, Any]]:
    con = _connect(db_path)
    con.row_factory = sqlite3.Row
    q = (query or "").strip()
    rows = []
    try:
        # 结构化短词（tcode/table，如 F110）优先走 document_tags 精确
        tag_hits = con.execute(
            "SELECT d.id,d.title,d.source_url,d.author_id FROM document_tags g "
            "JOIN documents d ON d.id=g.document_id "
            "WHERE g.tag_value = ? COLLATE NOCASE GROUP BY d.id LIMIT ?",
            (q, limit),
        ).fetchall()
        ids = set()
        for r in tag_hits:
            ids.add(r["id"]); rows.append(r)
        if len(rows) < limit:
            # trigram：>=3 codepoint 用 MATCH，1-2 用 LIKE（schema.sql 注释规约）
            remaining = limit - len(rows)
            fts = []
            if len(q) >= 3:
                try:
                    fts = con.execute(
                        "SELECT d.id,d.title,d.source_url,d.author_id FROM documents_fts f "
                        "JOIN documents d ON d.id=f.document_id "
                        "WHERE documents_fts MATCH ? LIMIT ?",
                        (q, remaining + len(ids)),
                    ).fetchall()
                except sqlite3.OperationalError:
                    # W2 修复：查询含 FTS5 操作符语法（" * AND 列过滤等）会抛错，回退 LIKE。
                    fts = []
            if not fts:  # q<3 直接 LIKE；q>=3 但 MATCH 空/失败也回退 LIKE
                like = "%{}%".format(q)
                fts = con.execute(
                    "SELECT id,title,source_url,author_id FROM documents "
                    "WHERE title LIKE ? OR summary LIKE ? LIMIT ?",
                    (like, like, remaining + len(ids)),
                ).fetchall()
            for r in fts:
                if r["id"] not in ids:
                    ids.add(r["id"]); rows.append(r)
        # 补作者名 + 模块
        out = []
        for r in rows[:limit]:
            author = None
            if r["author_id"]:
                a = con.execute("SELECT name FROM authors WHERE id=?", (r["author_id"],)).fetchone()
                author = a["name"] if a else None
            mods = [x["tag_value"] for x in con.execute(
                "SELECT tag_value FROM document_tags WHERE document_id=? AND tag_type='module'", (r["id"],)
            ).fetchall()]
            out.append({"doc_id": r["id"], "title": r["title"], "source_url": r["source_url"],
                        "author": author, "modules": mods})
        return out
    finally:
        con.close()


def run_dedup_stage2(db_path: str, backend: str = "charngram",
                     threshold: Optional[float] = None) -> Dict[str, Any]:
    """stage2 近重复扫描：对正主两两比相似度，疑似近重复对落 audit_logs 待人工复核。

    auto_merge=false：不自动写 canonical，只产 needs_review 候选 + 标 editorial 备注。
    幂等：同一对的候选 audit_id 由 (a,b) 决定，重复跑不重复堆。
    """
    import json
    con = _connect(db_path)
    try:
        # W-LOW-1：只取正主进比对（转载行已归并，无需再算）。
        docs = [dict(id=r[0], title=r[1], summary=r[2], canonical_document_id=None)
                for r in con.execute(
                    "SELECT id,title,summary FROM documents "
                    "WHERE content_status != 'removed' AND canonical_document_id IS NULL").fetchall()]
        cands = dedup_stage2.find_near_duplicates(docs, backend=backend, threshold=threshold)
        for c in cands:
            aid = "au_s2_" + _sid(c["a"], c["b"])
            exists = con.execute("SELECT 1 FROM audit_logs WHERE id=?", (aid,)).fetchone()
            if exists:
                continue
            con.execute(
                "INSERT INTO audit_logs (id,target_type,target_id,audit_type,status,risk_level,findings_json,created_by,created_at) "
                "VALUES (?,?,?,?,?,?,?,?,?)",
                (aid, "document", c["a"], "dedup_stage2_candidate", "needs_review", "medium",
                 json.dumps(c, ensure_ascii=False), "dedup_stage2:" + backend, _now()),
            )
        con.commit()
        return {"backend": backend, "threshold": cands[0]["threshold"] if cands else
                dedup_stage2.DEFAULT_THRESHOLDS.get(backend), "primaries": len(
                    [d for d in docs if not d["canonical_document_id"]]),
                "candidates": len(cands), "pairs": cands[:50]}
    finally:
        con.close()


def _load_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    import yaml
    p = config_path or os.path.expanduser("~/sap-hub/configs/sapkb/acquisition_sources.yaml")
    try:
        with open(p, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except Exception:
        return {}


def run_mirror(db_path: str, vault_root: str = _DEFAULT_VAULT,
               author_threshold: int = 5, column_threshold: int = 3) -> Dict[str, Any]:
    return mirror.run_mirror(db_path, vault_root, author_threshold, column_threshold)


def run_watch(db_path: str, author_threshold: int = 5, column_threshold: int = 3,
              config_path: Optional[str] = None) -> Dict[str, Any]:
    con = _connect(db_path)
    try:
        enabled = watchlist.enable_watch_on_threshold(con, author_threshold, column_threshold)
        cfg = _load_config(config_path)
        prio = (cfg.get("watchlist_priority") or {}).get("authors") or []
        prio_names = []
        for a in prio:
            if isinstance(a, dict):
                if a.get("name"):
                    prio_names.append(a["name"])
                prio_names.extend(a.get("aka") or [])  # 别名(如 Jerry Wang)也纳入匹配
            elif a:
                prio_names.append(a)
        prio_hit = watchlist.apply_priority(con, [n for n in prio_names if n])
        scan = watchlist.run_watch_scan(con)
        con.commit()
        scan["auto_enabled"] = enabled
        scan["priority_authors_hit"] = prio_hit
        scan["priority_authors_configured"] = prio_names
        return scan
    finally:
        con.close()


def regen_inbox(db_path: str, vault_root: str = _DEFAULT_VAULT) -> Dict[str, Any]:
    """按 DB 当前标签重写所有文档的 inbox md（补齐 category/content_type frontmatter，Run07）。
    转载行跳过（无独立 inbox）。"""
    con = _connect(db_path)
    con.row_factory = sqlite3.Row
    stats = {"rewritten": 0, "skipped": 0}
    try:
        docs = con.execute(
            "SELECT id,title,source_url,source_platform,summary,rights_status,import_mode,"
            "confidence_tier,imported_at,author_id FROM documents "
            "WHERE canonical_document_id IS NULL AND content_status!='removed'").fetchall()
        for d in docs:
            tags = [dict(r) for r in con.execute(
                "SELECT tag_type,tag_value FROM document_tags WHERE document_id=?", (d["id"],)).fetchall()]
            author = None
            if d["author_id"]:
                a = con.execute("SELECT name FROM authors WHERE id=?", (d["author_id"],)).fetchone()
                author = a["name"] if a else None
            body = None
            if d["rights_status"] in ("user_imported", "license_purchased", "own_content", "fulltext_allowed"):
                fc = con.execute("SELECT markdown_path FROM document_contents WHERE document_id=?", (d["id"],)).fetchone()
                if fc and fc[0] and os.path.exists(fc[0]):
                    try:
                        body = open(fc[0], "r", encoding="utf-8").read()
                    except Exception:
                        body = None
            doc_row = {"id": d["id"], "title": d["title"], "source_url": d["source_url"],
                       "source_platform": d["source_platform"], "author": author, "summary": d["summary"],
                       "rights_status": d["rights_status"], "import_mode": d["import_mode"],
                       "confidence_tier": d["confidence_tier"], "imported_at": d["imported_at"]}
            if body:
                doc_row["body"] = body
            obs = write_inbox.write(doc_row, vault_root, tags)
            con.execute("UPDATE documents SET obsidian_path=? WHERE id=?", (obs, d["id"]))
            stats["rewritten"] += 1
        con.commit()
        return stats
    finally:
        con.close()


def payment_reminders(db_path: str) -> List[Dict[str, Any]]:
    """列出待付费解锁全文的条目（compliance 标 needs_payment），供提醒 Ryan 去付费。"""
    import json
    con = _connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        rows = con.execute(
            "SELECT a.target_id, a.findings_json, a.created_at, d.title, d.author_id "
            "FROM audit_logs a LEFT JOIN documents d ON d.source_url=a.target_id "
            "WHERE a.status='needs_payment' ORDER BY a.created_at DESC"
        ).fetchall()
        out = []
        for r in rows:
            try:
                f = json.loads(r["findings_json"]) if r["findings_json"] else {}
            except Exception:
                f = {}
            out.append({"source_url": r["target_id"], "title": r["title"],
                        "paywall_signals": f.get("paywall_signals"), "flagged_at": r["created_at"]})
        return out
    finally:
        con.close()
