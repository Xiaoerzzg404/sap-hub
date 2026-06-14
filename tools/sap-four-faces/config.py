"""Central path + command templates for the sap-four-faces orchestrator.

Every path here was verified against the live tree on 2026-06-14. When a
path differs from HANDOFF.md §6 (the spec embedded the relative
"scripts/..." names; we resolve which repo they live in), the comment
flags the resolution.

Python 3.9.6 — no PEP604 unions, use typing.Optional.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

# --------------------------------------------------------------------------
# Roots
# --------------------------------------------------------------------------
HOME = Path.home()
STUDIO = Path(os.environ.get("SAP_FF_STUDIO", HOME / "news" / "studio"))
PIPE = Path(
    os.environ.get(
        "SAP_FF_PIPE",
        HOME / "Documents" / "OpenClaw" / "sap-news-pipeline",
    )
)

# --------------------------------------------------------------------------
# Executables / environment
# --------------------------------------------------------------------------
PYTHON = os.environ.get("SAP_FF_PYTHON", "/usr/bin/python3")

# Mac PATH must include homebrew so node/npm are found (HANDOFF §1).
NODE_PATH_PREFIX = "/opt/homebrew/bin:/usr/local/bin:" + os.environ.get("PATH", "")

# Playwright bundled chromium (HANDOFF §1) — resolved at runtime by the
# subshell so we do not require the cache to exist at import time.
PLAYWRIGHT_EXEC_EXPR = (
    'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(ls -d '
    '~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/*.app/'
    'Contents/MacOS/* 2>/dev/null | tail -1)"'
)

# --------------------------------------------------------------------------
# Studio scripts (STUDIO/scripts/*.py)
# --------------------------------------------------------------------------
STUDIO_SCRIPTS = STUDIO / "scripts"
S_PIPELINE_STAGE_GATE = STUDIO_SCRIPTS / "pipeline_stage_gate.py"
S_DEDUPE_CHECK = STUDIO_SCRIPTS / "dedupe_check.py"
S_LINT_MAIN_ARTICLE = STUDIO_SCRIPTS / "lint_main_article.py"
S_VERIFY_ARTICLE_URLS = STUDIO_SCRIPTS / "verify_article_urls.py"
S_LINT_PUBLIC_TEXT = STUDIO_SCRIPTS / "lint_public_text.py"
S_CDP_PUBLISH_VIDEOS_V6 = STUDIO_SCRIPTS / "cdp_publish_videos_v6.py"
S_PREPARE_DEEP_COVER = STUDIO_SCRIPTS / "prepare_deep_cover.py"
S_AUTO_SPLIT_NEWS = STUDIO_SCRIPTS / "_auto_split_news.py"

# --------------------------------------------------------------------------
# Studio skills (STUDIO/skills/...)
# --------------------------------------------------------------------------
S_PUBLISH_DRAFT = (
    STUDIO / "skills" / "sap-wechat-publisher" / "scripts" / "publish_draft.py"
)
S_GEN_DEEP_ARTICLE = (
    STUDIO / "skills" / "sap-news-per-article" / "gen_deep_article.py"
)
S_PER_ARTICLE_RUNNER = (
    STUDIO / "skills" / "sap-news-per-article" / "per_article_runner.py"
)
S_RUN_DEEP_SHORTS_ALL = (
    STUDIO / "skills" / "sap-deep-short" / "scripts" / "run_deep_shorts_all.py"
)

# --------------------------------------------------------------------------
# Pipe scripts (PIPE/scripts/...)
# --------------------------------------------------------------------------
PIPE_SCRIPTS = PIPE / "scripts"
P_AUTO_NEWS_READY = PIPE_SCRIPTS / "_auto_news_ready.py"
# NOTE: HANDOFF §6 lists `scripts/_auto_channels_config.py` for Face2; the
# real file lives in PIPE/scripts/, not STUDIO/scripts/.
P_AUTO_CHANNELS_CONFIG = PIPE_SCRIPTS / "_auto_channels_config.py"

# --------------------------------------------------------------------------
# Pipe video-hyperframes
# --------------------------------------------------------------------------
P_EXTRACT_SHORT_EVENTS = (
    PIPE / "video-hyperframes" / "scripts" / "extract-short-events.js"
)

# --------------------------------------------------------------------------
# Working roots
# --------------------------------------------------------------------------
def working_dir(edition: str) -> Path:
    """PIPE/working/{edition}/ — state + evidence root."""
    return PIPE / "working" / edition


def state_path(edition: str) -> Path:
    return working_dir(edition) / "four_faces_state.json"


def content_request_path(edition: str, face: str) -> Path:
    return working_dir(edition) / f"content_request_{face}.md"


def published_marker(edition: str) -> Path:
    return working_dir(edition) / ".published"


def channels_published_marker(edition: str) -> Path:
    return working_dir(edition) / ".channels-published"


def channels_batch_config(edition: str) -> Path:
    return working_dir(edition) / "channels-batch-config.json"


def channels_live_confirmation_glob(edition: str) -> str:
    return str(
        working_dir(edition)
        / "hotnews_channels_live_confirmation_part*.json"
    )


def deep_shorts_status(edition: str) -> Path:
    return working_dir(edition) / "deep_shorts_status.json"


# --------------------------------------------------------------------------
# Face1: main hotspot article paths
# --------------------------------------------------------------------------
def main_article_draft_dir(edition: str) -> Path:
    return STUDIO / "data" / "drafts" / edition


def main_article_md(edition: str) -> Path:
    return main_article_draft_dir(edition) / "wechat-article.md"


# --------------------------------------------------------------------------
# Face3: per-article paths
# --------------------------------------------------------------------------
def per_article_dir(edition: str) -> Path:
    return STUDIO / "data" / "per-article" / edition


def per_article_root() -> Path:
    return STUDIO / "data" / "per-article"


# --------------------------------------------------------------------------
# Face4: deep_drafts / events paths
# --------------------------------------------------------------------------
def deep_drafts_dir(edition: str) -> Path:
    return PIPE / "input" / edition / "deep_drafts"


def short_video_events_path(edition: str) -> Path:
    return PIPE / "input" / edition / "short_video_events.json"


def shorts_input_json(edition: str) -> Path:
    return PIPE / "input" / edition / "input.json"


def pipe_input_root() -> Path:
    return PIPE / "input"


# --------------------------------------------------------------------------
# Script existence audit
# --------------------------------------------------------------------------
SCRIPT_REGISTRY: List[Path] = [
    S_PIPELINE_STAGE_GATE,
    S_DEDUPE_CHECK,
    S_LINT_MAIN_ARTICLE,
    S_VERIFY_ARTICLE_URLS,
    S_LINT_PUBLIC_TEXT,
    S_CDP_PUBLISH_VIDEOS_V6,
    S_PREPARE_DEEP_COVER,
    S_AUTO_SPLIT_NEWS,
    S_PUBLISH_DRAFT,
    S_GEN_DEEP_ARTICLE,
    S_PER_ARTICLE_RUNNER,
    S_RUN_DEEP_SHORTS_ALL,
    P_AUTO_NEWS_READY,
    P_AUTO_CHANNELS_CONFIG,
    P_EXTRACT_SHORT_EVENTS,
]


def audit_scripts() -> List[Path]:
    """Return registered script paths that do not exist on disk."""
    return [p for p in SCRIPT_REGISTRY if not p.exists()]


# --------------------------------------------------------------------------
# Command templates (HANDOFF §6) — return List[str] suitable for subprocess
# --------------------------------------------------------------------------
def cmd_pipeline_stage_gate_edition_date() -> List[str]:
    return [PYTHON, str(S_PIPELINE_STAGE_GATE), "--edition-date"]


def cmd_dedupe_check(urls_file: Path, window: int = 14) -> List[str]:
    return [
        PYTHON,
        str(S_DEDUPE_CHECK),
        "--urls-file",
        str(urls_file),
        "--window",
        str(window),
    ]


def cmd_lint_main_article(edition: str, variant: str = "hotspot") -> List[str]:
    return [
        PYTHON,
        str(S_LINT_MAIN_ARTICLE),
        str(main_article_md(edition)),
        "--variant",
        variant,
    ]


def cmd_verify_article_urls(edition: str) -> List[str]:
    return [
        PYTHON,
        str(S_VERIFY_ARTICLE_URLS),
        str(main_article_md(edition)),
    ]


def cmd_publish_main_draft(edition: str) -> List[str]:
    return [
        PYTHON,
        str(S_PUBLISH_DRAFT),
        edition,
        "--publish-date",
        edition,
        "--confirm",
    ]


def cmd_auto_split_news(edition: str) -> List[str]:
    return [PYTHON, str(S_AUTO_SPLIT_NEWS), edition, "--force"]


def cmd_auto_news_ready(edition: str) -> List[str]:
    return [PYTHON, str(P_AUTO_NEWS_READY), edition]


def cmd_render_cards(edition: str) -> str:
    """Shell-string form so we can prepend PATH + Playwright env exports."""
    return (
        f'export PATH={NODE_PATH_PREFIX} && {PLAYWRIGHT_EXEC_EXPR} && '
        f'cd {PIPE!s} && npm run render-cards -- --date {edition}'
    )


def cmd_render_videos(edition: str) -> str:
    return (
        f'export PATH={NODE_PATH_PREFIX} && {PLAYWRIGHT_EXEC_EXPR} && '
        f'cd {PIPE!s} && npm run render-videos -- --date {edition}'
    )


def cmd_auto_channels_config(edition: str) -> List[str]:
    return [PYTHON, str(P_AUTO_CHANNELS_CONFIG), edition]


def cmd_lint_public_text(target: Path) -> List[str]:
    return [PYTHON, str(S_LINT_PUBLIC_TEXT), str(target)]


def cmd_cdp_publish_videos_v6(edition: str) -> List[str]:
    return [
        PYTHON,
        str(S_CDP_PUBLISH_VIDEOS_V6),
        str(channels_batch_config(edition)),
    ]


def cmd_per_article_runner_next(n: int) -> List[str]:
    return [PYTHON, str(S_PER_ARTICLE_RUNNER), "--next", str(n)]


def cmd_gen_deep_article(content_json: Path, out_md: Path) -> List[str]:
    return [
        PYTHON,
        str(S_GEN_DEEP_ARTICLE),
        str(content_json),
        str(out_md),
    ]


def cmd_prepare_deep_cover(article_dir: Path) -> List[str]:
    return [PYTHON, str(S_PREPARE_DEEP_COVER), str(article_dir)]


def cmd_publish_deep_draft(
    edition: str, article_slug: str
) -> List[str]:
    return [
        PYTHON,
        str(S_PUBLISH_DRAFT),
        article_slug,
        "--draft-root",
        str(per_article_dir(edition)),
        "--publish-date",
        edition,
        "--keep-cover",
        # --skip-lint REQUIRED here, NOT the forbidden kind: 深度稿不是 NEWS 体例，
        # publish_draft 内嵌 lint_main_article(--variant hotspot) 会对深度稿误判 FAIL。
        # 深度稿真正的门是 lint_public_text(已在本 face 发布链先跑)。truth-gate(URL
        # 真实性)仍照常执行未跳过。与 per_article_runner.py 硬编码一致。
        "--skip-lint",
        "--confirm",
    ]


def cmd_extract_short_events(edition: str) -> str:
    return (
        f'export PATH={NODE_PATH_PREFIX} && '
        f'cd {PIPE!s} && node {P_EXTRACT_SHORT_EVENTS!s} '
        f'--date {edition}'
    )


def cmd_run_deep_shorts_all(edition: str, input_json: Optional[Path] = None) -> List[str]:
    j = input_json if input_json is not None else shorts_input_json(edition)
    return [
        PYTHON,
        str(S_RUN_DEEP_SHORTS_ALL),
        edition,
        str(j),
        "--push",
    ]


# --------------------------------------------------------------------------
# Misc
# --------------------------------------------------------------------------
DRYRUN_ENV = "SAP_FF_DRYRUN"


def is_dryrun() -> bool:
    return os.environ.get(DRYRUN_ENV, "").strip() == "1"
