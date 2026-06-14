"""Face4 — 深度稿短视频 (deep-short channels videos).

Content product: PIPE/input/{edition}/input.json (LLM-authored:
coverTitle / coverSubtitle / 4 pillar / 4 summary / desc / event per piece)
Done evidence: each shorts/<eid>/channels_draft_upload_evidence.json file
exists; sourceReuse-skipped events are marked but do not fail completion.

HANDOFF §6 Face4 chain:
  extract-short-events.js --date {edition}     # derive events
  run_deep_shorts_all.py {edition} input.json --push
  poll working/{edition}/deep_shorts_status.json
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

import config
from faces import _common as common

FACE = "face4"


def _shorts_root(edition: str) -> Path:
    return config.working_dir(edition) / "shorts"


def _scan_evidence(edition: str) -> Tuple[List[Dict], List[str]]:
    """Return (evidences, skipped_events). evidences: list of {eid, path}."""
    evidences: List[Dict] = []
    skipped: List[str] = []
    root = _shorts_root(edition)
    if not root.is_dir():
        return evidences, skipped
    for sub in sorted(root.iterdir()):
        if not sub.is_dir():
            continue
        ev = sub / "channels_draft_upload_evidence.json"
        if ev.is_file():
            evidences.append({"eid": sub.name, "path": str(ev)})
            continue
        marker = sub / "skipped_reuse.json"
        if marker.is_file():
            skipped.append(sub.name)
    return evidences, skipped


def _expected_events(edition: str) -> List[str]:
    path = config.short_video_events_path(edition)
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    events = data.get("events") if isinstance(data, dict) else None
    if not isinstance(events, list):
        return []
    return [str(e.get("id")) for e in events if isinstance(e, dict) and e.get("id")]


def judge(state: Dict, edition: str) -> Tuple[str, Dict]:
    face = state["faces"][FACE]
    info: Dict = {}

    expected = _expected_events(edition)
    info["expectedEvents"] = expected
    evidences, skipped = _scan_evidence(edition)
    info["evidence"] = evidences
    info["skippedReuse"] = skipped

    if expected:
        covered = {e["eid"] for e in evidences} | set(skipped)
        # § Face4 完成判定：每个 events 至少有 evidence 或 skipped_reuse 标记。
        if all(eid in covered for eid in expected) and any(e["eid"] in covered for e in evidences):
            return "done", info

    if face.get("status") == "done" and face.get("shorts"):
        return "done", info

    if not config.shorts_input_json(edition).exists():
        return "needs_content", info
    return "ready", info


def plan(state: Dict, edition: str) -> List[str]:
    rendered: List[str] = []
    rendered.append(config.cmd_extract_short_events(edition))
    if config.shorts_input_json(edition).exists():
        rendered.append(" ".join(config.cmd_run_deep_shorts_all(edition)))
    else:
        rendered.append(
            "(input.json missing; will write content_request_face4.md then stop)"
        )
    return rendered


def _list_face3_articles(state: Dict) -> List[Dict]:
    face3 = state["faces"].get("face3") or {}
    return [a for a in (face3.get("articles") or []) if isinstance(a, dict)]


def write_request(state: Dict, edition: str) -> str:
    lines: List[str] = []
    lines.append("## 缺内容：Face4 深度稿短视频 input.json\n")
    lines.append("### Face3 已发深度稿（每篇一条短视频）\n")
    arts = _list_face3_articles(state)
    if arts:
        for a in arts:
            slug = a.get("slug", "?")
            mid = a.get("mediaId", "?")
            lines.append(f"- `{slug}` mediaId=`{mid}`")
    else:
        lines.append("- Face3 尚未登记 article→mediaId（请先把 Face3 跑完再回来）。")
    lines.append("")
    expected = _expected_events(edition)
    lines.append("### extract-short-events 已生成的 event 列表\n")
    if expected:
        for eid in expected:
            lines.append(f"- {eid}")
    else:
        lines.append("- 尚未生成。先跑：")
        lines.append(f"```\n{config.cmd_extract_short_events(edition)}\n```")
    lines.append("")
    lines.append("### input.json 必填字段（每篇）\n")
    lines.append(
        "- `coverTitle`（≤16 字，无空格无特殊符）\n"
        "- `coverSubtitle`\n"
        "- `pillars` ×4：每条对应一段 summary\n"
        "- `summaries` ×4\n"
        "- `desc`（视频号描述）\n"
        "- `event`（id 必须命中上面的 event 列表，token 须能被 review-short-quality 检过）\n"
    )
    lines.append("### 路径\n")
    lines.append(f"`{config.shorts_input_json(edition)}`\n")
    lines.append("\n### 写完后\n```\n")
    lines.append(
        f"SAP_FF_DRYRUN=1 /usr/bin/python3 sap_four_faces.py run {edition} --from face4\n"
    )
    lines.append("```\n")

    path = common.write_content_request(edition, FACE, "\n".join(lines))
    return str(path)


def run(state: Dict, edition: str, runner: common.Runner) -> Tuple[str, Dict]:
    face = state["faces"][FACE]

    # 1. extract events (derive from main article)
    ex = runner.run(
        config.cmd_extract_short_events(edition), "face4.extract_short_events"
    )
    if not ex.ok:
        return "blocked", {"step": "extract_short_events", "stderr": ex.stderr[:500]}

    # 2. need input.json from LLM
    if not config.shorts_input_json(edition).exists():
        req = write_request(state, edition)
        return "needs_content", {"request": req}

    # 3. run deep-shorts pipeline (push). The script itself manages broll
    # retries inside; we add an outer retry-once for transient cdp failures.
    run_res = runner.run_with_retry(
        config.cmd_run_deep_shorts_all(edition),
        "face4.run_deep_shorts_all",
        retries=1,
    )
    if not run_res.ok:
        return "blocked", {
            "step": "run_deep_shorts_all",
            "rc": run_res.rc,
            "stderr": run_res.stderr[:500],
            "hint": (
                "Common transient failures (HANDOFF §6 Face4): "
                "broll selected_bg missing -> re-run event; "
                "口播稿 unsupportedTokens (e.g. FICO 不在 event.summary) -> "
                "add the missing token to content_request and re-run."
            ),
        }

    if runner.dryrun:
        return "ready", {"dryrun": True}

    evidences, skipped = _scan_evidence(edition)
    expected = _expected_events(edition)
    face["shorts"] = evidences
    face["skippedReuse"] = skipped
    if expected:
        covered = {e["eid"] for e in evidences} | set(skipped)
        missing = [eid for eid in expected if eid not in covered]
        if missing:
            return "blocked", {"step": "face4.missing_evidence", "missing": missing}
    return "done", {"shorts": evidences, "skippedReuse": skipped}
