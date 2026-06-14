"""Face1 — 主早报公众号 (hotspot WeChat article).

Content product: STUDIO/data/drafts/{edition}/wechat-article.md
Done evidence: state.faces.face1.mediaId set (publish_draft returned media_id).

HANDOFF §6 Face1 chain:
  lint_main_article.py --variant hotspot
  verify_article_urls.py
  publish_draft.py {edition} --publish-date {edition} --confirm
"""
from __future__ import annotations

from typing import Dict, List, Tuple

import config
from faces import _common as common
try:
    import insight_source
except Exception:
    insight_source = None

FACE = "face1"


def judge(state: Dict, edition: str) -> Tuple[str, Dict]:
    face = state["faces"][FACE]
    info: Dict = {}
    if face.get("status") == "done" or face.get("mediaId"):
        info["mediaId"] = face.get("mediaId")
        return "done", info
    md = config.main_article_md(edition)
    info["draftPath"] = str(md)
    if not md.exists():
        return "needs_content", info
    return "ready", info


def plan(state: Dict, edition: str) -> List[str]:
    rendered: List[str] = []
    rendered.append(" ".join(config.cmd_lint_main_article(edition)))
    rendered.append(" ".join(config.cmd_verify_article_urls(edition)))
    rendered.append(" ".join(config.cmd_publish_main_draft(edition)))
    return rendered


def write_request(state: Dict, edition: str) -> str:
    md = config.main_article_md(edition)
    elig_txt = ""
    if insight_source is not None:
        try:
            items = insight_source.eligible("wechat_official_account")
            lines = ["  %d. %s  <%s>" % (i + 1, (it["title"] or it["url"])[:70], it["url"]) for i, it in enumerate(items[:30])]
            elig_txt = ("### Insight Desk 可选条目（publishStatus=not_published，已自动去重）\n"
                        "共 %d 条，只从这些里选、勿用其它来源：\n" % len(items) + "\n".join(lines) + "\n\n")
        except Exception:
            elig_txt = ""
    body = (
        elig_txt +
        f"## 缺内容：Face1 主早报公众号\n\n"
        f"请把主文写到：`{md}`\n\n"
        f"### 字段与口径\n"
        f"- 题材：当日 SAP 早报（中国 / 欧美 / 日本 各 ≥5 条）。\n"
        f"- 选题只从上面 Insight Desk not_published 列表里选（已自动去重）；发布后工具自动 record_publish 写回。\n"
        f"- 真实性：每条事实必须挂可点击来源 + Link 原文链接；不命中来源就不写。\n"
        f"- 风格：财经新闻体例，无 emoji / 无 AI 痕迹（见 sap-daily-brief skill）。\n\n"
        f"### 写完后\n"
        f"```\n"
        f"SAP_FF_DRYRUN=1 /usr/bin/python3 sap_four_faces.py run {edition} --from face1\n"
        f"```\n"
    )
    path = common.write_content_request(edition, FACE, body)
    return str(path)


def run(state: Dict, edition: str, runner: common.Runner) -> Tuple[str, Dict]:
    """Execute lint → verify → publish. Returns (new_status, info)."""
    face = state["faces"][FACE]
    info: Dict = {}
    md = config.main_article_md(edition)
    if not md.exists():
        req = write_request(state, edition)
        return "needs_content", {"request": req, "draftPath": str(md)}

    # 1. lint
    lint = runner.run(
        config.cmd_lint_main_article(edition), "face1.lint_main_article"
    )
    if not lint.ok:
        return "blocked", {"step": "lint_main_article", "stderr": lint.stderr[:500]}

    # 2. verify URLs
    verify = runner.run(
        config.cmd_verify_article_urls(edition), "face1.verify_article_urls"
    )
    if not verify.ok:
        return "blocked", {"step": "verify_article_urls", "stderr": verify.stderr[:500]}

    # 3. publish (retry once on transient)
    pub = runner.run_with_retry(
        config.cmd_publish_main_draft(edition), "face1.publish_draft", retries=1
    )
    if not pub.ok:
        return "blocked", {"step": "publish_draft", "rc": pub.rc, "stderr": pub.stderr[:500]}

    media_id = common.parse_media_id(pub.stdout + "\n" + pub.stderr)
    if not media_id and not runner.dryrun:
        return "blocked", {"step": "publish_draft.media_id_missing", "stdout": pub.stdout[-500:]}

    if media_id:
        face["mediaId"] = media_id
        info["mediaId"] = media_id
        if insight_source is not None and not runner.dryrun:
            try:
                info["insightMarked"] = insight_source.mark_from_md(str(md), "wechat_official_account", "four-faces-" + edition)
            except Exception as e:
                info["insightMarkWarn"] = str(e)
    if runner.dryrun:
        info["dryrun"] = True
        return "ready", info
    return "done", info
