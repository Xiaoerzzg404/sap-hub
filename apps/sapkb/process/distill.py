"""SAPKB 知识提炼 R13（Cowork-Worker，Run10）

把选题卡/源文档提炼成 insight（知识卡/经验条/干货稿/趋势报告/学习路径）。
**版权角色硬隔离（最高优先，防造假 + 守版权）**：
- metadata_only / summary_only 的源 **只能** 当 inspiration（选题启发），**绝不能**当 evidence。
  ——因为我们只有它的元数据/摘要，引用其"事实"=编造。
- evidence（可引事实）只能来自 user_imported / license_purchased / own_content / fulltext_allowed。
- counterpoint = 反方观点，rights 要求同 evidence。
提炼产物一律 Tier2 双审；源文档置 editorial_status='distilled'。不发布（最远到 draft/in_review）。
"""
from __future__ import annotations

import datetime
import hashlib
import json
import re
import sqlite3
from typing import Any, Dict, List, Optional

INSPIRATION_ONLY_RIGHTS = {"metadata_only", "summary_only", "unknown", "blocked"}
EVIDENCE_RIGHTS = {"user_imported", "license_purchased", "own_content", "fulltext_allowed", "derivative", "commercial"}
INSIGHT_TYPES = {"knowledge_card", "experience_note", "growth_article", "trend_report", "learning_path"}
_SLUG_BAD = re.compile(r'[/\\:*?"<>|#^\[\]]+')
_SLUG_SP = re.compile(r"\s+")


def _now() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _sid(*p: str) -> str:
    return hashlib.sha1("|".join(x or "" for x in p).encode("utf-8")).hexdigest()[:16]


def _slug(text: str, n: int = 40) -> str:
    return _SLUG_SP.sub("_", _SLUG_BAD.sub("", text or "untitled").strip())[:n] or "untitled"


def create_insight(db_path: str, vault_root: str, itype: str, title: str,
                   sources: List[Dict[str, str]], body: Optional[str] = None,
                   created_by: str = "Cowork", min_evidence: int = 2) -> Dict[str, Any]:
    """sources: [{doc_id, role}]，role ∈ evidence|inspiration|counterpoint（缺省按源 rights 自动定）。

    返回 {status, insight_id, ...}；角色违规直接 raise ValueError（硬隔离）。
    """
    if itype not in INSIGHT_TYPES:
        raise ValueError("未知 insight type: {}".format(itype))
    # vault 隔离 fail-fast（FinalReview P2）：写库前就拦 FUZHKB
    _root = __import__("pathlib").Path(vault_root).expanduser()
    if "SAP_FUZHKB" in str(_root):
        raise PermissionError("vault 隔离：禁止写入 SAP_FUZHKB")
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        resolved: List[Dict[str, str]] = []
        evidence_n = 0
        for s in sources:
            doc = con.execute("SELECT id,title,rights_status,source_url FROM documents WHERE id=?",
                              (s["doc_id"],)).fetchone()
            if not doc:
                raise ValueError("源文档不存在: {}".format(s["doc_id"]))
            rights = doc["rights_status"]
            role = s.get("role")
            # 自动定角色（正向白名单，FinalReview P1）：仅授权全文 → evidence，其余(含 takedown/unknown) → inspiration
            if not role:
                role = "evidence" if rights in EVIDENCE_RIGHTS else "inspiration"
            # 硬隔离：evidence/counterpoint **只能**来自授权全文(EVIDENCE_RIGHTS)，其余一律拒绝
            if role in ("evidence", "counterpoint") and rights not in EVIDENCE_RIGHTS:
                raise ValueError(
                    "版权/真实性硬隔离违规：源 {} 仅有 {} 权限，只能作 inspiration，不能作 {}（引用其事实=编造）。"
                    "请先用 clip 导入授权全文再作 evidence。".format(doc["title"][:24], rights, role))
            if role == "evidence":
                evidence_n += 1
            resolved.append({"doc_id": doc["id"], "role": role, "title": doc["title"],
                             "url": doc["source_url"], "rights": rights})

        insight_id = "ins_" + _sid(itype, title, _now())
        con.execute(
            "INSERT INTO insights (id,type,title,status,created_by,reviewed_tier,version,created_at,updated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (insight_id, itype, title, "draft", created_by, 2, 1, _now(), _now()))
        for r in resolved:
            con.execute(
                "INSERT OR IGNORE INTO insight_sources (insight_id,document_id,role) VALUES (?,?,?)",
                (insight_id, r["doc_id"], r["role"]))
            con.execute("UPDATE documents SET editorial_status='distilled', updated_at=? WHERE id=?",
                        (_now(), r["doc_id"]))

        # 写 insight md 到 06_insights
        root = _root  # 函数开头已做 FUZHKB fail-fast 校验
        out_dir = root / "06_insights"
        out_dir.mkdir(parents=True, exist_ok=True)
        ev = [r for r in resolved if r["role"] == "evidence"]
        insp = [r for r in resolved if r["role"] == "inspiration"]
        cps = [r for r in resolved if r["role"] == "counterpoint"]
        lines = [
            "---", "insight_id: {}".format(insight_id), "type: {}".format(itype),
            "title: {}".format(title), "status: draft", "reviewed_tier: 2",
            "evidence_sources: {}".format(len(ev)), "inspiration_sources: {}".format(len(insp)),
            "created_by: {}".format(created_by), "created_at: {}".format(_now()), "---", "",
            "# {}".format(title), "",
            "> [!note] 提炼产物 · Tier2 双审 · status=draft（未发布）",
            "> evidence={} / inspiration={} / counterpoint={}".format(len(ev), len(insp), len(cps)), "",
            "## 正文", "",
        ]
        if body:
            lines.append(body)
        elif ev:
            lines.append("（待据 evidence 源撰写；只能引用下方 evidence 列出的已授权全文事实，inspiration 仅供选题角度。）")
        else:
            lines += ["（**选题卡**：本卡暂无授权全文 evidence，仅由 inspiration 源启发，",
                      "不得在此陈述未经核实的具体事实/数字；如需引用事实，先用 clip 导入授权全文作 evidence。）"]
        lines += ["", "## 内容依据与来源"]
        if ev:
            lines.append("**Evidence（已授权可引事实）**")
            for r in ev:
                lines.append("- [{}]({}) · rights={}".format(r["title"], r["url"], r["rights"]))
        lines.append("**Inspiration（仅选题启发，不可引为事实）**")
        for r in insp:
            lines.append("- [{}]({}) · rights={}".format(r["title"], r["url"], r["rights"]))
        for r in cps:
            lines.append("- [counterpoint] [{}]({})".format(r["title"], r["url"]))
        obs_path = "06_insights/" + _slug(title) + "_" + insight_id[-6:] + ".md"
        (root / obs_path[len("06_insights/")+0:]).parent.mkdir(parents=True, exist_ok=True)
        (root / obs_path).write_text("\n".join(lines), encoding="utf-8")
        con.execute("UPDATE insights SET obsidian_path=? WHERE id=?", (obs_path, insight_id))
        con.commit()
        return {"status": "created", "insight_id": insight_id, "type": itype,
                "evidence": len(ev), "inspiration": len(insp), "counterpoint": len(cps),
                "obsidian_path": obs_path,
                "warn": (None if evidence_n >= min_evidence else
                         "evidence 源 {} < {}（min_evidence_sources）：只能作选题卡，不能下事实结论".format(evidence_n, min_evidence))}
    finally:
        con.close()


def draft_insight(db_path: str, vault_root: str, insight_id: str) -> Dict[str, Any]:
    """据该 insight 的 evidence 源【全文】用本机 gemma4 写带引用的草稿；inspiration 仅供角度。
    无 evidence → 不生成事实，只列选题角度。写回 insight md，status draft→in_review。
    """
    import os
    import pathlib
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        ins = con.execute("SELECT * FROM insights WHERE id=?", (insight_id,)).fetchone()
        if not ins:
            raise ValueError("insight 不存在: {}".format(insight_id))
        srcs = con.execute(
            "SELECT s.role, d.title, d.source_url, d.rights_status, dc.markdown_path "
            "FROM insight_sources s JOIN documents d ON d.id=s.document_id "
            "LEFT JOIN document_contents dc ON dc.document_id=d.id WHERE s.insight_id=?",
            (insight_id,)).fetchall()
        evidence, inspiration = [], []
        for s in srcs:
            (evidence if s["role"] == "evidence" else inspiration).append(dict(s))
        # 读 evidence 全文（仅授权全文有 markdown_path）
        ev_ctx = []
        for i, e in enumerate(evidence):
            body = ""
            if e["markdown_path"] and os.path.exists(e["markdown_path"]):
                try:  # FinalReview BUG-4：with 上下文 + 兜 OSError
                    with open(e["markdown_path"], "r", encoding="utf-8") as f:
                        body = f.read()[:4000]
                except OSError:
                    body = ""
            if body:
                ev_ctx.append((i + 1, e["title"], e["source_url"], body))

        if not ev_ctx:
            # 无可用 evidence 全文 → 不编事实，只给选题角度
            draft = ("（**选题角度**，无授权全文 evidence，未生成事实性正文）\n\n可切入角度（据选题启发源）：\n"
                     + "\n".join("- " + (s["title"] or "") for s in inspiration[:8]))
            note = "无 evidence：仅选题角度，不含未核实事实"
        else:
            from kb import rag, embedder
            ctx = "\n\n".join("[{}] {}（{}）\n{}".format(n, t, u, b) for n, t, u, b in ev_ctx)
            angle = "；".join((s["title"] or "") for s in inspiration[:5])
            prompt = (
                "你是 SAP 知识编辑。**只能**根据下面【授权全文资料】写一篇中文知识卡正文，"
                "每个事实论断后用 [n] 标注来源编号；资料没讲的绝不编造。"
                "选题角度参考（仅供切入，不可当事实）：" + angle + "。\n\n"
                "授权全文资料：\n" + ctx + "\n\n标题：" + ins["title"] + "\n\n中文正文（结尾加『以上据授权全文整理，需在系统中复核』）：")
            try:
                draft = rag._generate(prompt) if embedder.available(rag.GEN_MODEL) else None
            except Exception:
                draft = None
            note = "据 {} 条 evidence 全文生成，带引用".format(len(ev_ctx))
            if not draft:
                draft = "（生成模型不可用，未出正文；evidence 源见下方，请人工据其撰写。）"

        # 重写 insight md 的正文段（简单做法：在 md 末尾追加"## 草稿正文"）
        if ins["obsidian_path"]:
            p = pathlib.Path(vault_root).expanduser() / ins["obsidian_path"]
            if p.exists():
                txt = p.read_text(encoding="utf-8")
                # FinalReview BUG-3：替换旧草稿段(不无限叠加) + 同步 frontmatter status
                idx = txt.find("\n## 草稿正文")
                if idx != -1:
                    txt = txt[:idx]
                txt = re.sub(r"(?m)^status: .*$", "status: in_review", txt, count=1)
                stamp = "\n\n## 草稿正文（{}）\n\n{}\n".format(note, draft)
                p.write_text(txt + stamp, encoding="utf-8")
        con.execute("UPDATE insights SET status='in_review', updated_at=? WHERE id=?", (_now(), insight_id))
        con.commit()
        return {"insight_id": insight_id, "status": "in_review", "evidence_used": len(ev_ctx),
                "note": note, "draft_preview": (draft or "")[:200]}
    finally:
        con.close()


def record_publication(db_path: str, insight_id: str, platform: str, url: Optional[str] = None,
                       performance_notes: Optional[str] = None) -> Dict[str, Any]:
    """R15 发布台账：记录某 insight 在某平台已发布（发布动作人工，这里只登记）。"""
    valid = {"wechat_mp", "shipinhao", "xiaohongshu", "zhihu", "course", "other"}
    if platform not in valid:
        raise ValueError("platform 须为 {}".format(valid))
    con = sqlite3.connect(db_path)
    try:
        if not con.execute("SELECT 1 FROM insights WHERE id=?", (insight_id,)).fetchone():
            raise ValueError("insight 不存在: {}".format(insight_id))
        # FinalReview BUG-1：幂等——同 insight+platform 已登记则更新不重复记账
        existing = con.execute(
            "SELECT id FROM publications WHERE insight_id=? AND platform=?", (insight_id, platform)).fetchone()
        if existing:
            con.execute("UPDATE publications SET url=COALESCE(?,url), performance_notes=COALESCE(?,performance_notes) WHERE id=?",
                        (url, performance_notes, existing[0]))
            con.execute("UPDATE insights SET status='published', updated_at=? WHERE id=?", (_now(), insight_id))
            con.commit()
            return {"publication_id": existing[0], "insight_id": insight_id, "platform": platform,
                    "status": "published", "note": "already_logged_updated"}
        pub_id = "pub_" + _sid(insight_id, platform)
        con.execute(
            "INSERT INTO publications (id,insight_id,platform,published_at,url,performance_notes,created_at) "
            "VALUES (?,?,?,?,?,?,?)", (pub_id, insight_id, platform, _now(), url, performance_notes, _now()))
        con.execute("UPDATE insights SET status='published', updated_at=? WHERE id=?", (_now(), insight_id))
        con.commit()
        return {"publication_id": pub_id, "insight_id": insight_id, "platform": platform, "status": "published"}
    finally:
        con.close()


def list_insights(db_path: str) -> List[Dict[str, Any]]:
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        rows = con.execute(
            "SELECT i.id,i.type,i.title,i.status,i.reviewed_tier,"
            "(SELECT COUNT(*) FROM insight_sources s WHERE s.insight_id=i.id AND s.role='evidence') ev,"
            "(SELECT COUNT(*) FROM insight_sources s WHERE s.insight_id=i.id) tot "
            "FROM insights i ORDER BY i.created_at DESC").fetchall()
        return [dict(r) for r in rows]
    finally:
        con.close()
