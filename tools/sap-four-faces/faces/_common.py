"""Helpers shared by face1..face4 modules.

Includes:
- Runner: subprocess shim that honors SAP_FF_DRYRUN=1 (print only).
- deep_dedup: §8 gate used by Face3 (and exposed for tests).
- url scraping + content-request file writer.
"""
from __future__ import annotations

import datetime as _dt
import json
import os
import re
import shlex
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Set, Tuple, Union

import config

CommandLike = Union[Sequence[str], str]


# --------------------------------------------------------------------------
# Runner
# --------------------------------------------------------------------------
@dataclass
class RunResult:
    ok: bool
    rc: int
    stdout: str
    stderr: str
    label: str
    dryrun: bool = False


@dataclass
class Runner:
    """Subprocess shim — honors SAP_FF_DRYRUN=1.

    In dry-run mode no process is spawned: we print the resolved command
    and return ok=True. The orchestrator should treat dry-run results as
    informational only — never persist mediaId/objectId from them.
    """

    dryrun: bool = field(default_factory=config.is_dryrun)
    log: List[str] = field(default_factory=list)

    def _format(self, cmd: CommandLike) -> str:
        if isinstance(cmd, str):
            return cmd
        return " ".join(shlex.quote(c) for c in cmd)

    def run(
        self,
        cmd: CommandLike,
        label: str,
        cwd: Optional[Path] = None,
        env: Optional[dict] = None,
        timeout: Optional[int] = None,
        check: bool = False,
    ) -> RunResult:
        rendered = self._format(cmd)
        self.log.append(f"[{label}] {rendered}")
        if self.dryrun:
            print(f"[DRYRUN] [{label}] {rendered}")
            return RunResult(
                ok=True, rc=0, stdout="", stderr="", label=label, dryrun=True
            )
        shell = isinstance(cmd, str)
        try:
            proc = subprocess.run(
                cmd,
                shell=shell,
                cwd=str(cwd) if cwd else None,
                env=env,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired as exc:
            return RunResult(
                ok=False,
                rc=124,
                stdout=exc.stdout or "",
                stderr=(exc.stderr or "") + f"\n[timeout after {timeout}s]",
                label=label,
            )
        result = RunResult(
            ok=(proc.returncode == 0),
            rc=proc.returncode,
            stdout=proc.stdout or "",
            stderr=proc.stderr or "",
            label=label,
        )
        if check and not result.ok:
            raise RuntimeError(
                f"[{label}] failed rc={result.rc}\n{result.stderr[:1000]}"
            )
        return result

    def run_with_retry(
        self,
        cmd: CommandLike,
        label: str,
        retries: int = 1,
        **kwargs,
    ) -> RunResult:
        """Run cmd; if non-zero, retry once (§9 invariant 5)."""
        result = self.run(cmd, label, **kwargs)
        attempts = 0
        while not result.ok and attempts < retries:
            attempts += 1
            print(
                f"[RETRY {attempts}/{retries}] {label} rc={result.rc}"
            )
            result = self.run(cmd, f"{label}#retry{attempts}", **kwargs)
        return result


# --------------------------------------------------------------------------
# URL scraping helpers
# --------------------------------------------------------------------------
URL_RE = re.compile(r"https?://[^\s\"'<>)\]]+")


def extract_urls(text: str) -> List[str]:
    """Return absolute http(s) URLs found in text, deduped order-preserving."""
    seen: Set[str] = set()
    out: List[str] = []
    for m in URL_RE.findall(text or ""):
        url = m.rstrip(".,;)")
        if url not in seen:
            seen.add(url)
            out.append(url)
    return out


def canonical_url(url: str) -> str:
    """Best-effort canonicalization for dedup comparison.

    Lowercase scheme+host, strip trailing slashes / fragments / tracking
    query params. We intentionally keep the path-case intact so SAP CDNs
    with case-sensitive paths still distinguish correctly.
    """
    if not url:
        return ""
    url = url.strip()
    url = url.split("#", 1)[0]
    # drop common UTM-ish trackers
    if "?" in url:
        head, qs = url.split("?", 1)
        keep = [
            kv
            for kv in qs.split("&")
            if kv
            and not kv.lower().startswith(
                ("utm_", "fbclid=", "gclid=", "mc_cid=", "mc_eid=")
            )
        ]
        url = head + ("?" + "&".join(keep) if keep else "")
    if "://" in url:
        scheme, rest = url.split("://", 1)
        if "/" in rest:
            host, path = rest.split("/", 1)
            url = scheme.lower() + "://" + host.lower() + "/" + path
        else:
            url = scheme.lower() + "://" + rest.lower()
    return url.rstrip("/")


# --------------------------------------------------------------------------
# Date window
# --------------------------------------------------------------------------
def parse_edition(edition: str) -> _dt.date:
    return _dt.date.fromisoformat(edition)


def past_n_days(edition: str, n: int = 14) -> List[str]:
    """Return ISO date strings for the n days BEFORE edition (exclusive)."""
    base = parse_edition(edition)
    return [(base - _dt.timedelta(days=i)).isoformat() for i in range(1, n + 1)]


# --------------------------------------------------------------------------
# deep_dedup (§8) — used by Face3 to filter source URLs already
# consumed by recent deep articles or short videos.
# --------------------------------------------------------------------------
def _collect_per_article_urls(dates: Iterable[str]) -> Set[str]:
    used: Set[str] = set()
    root = config.per_article_root()
    if not root.exists():
        return used
    for d in dates:
        day_dir = root / d
        if not day_dir.is_dir():
            continue
        for content in day_dir.glob("article_*/content.json"):
            try:
                data = json.loads(content.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            refs = (data.get("sources") or {}).get("refs") or []
            for entry in refs:
                if isinstance(entry, str):
                    blob = entry
                elif isinstance(entry, (list, tuple)):
                    blob = " ".join(str(x) for x in entry)
                else:
                    blob = json.dumps(entry, ensure_ascii=False)
                for url in extract_urls(blob):
                    used.add(canonical_url(url))
    return used


_SOURCE_URL_RE = re.compile(
    r'^\s*sourceUrl\s*:\s*"?(?P<url>[^"\n]+?)"?\s*$', re.MULTILINE
)


def _collect_deep_draft_urls(dates: Iterable[str]) -> Set[str]:
    used: Set[str] = set()
    root = config.pipe_input_root()
    if not root.exists():
        return used
    for d in dates:
        draft_dir = root / d / "deep_drafts"
        if not draft_dir.is_dir():
            continue
        for md in draft_dir.glob("*.md"):
            try:
                text = md.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            for m in _SOURCE_URL_RE.finditer(text):
                used.add(canonical_url(m.group("url")))
    return used


def _collect_short_event_urls(dates: Iterable[str]) -> Set[str]:
    used: Set[str] = set()
    root = config.pipe_input_root()
    if not root.exists():
        return used
    for d in dates:
        path = root / d / "short_video_events.json"
        if not path.is_file():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        events = data.get("events") if isinstance(data, dict) else None
        if not isinstance(events, list):
            continue
        for ev in events:
            if isinstance(ev, dict):
                url = ev.get("sourceUrl")
                if isinstance(url, str) and url.startswith("http"):
                    used.add(canonical_url(url))
    return used


def collect_used_urls(edition: str, window: int = 14) -> Set[str]:
    """Union of URLs already consumed in the past `window` days."""
    dates = past_n_days(edition, window)
    used: Set[str] = set()
    used |= _collect_per_article_urls(dates)
    used |= _collect_deep_draft_urls(dates)
    used |= _collect_short_event_urls(dates)
    return used


def deep_dedup(
    candidate_urls: Iterable[str],
    edition: str,
    window: int = 14,
) -> List[str]:
    """Return candidate URLs not seen in the past `window` days.

    HANDOFF §8 — Face3 选题 gate. Order-preserving; case/utm-tolerant.
    """
    used = collect_used_urls(edition, window)
    out: List[str] = []
    seen: Set[str] = set()
    for raw in candidate_urls:
        if not raw:
            continue
        key = canonical_url(raw)
        if key in used or key in seen:
            continue
        seen.add(key)
        out.append(raw)
    return out


# --------------------------------------------------------------------------
# Content request writer (§7)
# --------------------------------------------------------------------------
def write_content_request(edition: str, face: str, body: str) -> Path:
    path = config.content_request_path(edition, face)
    path.parent.mkdir(parents=True, exist_ok=True)
    header = (
        f"# content_request · {face} · {edition}\n\n"
        f"> 由 sap-four-faces 编排器写入。LLM 按本文件要求产出内容到指定路径，\n"
        f"> 然后重新跑 `sap_four_faces.py run {edition} --from {face}`。\n"
        f"> 真实性硬底线：只翻译/浓缩真实命中来源，绝不编造（全局 CLAUDE.md N 节）。\n\n"
    )
    path.write_text(header + body.rstrip() + "\n", encoding="utf-8")
    return path


# --------------------------------------------------------------------------
# Misc helpers
# --------------------------------------------------------------------------
MEDIA_ID_RE = re.compile(r"media_id\s*=\s*([A-Za-z0-9_\-]+)")


def parse_media_id(text: str) -> Optional[str]:
    m = MEDIA_ID_RE.search(text or "")
    return m.group(1) if m else None


def list_json_glob(pattern: str) -> List[Path]:
    """Plain glob → sorted list of Paths (string pattern, since glob has *)."""
    from glob import glob

    return sorted(Path(p) for p in glob(pattern))
