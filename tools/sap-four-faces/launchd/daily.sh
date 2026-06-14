#!/usr/bin/env bash
# launchd entry for sap-four-faces (HARDENING §B).
#
# Red lines:
#   - 绝不出现 --skip-truth-gate
#   - 绝不出现 --skip-lint （--skip-lint 只在 face3 deep-article publish_draft 内部使用，
#     已硬编码在 config.cmd_publish_deep_draft；不在本脚本扩散）
#   - 绝不自行生成内容；缺内容 → run-daily 自己会 osascript 通知 Ryan/Cowork
#   - 绝不在四面未全 done 时手动写 marker
#
# Sets PATH + Playwright bundled Chromium env, then delegates to
# `sap_four_faces.py run-daily` which handles edition computation, run,
# finalize-if-all-done, and notifications.

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL="$(cd "$HERE/.." && pwd)"

# 1. node/npm must come from homebrew (HANDOFF §1).
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH:-}"

# 2. Use Playwright's bundled Chromium to avoid CDP single-instance conflicts
#    with the 9222 system Chrome (HANDOFF §1).
PW_EXEC="$(ls -d "$HOME/Library/Caches/ms-playwright/chromium-"*/chrome-mac-arm64/*.app/Contents/MacOS/* 2>/dev/null | tail -1)"
if [ -n "$PW_EXEC" ]; then
  export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$PW_EXEC"
fi

cd "$TOOL"
exec /usr/bin/python3 "$TOOL/sap_four_faces.py" run-daily "$@"
