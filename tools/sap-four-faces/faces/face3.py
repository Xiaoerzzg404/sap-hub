"""Face3 — 深度稿公众号 (per-article WeChat).

Content product: STUDIO/data/per-article/{edition}/article_NN_v1/content.json
Done evidence: each tracked article entry has mediaId, count >= target_min.

HANDOFF §6 Face3 chain per article:
  gen_deep_article.py content.json article_NN_v1/wechat-article.md
  lint_public_text.py wechat-article.md
  prepare_deep_cover.py article_NN_v1/
  publish_draft.py article_NN_v1 --draft-root ... --publish-date {edition}
      --keep-cover --confirm
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

import config
from faces import _common as common
try:
    import insight_source
except Exception:
    insight_source = None

FACE = "face3"
DEFAULT_TARGET_MIN = 4


def target_min() -> int:
    try:
        return max(1, int(os.environ.get("SAP_FF_FACE3_MIN", DEFAULT_TARGET_MIN)))
    except ValueError:
        return DEFAULT_TARGET_MIN


def _article_dirs(edition: str) -> List[Path]:
    root = config.per_article_dir(edition)
    if not root.is_dir():
        return []
    return sorted(d for d in root.glob("article_*_v*") if d.is_dir())


def _has_content(article_dir: Path) -> bool:
    return (article_dir / "content.json").is_file()


def _has_published_marker(article_dir: Path) -> bool:
    """Heuristic: gen_deep_article writes wechat-article.md; publish_draft
    drops a per-article publish ledger. We treat presence of media_id in
    state as authoritative; this helper is only a fallback used by judge()
    to recognize work done in prior runs of the legacy pipeline.
    """
    candidates = [
        article_dir / "publish_evidence.json",
        article_dir / "publish_result.json",
    ]
    return any(c.is_file() for c in candidates)


def judge(state: Dict, edition: str) -> Tuple[str, Dict]:
    face = state["faces"][FACE]
    info: Dict = {}

    dirs = _article_dirs(edition)
    with_content = [d for d in dirs if _has_content(d)]
    info["articleDirs"] = [d.name for d in dirs]
    info["withContent"] = [d.name for d in with_content]

    tracked = list(face.get("articles", []) or [])
    media_count = sum(1 for a in tracked if isinstance(a, dict) and a.get("mediaId"))
    info["mediaCount"] = media_count
    info["targetMin"] = target_min()

    if media_count >= target_min():
        return "done", info
    if len(with_content) < target_min():
        return "needs_content", info
    return "ready", info


def plan(state: Dict, edition: str) -> List[str]:
    rendered: List[str] = []
    dirs = [d for d in _article_dirs(edition) if _has_content(d)]
    if not dirs:
        rendered.append(
            "(no per-article content.json found; will write content_request_face3.md)"
        )
        return rendered
    for d in dirs:
        out_md = d / "wechat-article.md"
        rendered.append(" ".join(config.cmd_gen_deep_article(d / "content.json", out_md)))
        rendered.append(" ".join(config.cmd_lint_public_text(out_md)))
        rendered.append(" ".join(config.cmd_prepare_deep_cover(d)))
        rendered.append(" ".join(config.cmd_publish_deep_draft(edition, d.name)))
    return rendered


def write_request(state: Dict, edition: str) -> str:
    dirs = _article_dirs(edition)
    with_content = [d for d in dirs if _has_content(d)]
    have = len(with_content)
    need = target_min()
    missing = max(0, need - have)

    # candidate URLs from main article + backlog hint; dedup-filtered
    candidate_urls: List[str] = []
    main_md = config.main_article_md(edition)
    if main_md.exists():
        candidate_urls = common.extract_urls(main_md.read_text(encoding="utf-8", errors="ignore"))
    new_urls = common.deep_dedup(candidate_urls, edition, window=14)

    lines: List[str] = []
    lines.append(f"## 缺内容：Face3 深度稿（需补 {missing} 篇，目标 {need} 篇）\n")
    lines.append("### 当前状态\n")
    if dirs:
        for d in dirs:
            has = "✓" if _has_content(d) else "✗"
            lines.append(f"- {has} `{d.name}` (content.json {'已就位' if _has_content(d) else '缺'})")
    else:
        lines.append("- 目录 `STUDIO/data/per-article/{edition}/` 为空，需要先建 article_NN_v1/。".format(edition=edition))
    lines.append("")
    lines.append("### 去重后可写选题（来自当日主文链接，已剔除过去 14 天命中）\n")
    if new_urls:
        for url in new_urls[:30]:
            lines.append(f"- {url}")
    else:
        lines.append("- 主文无新增 URL 或全部已被消费。可从 per_article_runner.py --next 拉 backlog。")
    lines.append("")
    lines.append("### 写法\n")
    lines.append(
        f"- 路径：`STUDIO/data/per-article/{edition}/article_NN_v1/content.json`\n"
        f"- 字段：见全局 CLAUDE.md Z 节 v10（title/executive/news/impact/analysis/action/messaging/risk/sources）。\n"
        f"- 真实性：每条 source 必须可点击；不命中来源就不写。\n"
        f"- 篇数：至少 {need} 篇；oldest-first 选题：`{' '.join(config.cmd_per_article_runner_next(need))}`\n"
    )
    lines.append("### 写完后\n```\n")
    lines.append(
        f"SAP_FF_DRYRUN=1 /usr/bin/python3 sap_four_faces.py run {edition} --from face3\n"
    )
    lines.append("```\n")

    path = common.write_content_request(edition, FACE, "\n".join(lines))
    return str(path)


def run(state: Dict, edition: str, runner: common.Runner) -> Tuple[str, Dict]:
    face = state["faces"][FACE]
    dirs = [d for d in _article_dirs(edition) if _has_content(d)]
    if len(dirs) < target_min():
        req = write_request(state, edition)
        return "needs_content", {"request": req, "have": len(dirs), "need": target_min()}

    tracked: Dict[str, Dict] = {a["slug"]: a for a in face.get("articles", []) if isinstance(a, dict) and a.get("slug")}

    for d in dirs:
        slug = d.name
        if tracked.get(slug, {}).get("mediaId"):
            continue
        out_md = d / "wechat-article.md"
        content_json = d / "content.json"

        gen = runner.run(
            config.cmd_gen_deep_article(content_json, out_md), f"face3.gen.{slug}"
        )
        if not gen.ok:
            return "blocked", {"step": f"gen_deep_article.{slug}", "stderr": gen.stderr[:500]}

        lint = runner.run(
            config.cmd_lint_public_text(out_md), f"face3.lint.{slug}"
        )
        if not lint.ok:
            return "blocked", {"step": f"lint_public_text.{slug}", "stderr": lint.stderr[:500]}

        cover = runner.run(
            config.cmd_prepare_deep_cover(d), f"face3.cover.{slug}"
        )
        if not cover.ok:
            return "blocked", {"step": f"prepare_deep_cover.{slug}", "stderr": cover.stderr[:500]}

        pub = runner.run_with_retry(
            config.cmd_publish_deep_draft(edition, slug),
            f"face3.publish.{slug}",
            retries=1,
        )
        if not pub.ok:
            return "blocked", {"step": f"publish.{slug}", "rc": pub.rc, "stderr": pub.stderr[:500]}

        media_id = common.parse_media_id(pub.stdout + "\n" + pub.stderr)
        if not media_id and not runner.dryrun:
            return "blocked", {"step": f"publish.{slug}.media_id_missing", "stdout": pub.stdout[-500:]}
        tracked[slug] = {"slug": slug, "mediaId": media_id or "dryrun"}
        if insight_source is not None and media_id and not runner.dryrun:
            try:
                insight_source.mark_from_md(str(out_md), "wechat_official_account", "four-faces-deep-" + edition)
            except Exception:
                pass

    face["articles"] = list(tracked.values())
    media_count = sum(1 for a in face["articles"] if a.get("mediaId") and a["mediaId"] != "dryrun")
    if runner.dryrun:
        return "ready", {"dryrun": True, "articles": face["articles"]}
    if media_count < target_min():
        return "blocked", {"step": "face3.media_count_short", "got": media_count, "need": target_min()}
    return "done", {"articles": face["articles"]}
