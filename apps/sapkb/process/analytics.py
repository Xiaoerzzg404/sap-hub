"""SAPKB 内容情报（Cowork-Worker，Run09）：热度评分 + 趋势雷达 + 选题 shortlist。

把 1457 篇采集库变成可操作的【选题情报】，服务公众号/视频号内容生产（不发布、只产候选）。
- R12 popularity_score：按 routing_policy 权重算每篇热度，缓存回 documents。
- R14 趋势：按季度聚合 category/module/csdn_tag 计数 + 环比 → trend_snapshots；taxonomy 外高频新词 → term_candidates。
- 选题 shortlist：按 热度 + 新近 + SAP AI 优先 排候选，分类分组。
不编造：全部基于库内真实文档/标签/日期统计。
"""
from __future__ import annotations

import datetime
import hashlib
import math
import sqlite3
from typing import Any, Dict, List, Optional

# routing_policy popularity.weights
W = {"manual_rating": 3, "log_repost": 2, "platform_count": 1, "author_rating": 1, "distill_refs": 2}


def _now() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _sid(*p: str) -> str:
    return hashlib.sha1("|".join(x or "" for x in p).encode("utf-8")).hexdigest()[:16]


def _prev_quarter(q: str) -> str:
    y = int(q[:4]); qq = int(q[-1])
    return "{}-Q4".format(y - 1) if qq == 1 else "{}-Q{}".format(y, qq - 1)


def _quarter(date_str: Optional[str]) -> Optional[str]:
    if not date_str:
        return None
    try:
        y = int(date_str[:4]); mo = int(date_str[5:7])
        return "{}-Q{}".format(y, (mo - 1) // 3 + 1)
    except Exception:
        return None


def recompute_popularity(db_path: str) -> Dict[str, Any]:
    con = sqlite3.connect(db_path)
    try:
        rows = con.execute(
            "SELECT d.id, COALESCE(d.manual_rating,0), COALESCE(d.repost_count,0), "
            "COALESCE(d.platform_count,1), COALESCE(a.manual_rating,0), "
            "(SELECT COUNT(*) FROM insight_sources s WHERE s.document_id=d.id) "
            "FROM documents d LEFT JOIN authors a ON a.id=d.author_id "
            "WHERE d.content_status!='removed'").fetchall()
        n = 0
        for did, mr, rp, pc, ar, dr in rows:
            score = (W["manual_rating"] * mr + W["log_repost"] * math.log(1 + rp)
                     + W["platform_count"] * pc + W["author_rating"] * ar + W["distill_refs"] * dr)
            con.execute("UPDATE documents SET popularity_score=? WHERE id=?", (round(score, 4), did))
            n += 1
        con.commit()
        top = con.execute(
            "SELECT d.title, a.name, d.popularity_score FROM documents d LEFT JOIN authors a ON a.id=d.author_id "
            "WHERE d.content_status!='removed' ORDER BY d.popularity_score DESC LIMIT 8").fetchall()
        return {"scored": n, "top": [{"title": t[0][:40], "author": t[1], "score": t[2]} for t in top]}
    finally:
        con.close()


def build_trend_snapshot(db_path: str, tag_types=("category", "module", "sap_ai", "csdn_tag"),
                         top: int = 15) -> Dict[str, Any]:
    con = sqlite3.connect(db_path)
    try:
        # 以当前季度为 period；delta 与上一季度比
        cur_q = _quarter(datetime.date.today().isoformat())
        # 按 (period, tag) 统计：用文档 published_at 的季度
        counts: Dict[tuple, int] = {}
        rows = con.execute(
            "SELECT t.tag_type, t.tag_value, d.published_at FROM document_tags t "
            "JOIN documents d ON d.id=t.document_id "
            "WHERE t.tag_type IN ({}) AND d.content_status!='removed'".format(
                ",".join("'" + x + "'" for x in tag_types))).fetchall()
        for tt, tv, pub in rows:
            q = _quarter(pub) or cur_q
            counts[(q, tt, tv)] = counts.get((q, tt, tv), 0) + 1
        # 写 trend_snapshots（含环比）
        written = 0
        for (q, tt, tv), c in counts.items():
            # 环比：与【真正的上一自然季】比（FinalReview P3），无上季数据则 delta=None
            prev = counts.get((_prev_quarter(q), tt, tv)) if q else None
            delta = None if not prev else round((c - prev) * 100.0 / prev, 1)
            con.execute(
                "INSERT OR REPLACE INTO trend_snapshots (id,period,tag_type,tag_value,doc_count,delta_pct,created_at) "
                "VALUES (?,?,?,?,?,?,?)", (_sid(q, tt, tv), q, tt, tv, c, delta, _now()))
            written += 1
        con.commit()
        # 当前季度热点
        hot = con.execute(
            "SELECT tag_type,tag_value,doc_count,delta_pct FROM trend_snapshots WHERE period=? "
            "ORDER BY doc_count DESC LIMIT ?", (cur_q, top)).fetchall()
        return {"period": cur_q, "snapshots_written": written,
                "hot": [{"type": h[0], "tag": h[1], "count": h[2], "delta_pct": h[3]} for h in hot]}
    finally:
        con.close()


def detect_term_candidates(db_path: str, taxonomy_path: Optional[str] = None,
                           min_freq: int = 5, window_days: int = 9999) -> Dict[str, Any]:
    import yaml
    import os
    tpath = taxonomy_path or os.path.expanduser("~/sap-hub/configs/sapkb/sapkb_taxonomy.yaml")
    tax = yaml.safe_load(open(tpath, encoding="utf-8")) or {}
    known = set()

    def _add(*vals):
        for v in vals:
            if v:
                known.add(str(v).lower())

    for mod, m in (tax.get("modules") or {}).items():
        _add(mod)
        for nm in (m.get("names") or []):
            _add(nm)
        for tc in (m.get("tcodes") or []):  # FinalReview P1：tcode/table 也算已知词
            _add(tc)
        for tb in (m.get("tables") or []):
            _add(tb)
        for proc, p in (m.get("processes") or {}).items():
            for nm in (p.get("names") or []):
                _add(nm)
            for tc in (p.get("tcodes") or []):
                _add(tc)
            for tb in (p.get("tables") or []):
                _add(tb)
    for grp, terms in (tax.get("SAP_AI") or {}).items():
        for t in (terms or []):
            _add(t)
    for ct in (tax.get("cross_topics") or []):  # FinalReview P1：cross_topics + aliases
        _add(ct.get("name"))
        for al in (ct.get("aliases") or []):
            _add(al)
    con = sqlite3.connect(db_path)
    try:
        rows = con.execute(
            "SELECT tag_value, COUNT(*) c FROM document_tags WHERE tag_type='csdn_tag' "
            "GROUP BY tag_value HAVING c>=? ORDER BY c DESC", (min_freq,)).fetchall()
        added, cands = 0, []
        for tv, c in rows:
            if tv.lower() in known:
                continue
            con.execute(
                "INSERT OR IGNORE INTO term_candidates (id,term,first_seen,freq_30d,status,created_at) "
                "VALUES (?,?,?,?,?,?)", (_sid("term", tv), tv, _now(), c, "pending", _now()))
            con.execute("UPDATE term_candidates SET freq_30d=? WHERE term=?", (c, tv))
            added += 1
            cands.append({"term": tv, "freq": c})
        con.commit()
        return {"candidates": added, "top": cands[:20]}
    finally:
        con.close()


def source_health(db_path: str, broken_rounds: int = 2) -> Dict[str, Any]:
    """读 data/source_health.jsonl，按源给健康判定（Run15）：
    - broken：最近 broken_rounds 轮 seen 全为 0（可能 404/源失效/反爬）——需关注。
    - exhausted：近轮 seen>0 但 inserted 长期为 0（源没新文，正常）。
    - healthy：近轮有 new。
    """
    import json
    import os as _os
    path = _os.path.join(_os.path.dirname(db_path), "source_health.jsonl")
    runs: Dict[str, List[Dict[str, Any]]] = {}
    if _os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            runs.setdefault(r.get("source") or "?", []).append(r)
    out = []
    for src, rs in runs.items():
        rs = rs[-10:]  # 看最近 10 轮
        last = rs[-1]
        recent = rs[-broken_rounds:]
        zero_seen = all((x.get("seen", 0) == 0) for x in recent) and len(recent) >= broken_rounds
        has_new = any(x.get("inserted", 0) > 0 for x in rs[-3:])
        if zero_seen:
            state = "broken"
        elif last.get("seen", 0) > 0 and not has_new:
            state = "exhausted"
        else:
            state = "healthy"
        out.append({"source": src, "state": state, "last_seen": last.get("seen", 0),
                    "last_new": last.get("inserted", 0), "last_date": last.get("date"),
                    "last_error": last.get("source_error"), "runs_tracked": len(rs)})
    out.sort(key=lambda x: {"broken": 0, "exhausted": 1, "healthy": 2}[x["state"]])
    broken = [x["source"] for x in out if x["state"] == "broken"]
    return {"sources": out, "broken": broken, "broken_count": len(broken),
            "total_sources": len(out)}


def system_status(db_path: str) -> Dict[str, Any]:
    """一屏系统健康（只读）：总量 / 全文比 / 平台 / top 作者 / 提炼 / 发布 / 最近采集。"""
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        def one(q, *a):
            r = con.execute(q, a).fetchone()
            return r[0] if r else None
        total = one("SELECT COUNT(*) FROM documents WHERE content_status!='removed'")
        fulltext = one("SELECT COUNT(*) FROM documents WHERE content_status='fulltext_saved'")
        reposts = one("SELECT COUNT(*) FROM documents WHERE canonical_document_id IS NOT NULL")
        platforms = {r[0]: r[1] for r in con.execute(
            "SELECT source_platform, COUNT(*) FROM documents WHERE content_status!='removed' "
            "GROUP BY source_platform ORDER BY 2 DESC").fetchall()}
        top_authors = [{"author": r[0], "docs": r[1]} for r in con.execute(
            "SELECT a.name, COUNT(*) FROM documents d JOIN authors a ON a.id=d.author_id "
            "WHERE d.content_status!='removed' GROUP BY a.id ORDER BY 2 DESC LIMIT 8").fetchall()]
        categories = {r[0]: r[1] for r in con.execute(
            "SELECT tag_value, COUNT(DISTINCT document_id) FROM document_tags WHERE tag_type='category' "
            "GROUP BY tag_value ORDER BY 2 DESC LIMIT 12").fetchall()}
        return {
            "documents_total": total, "fulltext": fulltext, "metadata_only": total - (fulltext or 0),
            "reposts_merged": reposts,
            "authors": one("SELECT COUNT(*) FROM authors"),
            "csdn_tags": one("SELECT COUNT(*) FROM document_tags WHERE tag_type='csdn_tag'"),
            "insights": one("SELECT COUNT(*) FROM insights"),
            "publications": one("SELECT COUNT(*) FROM publications"),
            "watch_enabled_authors": one("SELECT COUNT(*) FROM authors WHERE watch_enabled=1"),
            "last_imported": one("SELECT MAX(imported_at) FROM documents"),
            "platforms": platforms, "top_authors": top_authors, "categories": categories,
        }
    finally:
        con.close()


def build_selection_brief(db_path: str, out_path: str, shortlist_n: int = 12,
                          trend_top: int = 10) -> Dict[str, Any]:
    """汇总 SAPKB 情报为一份【选题简报】md：top 选题 + 趋势热点 + 新词候选 + 最近提炼/学习路径。
    数据全来自本地 SAPKB 真实统计；过程会顺带刷新 SAPKB 自身的 trend/term 快照表（幂等），
    不碰 documents 原始事实、不触碰其它系统/不发布。写一个 md 文件供你/内容生产线消费。
    """
    import os
    today = datetime.date.today().isoformat()
    shortlist = topic_shortlist(db_path, limit=shortlist_n)
    trend = build_trend_snapshot(db_path, top=trend_top)
    terms = detect_term_candidates(db_path)
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        total = con.execute("SELECT COUNT(*) FROM documents WHERE content_status!='removed'").fetchone()[0]
        recent_ins = con.execute(
            "SELECT type,title,status FROM insights ORDER BY created_at DESC LIMIT 8").fetchall()
    finally:
        con.close()

    L = ["# SAPKB 选题简报 · {}".format(today), "",
         "> 自动汇总自本地 SAPKB（{} 篇真实 SAP 文章）。仅供选题，事实须在系统复核。".format(total), "",
         "## 一、今日选题候选（按热度 / SAP AI 优先）", ""]
    for i, x in enumerate(shortlist, 1):
        ai = " 🔹SAP AI" if x["is_sap_ai"] else ""
        kw = ("｜" + "、".join(x["keywords"][:4])) if x.get("keywords") else ""
        L.append("{}. **[{}]** {}（{}）{}{}\n   {}".format(
            i, x["category"], x["title"], x["author"] or "?", ai, kw, x["source_url"]))
    L += ["", "## 二、本季趋势热点（{}）".format(trend["period"]), ""]
    for h in trend["hot"]:
        d = "" if h["delta_pct"] is None else "（环比 {}%）".format(h["delta_pct"])
        L.append("- {}/{} · {} 篇{}".format(h["type"], h["tag"], h["count"], d))
    L += ["", "## 三、待收编新词（taxonomy 外高频）", "",
          "、".join("{}({})".format(c["term"], c["freq"]) for c in terms["top"][:15]) or "（无）"]
    L += ["", "## 四、最近提炼 / 学习路径", ""]
    for r in recent_ins:
        L.append("- [{}] {} · {}".format(r["type"], r["title"], r["status"]))
    L.append("")

    op = os.path.expanduser(out_path)
    if "SAP_FUZHKB" in op:
        raise PermissionError("vault 隔离：禁止写入 SAP_FUZHKB")
    _d = os.path.dirname(op)  # FinalReview P1：空 dirname 不调 makedirs，防裸崩
    if _d:
        os.makedirs(_d, exist_ok=True)
    with open(op, "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    return {"status": "written", "path": op, "date": today, "total_docs": total,
            "shortlist": len(shortlist), "trend_hot": len(trend["hot"]),
            "new_terms": len(terms["top"]), "recent_insights": len(recent_ins)}


def topic_shortlist(db_path: str, category: Optional[str] = None, limit: int = 20,
                    ai_first: bool = True) -> List[Dict[str, Any]]:
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        where = "d.content_status!='removed' AND d.canonical_document_id IS NULL"
        params: List[Any] = []
        if category:
            where += (" AND d.id IN (SELECT document_id FROM document_tags WHERE tag_type='category' "
                      "AND tag_value=?)")
            params.append(category)
        rows = con.execute(
            "SELECT d.id,d.title,d.source_url,d.published_at,COALESCE(d.popularity_score,0) ps,a.name "
            "FROM documents d LEFT JOIN authors a ON a.id=d.author_id WHERE " + where,
            params).fetchall()
        out = []
        for r in rows:
            cat = con.execute("SELECT tag_value FROM document_tags WHERE document_id=? AND tag_type='category' LIMIT 1",
                              (r["id"],)).fetchone()
            ctype = con.execute("SELECT tag_value FROM document_tags WHERE document_id=? AND tag_type='content_type' LIMIT 1",
                                (r["id"],)).fetchone()
            is_ai = con.execute("SELECT 1 FROM document_tags WHERE document_id=? AND tag_type='sap_ai' LIMIT 1",
                                (r["id"],)).fetchone() is not None
            kws = [x[0] for x in con.execute(
                "SELECT tag_value FROM document_tags WHERE document_id=? AND tag_type='csdn_tag' LIMIT 6", (r["id"],)).fetchall()]
            # 选题分 = 热度 + SAP AI 加权 + 新近(年份)
            recency = 0
            try:
                recency = max(0, int((r["published_at"] or "2020")[:4]) - 2020)
            except Exception:
                pass
            score = r["ps"] + (5 if (ai_first and is_ai) else 0) + recency * 0.5
            out.append({"doc_id": r["id"], "title": r["title"], "author": r["name"],
                        "category": cat[0] if cat else None, "content_type": ctype[0] if ctype else None,
                        "is_sap_ai": is_ai, "keywords": kws, "source_url": r["source_url"],
                        "topic_score": round(score, 2)})
        out.sort(key=lambda x: x["topic_score"], reverse=True)
        return out[:limit]
    finally:
        con.close()
