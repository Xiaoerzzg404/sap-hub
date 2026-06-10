"""SAPKB watchlist 持续追更（Cowork-Worker，Run03，R11）

机制：
- 达镜像阈值的作者/专栏自动 watch_enabled（watch.auto_enable_on_mirror）。
- 作者：维护 last_checked_at / last_new_item_at；自适应频率——连续 N 轮无新文 → 间隔 ×factor（上限 14 天），
  有新文则复位默认间隔。无新轮次计数存 authors.notes 的 JSON（避免改 schema）。
- 专栏：维护 last_seen_published_at 水位线（= 已收文章最大 published_at），下次只取此后新文。
- 优先作者（如 汪子熙/Jerry Wang）：从 config watchlist_priority 读，命中即强制 watch_enabled 并打高优先标记。

注意：真正的“取新文”需源可达（CSDN 需本机 RSSHub）。本模块负责【水位线与调度状态机】，
源就绪后由 harvest 按水位线增量取；源不可达时只推进调度状态、如实不产新数据。
"""
from __future__ import annotations

import json
import sqlite3
from typing import Any, Dict, List, Optional

DEFAULT_INTERVAL_DAYS = 3
NO_NEW_ROUNDS_TO_BACKOFF = 3
BACKOFF_MULTIPLY = 2
MAX_INTERVAL_DAYS = 14


def _now() -> str:
    import datetime
    return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _load_notes(raw: Optional[str]) -> Dict[str, Any]:
    if not raw:
        return {}
    try:
        d = json.loads(raw)
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def enable_watch_on_threshold(con, author_threshold: int = 5, column_threshold: int = 3) -> Dict[str, int]:
    a = con.execute(
        "UPDATE authors SET watch_enabled=1, watch_interval_days=COALESCE(NULLIF(watch_interval_days,0),?) "
        "WHERE id IN (SELECT a.id FROM authors a JOIN documents d ON d.author_id=a.id "
        "WHERE d.content_status!='removed' GROUP BY a.id HAVING COUNT(d.id) >= ?) AND watch_enabled=0",
        (DEFAULT_INTERVAL_DAYS, author_threshold),
    ).rowcount
    c = con.execute(
        "UPDATE columns SET watch_enabled=1, watch_interval_days=COALESCE(NULLIF(watch_interval_days,0),?) "
        "WHERE item_count >= ? AND watch_enabled=0",
        (DEFAULT_INTERVAL_DAYS, column_threshold),
    ).rowcount
    return {"authors_enabled": a, "columns_enabled": c}


def apply_priority(con, priority_authors: List[str]) -> List[str]:
    """把优先作者强制 watch_enabled + 标高优先（manual_rating=5），返回实际命中的作者名。"""
    hit = []
    for name in priority_authors or []:
        # 精确匹配 name 或 platform_uid（避免短名子串误命中无关作者）
        rows = con.execute("SELECT id FROM authors WHERE name=? OR platform_uid=?",
                           (name, name)).fetchall()
        for r in rows:
            con.execute(
                "UPDATE authors SET watch_enabled=1, manual_rating=COALESCE(manual_rating,5), "
                "watch_interval_days=COALESCE(NULLIF(watch_interval_days,0),?), updated_at=? WHERE id=?",
                (DEFAULT_INTERVAL_DAYS, _now(), r[0]),
            )
            hit.append(name)
    return hit


def run_watch_scan(con) -> Dict[str, Any]:
    """对 watch_enabled 的作者/专栏推进一轮调度状态机。"""
    now = _now()
    author_summary = []
    for r in con.execute(
        "SELECT id,name,last_new_item_at,watch_interval_days,notes FROM authors WHERE watch_enabled=1"
    ).fetchall():
        aid, name, last_new, interval, notes_raw = r[0], r[1], r[2], r[3] or DEFAULT_INTERVAL_DAYS, r[4]
        notes = _load_notes(notes_raw)
        max_pub = con.execute(
            "SELECT MAX(published_at) FROM documents WHERE author_id=? AND content_status!='removed'", (aid,)
        ).fetchone()[0]
        has_new = bool(max_pub) and (not last_new or max_pub > last_new)
        if has_new:
            notes["no_new_rounds"] = 0
            interval = DEFAULT_INTERVAL_DAYS
            last_new = max_pub
        else:
            notes["no_new_rounds"] = int(notes.get("no_new_rounds", 0)) + 1
            if notes["no_new_rounds"] >= NO_NEW_ROUNDS_TO_BACKOFF:
                interval = min(interval * BACKOFF_MULTIPLY, MAX_INTERVAL_DAYS)
        con.execute(
            "UPDATE authors SET last_checked_at=?, last_new_item_at=?, watch_interval_days=?, notes=?, updated_at=? WHERE id=?",
            (now, last_new, interval, json.dumps(notes, ensure_ascii=False), now, aid),
        )
        author_summary.append({"author": name, "has_new": has_new, "interval_days": interval,
                               "no_new_rounds": notes["no_new_rounds"], "watermark": last_new})

    column_summary = []
    for r in con.execute(
        "SELECT id,title,last_seen_published_at,watch_interval_days FROM columns WHERE watch_enabled=1"
    ).fetchall():
        cid, title, last_seen, interval = r[0], r[1], r[2], r[3] or DEFAULT_INTERVAL_DAYS
        max_pub = con.execute(
            "SELECT MAX(d.published_at) FROM column_items ci JOIN documents d ON d.id=ci.document_id "
            "WHERE ci.column_id=? AND d.content_status!='removed'", (cid,)
        ).fetchone()[0]
        advanced = bool(max_pub) and (not last_seen or max_pub > last_seen)
        new_watermark = max_pub if advanced else last_seen
        con.execute("UPDATE columns SET last_checked_at=?, last_seen_published_at=?, updated_at=? WHERE id=?",
                    (now, new_watermark, now, cid))
        column_summary.append({"column": title, "advanced": advanced, "watermark": new_watermark,
                               "interval_days": interval})

    return {"checked_at": now, "authors": author_summary, "columns": column_summary,
            "authors_watched": len(author_summary), "columns_watched": len(column_summary)}
