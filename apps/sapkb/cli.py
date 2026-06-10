"""SAPKB command line interface."""
from __future__ import annotations

import argparse
import json
import os
from typing import Any, Dict

if __package__ in (None, ""):
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    import pipeline
else:
    from . import pipeline  # type: ignore

DEFAULT_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "sapkb.db"))
DEFAULT_VAULT_ROOT = os.path.expanduser("~/sap-hub/vaults/SAP_EXTKB")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="sapkb")
    subparsers = parser.add_subparsers(dest="command")

    harvest_parser = subparsers.add_parser("harvest", help="Run source harvest")
    harvest_parser.add_argument("--source", required=True)
    harvest_parser.add_argument("--db-path", default=DEFAULT_DB_PATH)
    harvest_parser.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)

    search_parser = subparsers.add_parser("search", help="Search SAPKB documents")
    search_parser.add_argument("query", help="Search keyword")
    search_parser.add_argument("--db-path", default=DEFAULT_DB_PATH)

    s2 = subparsers.add_parser("dedup-stage2", help="近重复扫描（不自动归并，产 needs_review 候选）")
    s2.add_argument("--db-path", default=DEFAULT_DB_PATH)
    s2.add_argument("--backend", default="charngram", choices=["charngram", "bge_m3"])
    s2.add_argument("--threshold", type=float, default=None, help="仅覆盖 combined 信号阈值（不影响 title）")

    mp = subparsers.add_parser("mirror", help="生成作者/专栏 Dataview 门户镜像")
    mp.add_argument("--db-path", default=DEFAULT_DB_PATH)
    mp.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)
    mp.add_argument("--author-threshold", type=int, default=5)
    mp.add_argument("--column-threshold", type=int, default=3)

    wp = subparsers.add_parser("watch", help="watchlist 增量追更扫描（推进水位线+自适应频率）")
    wp.add_argument("--db-path", default=DEFAULT_DB_PATH)

    pr = subparsers.add_parser("payment-reminders", help="列出待付费解锁全文的条目")
    pr.add_argument("--db-path", default=DEFAULT_DB_PATH)

    em = subparsers.add_parser("embed", help="对文档分块并用 bge-m3 建本地向量索引（幂等）")
    em.add_argument("--db-path", default=DEFAULT_DB_PATH)
    em.add_argument("--limit", type=int, default=None)

    ss = subparsers.add_parser("semantic-search", help="语义检索（bge-m3），带来源+置信tier")
    ss.add_argument("query")
    ss.add_argument("--db-path", default=DEFAULT_DB_PATH)
    ss.add_argument("-k", type=int, default=5)

    ak = subparsers.add_parser("ask", help="RAG 问答：仅据检索到的外部资料作答+引用")
    ak.add_argument("query")
    ak.add_argument("--db-path", default=DEFAULT_DB_PATH)
    ak.add_argument("-k", type=int, default=5)
    ak.add_argument("--no-generate", action="store_true", help="只检索证据不生成式作答")

    cp = subparsers.add_parser("clip", help="人工导入你有权查看的全文（剪贴板/文件），docs/11 剪藏器")
    cp.add_argument("--url", required=True)
    cp.add_argument("--title", required=True)
    cp.add_argument("--author", default="")
    cp.add_argument("--author-uid", default=None, help="作者平台 id（如 CSDN i042416），与 harvest 对齐去重")
    cp.add_argument("--platform", default="manual")
    cp.add_argument("--content-file", default=None, help="正文文件；缺省读剪贴板 pbpaste")
    cp.add_argument("--db-path", default=DEFAULT_DB_PATH)
    cp.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)
    # 已购授权（可选）
    cp.add_argument("--license-type", default=None, choices=[None, "purchase", "subscription", "written_permission", "cc_license"])
    cp.add_argument("--licensor", default=None)
    cp.add_argument("--scope", default="individual", choices=["individual", "derivative", "commercial"])
    cp.add_argument("--evidence", default=None, help="发票/许可截图本地路径（登记授权必填且文件须存在）")
    cp.add_argument("--purchased-at", default=None)

    cb = subparsers.add_parser("clip-batch", help="批量导入一个文件夹/manifest 的下载全文（升级已采元数据）")
    cb.add_argument("--folder", default=None, help="文件夹：文件名=CSDN文章id（如 151856954.md）")
    cb.add_argument("--manifest", default=None, help="CSV: url,file[,title,author,author_uid]")
    cb.add_argument("--db-path", default=DEFAULT_DB_PATH)
    cb.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)
    cb.add_argument("--platform", default="csdn")
    cb.add_argument("--license-type", default=None, choices=[None, "purchase", "subscription", "written_permission", "cc_license"])
    cb.add_argument("--licensor", default="CSDN VIP")
    cb.add_argument("--scope", default="individual", choices=["individual", "derivative", "commercial"])
    cb.add_argument("--evidence", default=None, help="VIP 订阅凭证本地路径（登记授权必填且须存在）")

    ev = subparsers.add_parser("kb-eval", help="RAG 探针评测：报告 top 命中分数/作答率，辅助调 k/MIN_SCORE")
    ev.add_argument("--db-path", default=DEFAULT_DB_PATH)
    ev.add_argument("-k", type=int, default=5)

    ri = subparsers.add_parser("regen-inbox", help="按 DB 当前标签重写全部 inbox md（补 category frontmatter）")
    ri.add_argument("--db-path", default=DEFAULT_DB_PATH)
    ri.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)

    pop = subparsers.add_parser("recompute-popularity", help="按权重重算每篇 popularity_score (R12)")
    pop.add_argument("--db-path", default=DEFAULT_DB_PATH)

    tr = subparsers.add_parser("trend", help="趋势雷达：季度标签快照 + 热点 + 新词候选 (R14)")
    tr.add_argument("--db-path", default=DEFAULT_DB_PATH)

    sl = subparsers.add_parser("shortlist", help="选题 shortlist：按热度/新近/SAP AI 排候选 (供公众号/视频号选题)")
    sl.add_argument("--db-path", default=DEFAULT_DB_PATH)
    sl.add_argument("--category", default=None)
    sl.add_argument("--limit", type=int, default=20)

    ins = subparsers.add_parser("insight-new", help="R13 提炼：从源文档建 insight（版权角色硬隔离）")
    ins.add_argument("--type", default="knowledge_card",
                     choices=["knowledge_card", "experience_note", "growth_article", "trend_report", "learning_path"])
    ins.add_argument("--title", required=True)
    ins.add_argument("--docs", required=True, help="逗号分隔 doc_id（角色按各源授权自动判定）")
    ins.add_argument("--evidence-docs", default="", help="逗号分隔 doc_id，强制作 evidence（须授权全文，否则拒绝）")
    ins.add_argument("--db-path", default=DEFAULT_DB_PATH)
    ins.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)

    insl = subparsers.add_parser("insights-list", help="列出已提炼 insights")
    insl.add_argument("--db-path", default=DEFAULT_DB_PATH)

    idr = subparsers.add_parser("insight-draft", help="据 evidence 全文 LLM 成稿（仅引证据，不脑补）")
    idr.add_argument("--insight-id", required=True)
    idr.add_argument("--db-path", default=DEFAULT_DB_PATH)
    idr.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)

    pl = subparsers.add_parser("publish-log", help="R15 发布台账：登记某 insight 已在某平台发布（发布动作人工）")
    pl.add_argument("--insight-id", required=True)
    pl.add_argument("--platform", required=True,
                    choices=["wechat_mp", "shipinhao", "xiaohongshu", "zhihu", "course", "other"])
    pl.add_argument("--url", default=None)
    pl.add_argument("--notes", default=None)
    pl.add_argument("--db-path", default=DEFAULT_DB_PATH)
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return
    if args.command == "harvest":
        result = pipeline.run_harvest(args.source, args.db_path, args.vault_root)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "search":
        results = pipeline.run_search(args.query, args.db_path)
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return
    if args.command == "dedup-stage2":
        try:
            result = pipeline.run_dedup_stage2(args.db_path, args.backend, args.threshold)
        except Exception as e:
            from kb.embedder import KBEmbedError
            if isinstance(e, KBEmbedError):
                result = {"error": str(e)}
            else:
                raise
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "mirror":
        result = pipeline.run_mirror(args.db_path, args.vault_root,
                                     args.author_threshold, args.column_threshold)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "watch":
        result = pipeline.run_watch(args.db_path)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "payment-reminders":
        result = pipeline.payment_reminders(args.db_path)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "clip":
        from ingest import clip
        content = ""
        if args.content_file:
            with open(args.content_file, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            content = clip.read_clipboard()
        license_info = None
        if args.license_type:
            license_info = {"license_type": args.license_type, "licensor": args.licensor,
                            "scope": args.scope, "evidence_path": args.evidence,
                            "purchased_at": args.purchased_at}
        try:
            result = clip.clip_import(args.url, args.title, args.author, content,
                                      args.db_path, args.vault_root, platform=args.platform,
                                      license_info=license_info, author_uid=args.author_uid)
        except (ValueError, FileNotFoundError) as e:
            result = {"status": "rejected", "error": str(e)}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "clip-batch":
        from ingest import clip_batch
        license_info = None
        if args.license_type:
            license_info = {"license_type": args.license_type, "licensor": args.licensor,
                            "scope": args.scope, "evidence_path": args.evidence}
        result = clip_batch.run_batch(args.db_path, args.vault_root, folder=args.folder,
                                      manifest=args.manifest, platform=args.platform,
                                      license_info=license_info)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "regen-inbox":
        result = pipeline.regen_inbox(args.db_path, args.vault_root)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "insight-new":
        from process import distill
        ev = set(x.strip() for x in args.evidence_docs.split(",") if x.strip())
        srcs = []
        for d in (x.strip() for x in args.docs.split(",") if x.strip()):
            srcs.append({"doc_id": d, "role": "evidence" if d in ev else None})
        for d in ev:
            if d not in [s["doc_id"] for s in srcs]:
                srcs.append({"doc_id": d, "role": "evidence"})
        try:
            result = distill.create_insight(args.db_path, args.vault_root, args.type, args.title, srcs)
        except (ValueError, PermissionError) as e:
            result = {"status": "rejected", "error": str(e)}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "insights-list":
        from process import distill
        print(json.dumps(distill.list_insights(args.db_path), ensure_ascii=False, indent=2))
        return
    if args.command == "insight-draft":
        from process import distill
        try:
            result = distill.draft_insight(args.db_path, args.vault_root, args.insight_id)
        except ValueError as e:
            result = {"status": "rejected", "error": str(e)}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "publish-log":
        from process import distill
        try:
            result = distill.record_publication(args.db_path, args.insight_id, args.platform, args.url, args.notes)
        except ValueError as e:
            result = {"status": "rejected", "error": str(e)}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command in ("recompute-popularity", "trend", "shortlist"):
        from process import analytics
        if args.command == "recompute-popularity":
            result = analytics.recompute_popularity(args.db_path)
        elif args.command == "trend":
            result = {"snapshot": analytics.build_trend_snapshot(args.db_path),
                      "new_terms": analytics.detect_term_candidates(args.db_path)}
        else:
            result = analytics.topic_shortlist(args.db_path, args.category, args.limit)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command == "kb-eval":
        from kb import rag
        from kb.embedder import KBEmbedError
        try:
            result = rag.evaluate(args.db_path, k=args.k)
        except KBEmbedError as e:
            result = {"error": str(e)}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command in ("embed", "semantic-search", "ask"):
        from kb import rag
        from kb.embedder import KBEmbedError
        try:
            if args.command == "embed":
                result = rag.build_index(args.db_path, limit=args.limit)
            elif args.command == "semantic-search":
                result = rag.semantic_search(args.query, args.db_path, k=args.k)
            else:
                result = rag.answer(args.query, args.db_path, k=args.k, generate=not args.no_generate)
        except KBEmbedError as e:
            result = {"error": str(e)}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return


def get_default_paths() -> Dict[str, str]:
    return {"db_path": DEFAULT_DB_PATH, "vault_root": DEFAULT_VAULT_ROOT}


if __name__ == "__main__":
    main()
