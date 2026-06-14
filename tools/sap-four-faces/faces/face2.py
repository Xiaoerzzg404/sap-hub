"""Face2 — 热点视频号 (channels short video, derived from Face1 main article).

No new LLM content required. Done evidence: every
working/{edition}/hotnews_channels_live_confirmation_part*.json contains
errCode == 0 and a non-empty objectId.

HANDOFF §6 Face2 chain:
  _auto_split_news.py {edition} --force
  PIPE/scripts/_auto_news_ready.py {edition}
  npm run render-cards -- --date {edition}     # Playwright env
  npm run render-videos -- --date {edition}    # Playwright env
  _auto_channels_config.py {edition}           # title ≤16 chars
  lint_public_text.py on the title
  cdp_publish_videos_v6.py channels-batch-config.json
"""
from __future__ import annotations

import json
from typing import Dict, List, Tuple

import config
from faces import _common as common

FACE = "face2"


def _read_one(entry: Dict) -> Tuple[int, str]:
    """Return (errCode, objectId) from a confirmation entry.

    Production files nest the values inside `saveApi`; older / test files
    put them at the top level. We accept both layouts.
    """
    sources: List[Dict] = [entry]
    save_api = entry.get("saveApi") if isinstance(entry, dict) else None
    if isinstance(save_api, dict):
        sources.insert(0, save_api)
    err = 0
    obj = ""
    for src in sources:
        if not obj:
            cand = (
                src.get("objectId")
                or src.get("export_id")
                or src.get("media_id")
            )
            if cand:
                obj = str(cand)
        if "errCode" in src:
            err = src.get("errCode") or 0
            break
        if "errcode" in src:
            err = src.get("errcode") or 0
            break
    return err, obj


def _collect_object_ids(edition: str) -> List[str]:
    out: List[str] = []
    files = common.list_json_glob(
        config.channels_live_confirmation_glob(edition)
    )
    for fp in files:
        try:
            data = json.loads(fp.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        if isinstance(data, dict):
            entries = [data]
        elif isinstance(data, list):
            entries = data
        else:
            return []
        for entry in entries:
            if not isinstance(entry, dict):
                return []
            err, obj = _read_one(entry)
            if err != 0 or not obj:
                return []
            out.append(obj)
    return out


def judge(state: Dict, edition: str) -> Tuple[str, Dict]:
    face = state["faces"][FACE]
    info: Dict = {}
    if face.get("status") == "done" and face.get("objectIds"):
        info["objectIds"] = face["objectIds"]
        return "done", info
    files = common.list_json_glob(
        config.channels_live_confirmation_glob(edition)
    )
    info["confirmationFiles"] = [str(f) for f in files]
    if files:
        obj_ids = _collect_object_ids(edition)
        if obj_ids:
            info["objectIds"] = obj_ids
            return "done", info
    # Face2 derives from Face1; we don't write a content_request — we just
    # report ready and the orchestrator will gate sequencing.
    return "ready", info


def plan(state: Dict, edition: str) -> List[str]:
    rendered: List[str] = []
    rendered.append(" ".join(config.cmd_auto_split_news(edition)))
    rendered.append(" ".join(config.cmd_auto_news_ready(edition)))
    rendered.append(config.cmd_render_cards(edition))
    rendered.append(config.cmd_render_videos(edition))
    rendered.append(" ".join(config.cmd_auto_channels_config(edition)))
    rendered.append(
        " ".join(
            config.cmd_lint_public_text(config.channels_batch_config(edition))
        )
    )
    rendered.append(" ".join(config.cmd_cdp_publish_videos_v6(edition)))
    return rendered


def run(state: Dict, edition: str, runner: common.Runner) -> Tuple[str, Dict]:
    face = state["faces"][FACE]

    for cmd, label in [
        (config.cmd_auto_split_news(edition), "face2.auto_split_news"),
        (config.cmd_auto_news_ready(edition), "face2.auto_news_ready"),
    ]:
        res = runner.run_with_retry(cmd, label, retries=1)
        if not res.ok:
            return "blocked", {"step": label, "rc": res.rc, "stderr": res.stderr[:500]}

    for shell_cmd, label in [
        (config.cmd_render_cards(edition), "face2.render_cards"),
        (config.cmd_render_videos(edition), "face2.render_videos"),
    ]:
        res = runner.run_with_retry(shell_cmd, label, retries=1)
        if not res.ok:
            return "blocked", {"step": label, "rc": res.rc, "stderr": res.stderr[:500]}

    chan = runner.run(
        config.cmd_auto_channels_config(edition),
        "face2.auto_channels_config",
    )
    if not chan.ok:
        return "blocked", {"step": "auto_channels_config", "stderr": chan.stderr[:500]}

    lint = runner.run(
        config.cmd_lint_public_text(config.channels_batch_config(edition)),
        "face2.lint_public_text",
    )
    if not lint.ok:
        return "blocked", {"step": "lint_public_text", "stderr": lint.stderr[:500]}

    pub = runner.run_with_retry(
        config.cmd_cdp_publish_videos_v6(edition),
        "face2.cdp_publish_videos_v6",
        retries=1,
    )
    if not pub.ok:
        return "blocked", {"step": "cdp_publish_videos_v6", "rc": pub.rc, "stderr": pub.stderr[:500]}

    if runner.dryrun:
        return "ready", {"dryrun": True}

    obj_ids = _collect_object_ids(edition)
    if not obj_ids:
        return "blocked", {"step": "confirm_object_ids", "reason": "no confirmation files / errCode != 0"}
    face["objectIds"] = obj_ids
    return "done", {"objectIds": obj_ids}
