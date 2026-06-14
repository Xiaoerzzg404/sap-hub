#!/usr/bin/env python3
"""sap-four-faces orchestrator.

State machine that drives Face1..Face4 of the SAP daily-brief pipeline.
See HANDOFF.md (this directory) for the authoritative spec.

CLI:
  sap_four_faces.py status   {edition}
  sap_four_faces.py plan     {edition}
  sap_four_faces.py run      {edition} [--from faceN] [--only faceN]
  sap_four_faces.py finalize {edition}

Invariants (HANDOFF §9):
  1. Faces run in order; needs_content stops the run (never silent skip).
  2. finalize only writes .published / .channels-published when all four
     faces are done (real evidence on disk). Otherwise: partial summary.
  3. Face3 candidate selection passes deep_dedup (HANDOFF §8).
  4. lint / verify / publish gates are not bypassed (--skip-* forbidden).
  5. Known transient failures get one automatic retry; otherwise blocked.

Python 3.9.6 compatible — no PEP604 `X | None`, uses typing.Optional.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import config
from faces import _common as common
from faces import face1, face2, face3, face4

_HERE = Path(__file__).resolve().parent

FACES = [face1, face2, face3, face4]
FACE_KEYS = ["face1", "face2", "face3", "face4"]


# --------------------------------------------------------------------------
# State helpers
# --------------------------------------------------------------------------
def _now_iso() -> str:
    return _dt.datetime.now().astimezone().isoformat(timespec="seconds")


def empty_state(edition: str) -> Dict:
    now = _now_iso()
    return {
        "edition": edition,
        "startedAt": now,
        "updatedAt": now,
        "faces": {
            "face1": {"status": "pending", "mediaId": None, "notes": ""},
            "face2": {"status": "pending", "objectIds": [], "notes": ""},
            "face3": {"status": "pending", "articles": [], "notes": ""},
            "face4": {"status": "pending", "shorts": [], "notes": ""},
        },
        "published": False,
    }


def load_state(edition: str) -> Dict:
    path = config.state_path(edition)
    if not path.exists():
        return empty_state(edition)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return empty_state(edition)
    if not isinstance(data, dict):
        return empty_state(edition)
    # ensure schema completeness
    base = empty_state(edition)
    base.update({k: v for k, v in data.items() if k != "faces"})
    base["edition"] = edition
    incoming_faces = data.get("faces") or {}
    for key, default in base["faces"].items():
        node = incoming_faces.get(key) or {}
        merged = dict(default)
        if isinstance(node, dict):
            merged.update(node)
        base["faces"][key] = merged
    return base


def save_state(state: Dict) -> Path:
    state["updatedAt"] = _now_iso()
    path = config.state_path(state["edition"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(state, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return path


# --------------------------------------------------------------------------
# Edition validation
# --------------------------------------------------------------------------
_EDITION_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def validate_edition(edition: str) -> str:
    if not _EDITION_RE.match(edition):
        raise SystemExit(f"edition must be YYYY-MM-DD, got: {edition!r}")
    try:
        _dt.date.fromisoformat(edition)
    except ValueError as exc:
        raise SystemExit(f"edition not a real date: {edition!r} ({exc})")
    return edition


# --------------------------------------------------------------------------
# Status / plan
# --------------------------------------------------------------------------
def _judge_all(state: Dict, edition: str) -> List[Tuple[str, str, Dict]]:
    """Return [(faceKey, status, info), ...] without mutating state."""
    out: List[Tuple[str, str, Dict]] = []
    for mod, key in zip(FACES, FACE_KEYS):
        status, info = mod.judge(state, edition)
        out.append((key, status, info))
    return out


def cmd_status(edition: str) -> int:
    state = load_state(edition)
    print(f"# four-faces status · {edition}")
    print(f"state file: {config.state_path(edition)}")
    print(f"published flag (in state): {state.get('published', False)}")
    print(f".published marker: {config.published_marker(edition).exists()}")
    print(f".channels-published marker: {config.channels_published_marker(edition).exists()}")
    print()
    judgments = _judge_all(state, edition)
    for key, status, info in judgments:
        persisted = state["faces"][key].get("status", "pending")
        print(f"## {key}  judged={status}  persisted={persisted}")
        if info:
            for k, v in info.items():
                rendered = v if isinstance(v, (str, int, float, bool)) else json.dumps(v, ensure_ascii=False)
                print(f"  - {k}: {rendered}")
        print()
    return 0


def cmd_plan(edition: str) -> int:
    state = load_state(edition)
    print(f"# four-faces plan · {edition}  (no side-effects)")
    print()
    for mod, key in zip(FACES, FACE_KEYS):
        status, info = mod.judge(state, edition)
        if status == "done":
            print(f"## {key}  [SKIP] (already done)")
            if info:
                print(f"  info: {json.dumps(info, ensure_ascii=False)}")
            print()
            continue
        if status == "needs_content":
            print(f"## {key}  [NEEDS_CONTENT]")
            print(
                f"  -> will write content request: "
                f"{config.content_request_path(edition, key)}"
            )
            if info:
                print(f"  info: {json.dumps(info, ensure_ascii=False)}")
            print()
            continue
        print(f"## {key}  [READY] would run:")
        for step in mod.plan(state, edition):
            print(f"  $ {step}")
        print()
    return 0


# --------------------------------------------------------------------------
# Run
# --------------------------------------------------------------------------
def _run_face(face_key: str, state: Dict, edition: str, runner: common.Runner) -> str:
    mod = FACES[FACE_KEYS.index(face_key)]
    face = state["faces"][face_key]
    face["status"] = "running"
    save_state(state)
    try:
        new_status, info = mod.run(state, edition, runner)
    except Exception as exc:  # noqa: BLE001 - reflect crash into state
        face["status"] = "blocked"
        face["notes"] = f"crash: {exc!r}"
        save_state(state)
        print(f"[{face_key}] CRASH: {exc!r}", file=sys.stderr)
        return "blocked"

    if new_status == "ready" and runner.dryrun:
        # dry-run successful chain — record but don't mark done
        face["status"] = "needs_content" if face.get("status") == "needs_content" else "pending"
        face["notes"] = f"dryrun: {json.dumps(info, ensure_ascii=False)}"
        save_state(state)
        print(f"[{face_key}] DRYRUN OK  info={json.dumps(info, ensure_ascii=False)}")
        return "dryrun"

    face["status"] = new_status
    if info:
        face["notes"] = json.dumps(info, ensure_ascii=False)
    save_state(state)
    print(f"[{face_key}] {new_status.upper()}  info={json.dumps(info, ensure_ascii=False)}")
    return new_status


def cmd_run(
    edition: str,
    start_from: Optional[str],
    only: Optional[str],
    no_dashboard: bool = False,
) -> int:
    try:
        return _cmd_run_inner(edition, start_from, only)
    finally:
        # HARDENING §A: refresh dashboard after every run (success, partial,
        # or blocked) so 7788 reflects current state. Best-effort, never
        # touches the exit code.
        refresh_dashboard(no_dashboard=no_dashboard)


def _cmd_run_inner(edition: str, start_from: Optional[str], only: Optional[str]) -> int:
    state = load_state(edition)
    runner = common.Runner()

    if only and start_from:
        raise SystemExit("--from and --only are mutually exclusive")

    if only and only not in FACE_KEYS:
        raise SystemExit(f"--only must be one of {FACE_KEYS}, got {only!r}")
    if start_from and start_from not in FACE_KEYS:
        raise SystemExit(f"--from must be one of {FACE_KEYS}, got {start_from!r}")

    if only:
        sequence = [only]
    else:
        start_idx = FACE_KEYS.index(start_from) if start_from else 0
        sequence = FACE_KEYS[start_idx:]

    for key in sequence:
        # § Invariant 1: pre-check completion before running.
        mod = FACES[FACE_KEYS.index(key)]
        judged, _ = mod.judge(state, edition)
        if judged == "done":
            state["faces"][key]["status"] = "done"
            save_state(state)
            print(f"[SKIP] {key} (already done)")
            continue

        outcome = _run_face(key, state, edition, runner)
        if outcome == "needs_content":
            req = config.content_request_path(edition, key)
            print(
                f"NEEDS_CONTENT {key} -> {req}\n"
                f"Stop here. Fill content, then re-run:\n"
                f"  sap_four_faces.py run {edition} --from {key}"
            )
            return 2
        if outcome == "blocked":
            print(
                f"BLOCKED {key}. See state.faces.{key}.notes in "
                f"{config.state_path(edition)}",
                file=sys.stderr,
            )
            return 3
        if outcome == "dryrun":
            # dry-run does not progress real state; stop walking the pipeline
            # so we don't mask later faces' needs_content with stale judgments.
            continue
    return 0


# --------------------------------------------------------------------------
# Finalize — §9 invariant 2: only mark published when all four are done.
# --------------------------------------------------------------------------
def _all_done(state: Dict, edition: str) -> Tuple[bool, List[str]]:
    not_done: List[str] = []
    for mod, key in zip(FACES, FACE_KEYS):
        status, _ = mod.judge(state, edition)
        if status != "done":
            not_done.append(f"{key}:{status}")
    return (not not_done), not_done


def _write_summary(edition: str, kind: str, body: Dict) -> Path:
    ts = _dt.datetime.now().strftime("%Y%m%dT%H%M%S")
    path = config.working_dir(edition) / f"automation_summary_{ts}_{kind}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(body, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def _osascript_notify(title: str, body: str) -> None:
    """Best-effort macOS notification. Silent on failure / non-Darwin."""
    if sys.platform != "darwin":
        return
    # Escape double quotes so AppleScript doesn't break.
    safe_title = title.replace('"', "'")
    safe_body = body.replace('"', "'")
    try:
        subprocess.run(
            [
                "osascript",
                "-e",
                f'display notification "{safe_body}" with title "{safe_title}"',
            ],
            timeout=5,
            check=False,
        )
    except Exception:  # noqa: BLE001 - notification is best-effort
        pass


# --------------------------------------------------------------------------
# Dashboard auto-refresh (HARDENING §A)
# --------------------------------------------------------------------------
def _refresh_dashboard_impl() -> None:
    """Re-build the four-faces ledger + sync it to the 7788 console.

    Tries import-and-call first (cheaper, same process); falls back to
    subprocess if import fails. Both ledger_build and sync_dashboard live
    next to this file (see _HERE).
    """
    # 1) Rebuild ledger over a 16-day window.
    try:
        import ledger_build  # type: ignore

        ledger_build.main(["--window", "16"])
    except Exception as exc:  # noqa: BLE001 - subprocess fallback
        print(
            f"WARN: ledger_build import call failed ({exc!r}); falling back to subprocess",
            file=sys.stderr,
        )
        subprocess.run(
            [config.PYTHON, str(_HERE / "ledger_build.py"), "--window", "16"],
            check=False,
            timeout=120,
        )
    # 2) Sync dashboard html + ledger.json to the console worktree.
    try:
        import sync_dashboard  # type: ignore

        sync_dashboard.main()
    except Exception as exc:  # noqa: BLE001 - subprocess fallback
        print(
            f"WARN: sync_dashboard import call failed ({exc!r}); falling back to subprocess",
            file=sys.stderr,
        )
        subprocess.run(
            [config.PYTHON, str(_HERE / "sync_dashboard.py")],
            check=False,
            timeout=60,
        )


def refresh_dashboard(no_dashboard: bool = False) -> None:
    """Best-effort: rebuild ledger + push dashboard to 7788 console.

    Gated by `no_dashboard` (from `--no-dashboard`) and `SAP_FF_DRYRUN=1`.
    Any failure is swallowed with a WARN line — refresh **never** affects
    the caller's exit code (HARDENING §A).
    """
    if no_dashboard or config.is_dryrun():
        return
    try:
        _refresh_dashboard_impl()
    except Exception as exc:  # noqa: BLE001 - best-effort
        print(f"WARN: dashboard refresh failed: {exc!r}", file=sys.stderr)


def cmd_finalize(edition: str, no_dashboard: bool = False) -> int:
    try:
        return _cmd_finalize_inner(edition)
    finally:
        # HARDENING §A: refresh dashboard regardless of partial vs full success.
        refresh_dashboard(no_dashboard=no_dashboard)


def _cmd_finalize_inner(edition: str) -> int:
    state = load_state(edition)
    ok, blockers = _all_done(state, edition)

    if not ok:
        body = {
            "edition": edition,
            "result": "PARTIAL",
            "blockers": blockers,
            "faces": state["faces"],
            "ts": _now_iso(),
        }
        path = _write_summary(edition, "PARTIAL", body)
        print(
            f"REFUSE finalize: {len(blockers)} face(s) not done -> {blockers}\n"
            f"summary: {path}"
        )
        _osascript_notify(
            "sap-four-faces partial",
            f"{edition} blocked: {','.join(blockers)}",
        )
        return 4

    # All four done — write evidence markers and FULL_SUCCESS summary.
    published_marker = config.published_marker(edition)
    channels_marker = config.channels_published_marker(edition)
    config.working_dir(edition).mkdir(parents=True, exist_ok=True)
    published_marker.write_text(
        json.dumps(
            {
                "edition": edition,
                "face1.mediaId": state["faces"]["face1"].get("mediaId"),
                "face3.articles": state["faces"]["face3"].get("articles"),
                "ts": _now_iso(),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    channels_marker.write_text(
        json.dumps(
            {
                "edition": edition,
                "face2.objectIds": state["faces"]["face2"].get("objectIds"),
                "face4.shorts": state["faces"]["face4"].get("shorts"),
                "ts": _now_iso(),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    state["published"] = True
    save_state(state)

    body = {
        "edition": edition,
        "result": "FULL_SUCCESS",
        "faces": state["faces"],
        "markers": {
            "published": str(published_marker),
            "channelsPublished": str(channels_marker),
        },
        "ts": _now_iso(),
    }
    path = _write_summary(edition, "FULL_SUCCESS", body)
    print(f"FULL_SUCCESS  summary: {path}")
    return 0


# --------------------------------------------------------------------------
# run-daily — launchd entry (HARDENING §B)
# --------------------------------------------------------------------------
def _compute_edition_from_gate() -> Optional[str]:
    """Resolve today's edition via STUDIO/scripts/pipeline_stage_gate.py.

    Returns None on any failure (logged WARN); caller decides how to react.
    """
    try:
        res = subprocess.run(
            config.cmd_pipeline_stage_gate_edition_date(),
            capture_output=True,
            text=True,
            timeout=10,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"WARN: pipeline_stage_gate spawn failed: {exc!r}", file=sys.stderr)
        return None
    if res.returncode != 0:
        print(
            f"WARN: pipeline_stage_gate rc={res.returncode}: {res.stderr[:200]}",
            file=sys.stderr,
        )
        return None
    edition = (res.stdout or "").strip().splitlines()[-1].strip() if (res.stdout or "").strip() else ""
    if not _EDITION_RE.match(edition):
        print(
            f"WARN: pipeline_stage_gate returned non-date: {edition!r}",
            file=sys.stderr,
        )
        return None
    return edition


def cmd_run_daily(no_dashboard: bool = False) -> int:
    """Daily launchd entry. Compute edition → run → finalize if all done.

    Strict rules (HARDENING §B):
      - Under SAP_FF_DRYRUN=1: only print the plan, run nothing.
      - On needs_content / blocked / partial: osascript notify, do NOT
        fabricate content, do NOT write any marker, do NOT pass --skip-*.
      - Idempotent: state/checkpoint files in working/{edition}/ let
        repeated calls safely resume.
    """
    print("# four-faces run-daily")
    if config.is_dryrun():
        print("[DRYRUN] would compute edition via "
              f"{' '.join(config.cmd_pipeline_stage_gate_edition_date())}")
        print("[DRYRUN] would run: sap_four_faces.py run <edition>")
        print("[DRYRUN] would finalize when all four faces are done")
        print("[DRYRUN] would osascript-notify on needs_content / blocked / partial")
        return 0

    edition = _compute_edition_from_gate()
    if not edition:
        _osascript_notify(
            "sap-four-faces run-daily",
            "Failed to compute edition via pipeline_stage_gate.py",
        )
        return 5
    print(f"edition: {edition}")

    rc = cmd_run(edition, None, None, no_dashboard=no_dashboard)
    if rc == 2:
        _osascript_notify(
            "sap-four-faces NEEDS CONTENT",
            f"{edition}: see PIPE/working/{edition}/content_request_face*.md",
        )
        return rc
    if rc == 3:
        _osascript_notify(
            "sap-four-faces BLOCKED",
            f"{edition}: check four_faces_state.json -> notes",
        )
        return rc
    if rc != 0:
        _osascript_notify(
            "sap-four-faces run failed",
            f"{edition}: cmd_run rc={rc}",
        )
        return rc

    # rc == 0: check whether all four are really done (judge from disk).
    state = load_state(edition)
    ok, blockers = _all_done(state, edition)
    if not ok:
        _osascript_notify(
            "sap-four-faces PARTIAL",
            f"{edition}: {','.join(blockers)}",
        )
        return 4

    return cmd_finalize(edition, no_dashboard=no_dashboard)


# --------------------------------------------------------------------------
# CLI dispatch
# --------------------------------------------------------------------------
def _parse_args(argv: Optional[List[str]]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="SAP four-faces orchestrator")
    sub = p.add_subparsers(dest="cmd", required=True)

    for name in ("status", "plan"):
        sp = sub.add_parser(name)
        sp.add_argument("edition")

    sp_finalize = sub.add_parser("finalize")
    sp_finalize.add_argument("edition")
    sp_finalize.add_argument(
        "--no-dashboard", action="store_true", default=False,
        help="skip the post-run dashboard refresh (HARDENING §A)",
    )

    sp_run = sub.add_parser("run")
    sp_run.add_argument("edition")
    sp_run.add_argument("--from", dest="start_from", default=None)
    sp_run.add_argument("--only", dest="only", default=None)
    sp_run.add_argument(
        "--no-dashboard", action="store_true", default=False,
        help="skip the post-run dashboard refresh (HARDENING §A)",
    )

    sp_run_daily = sub.add_parser(
        "run-daily",
        help="launchd entry: compute edition → run → finalize-if-all-done (HARDENING §B)",
    )
    sp_run_daily.add_argument(
        "--no-dashboard", action="store_true", default=False,
        help="skip the post-run dashboard refresh",
    )
    sp_run_daily.set_defaults(edition=None)

    sp_audit = sub.add_parser("audit-scripts")
    sp_audit.set_defaults(edition=None)

    return p.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = _parse_args(argv)

    if args.cmd == "audit-scripts":
        missing = config.audit_scripts()
        if not missing:
            print("OK: all registered scripts exist.")
            return 0
        print("MISSING scripts:")
        for p in missing:
            print(f"  - {p}")
        return 1

    if args.cmd == "run-daily":
        return cmd_run_daily(no_dashboard=args.no_dashboard)

    edition = validate_edition(args.edition)
    if args.cmd == "status":
        return cmd_status(edition)
    if args.cmd == "plan":
        return cmd_plan(edition)
    if args.cmd == "run":
        return cmd_run(
            edition, args.start_from, args.only, no_dashboard=args.no_dashboard
        )
    if args.cmd == "finalize":
        return cmd_finalize(edition, no_dashboard=args.no_dashboard)
    return 1


if __name__ == "__main__":
    sys.exit(main())
