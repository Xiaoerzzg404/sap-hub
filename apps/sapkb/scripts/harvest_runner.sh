#!/usr/bin/env bash
# 用途：SAPKB 定时采集（draft-only）。仅抓【真实可达】公开源的元数据入草稿库，绝不发布。
# 幂等：去重在 pipeline 层保证，重复/补跑安全。
# 修订（Lead, Run02）：CONFIG 指向【实时配置】configs/sapkb（非 _design 旧拷贝）；
#   定时只跑真实可达源（sap_community_blogs）；fixture_csdn 仅供手动测试，不入定时。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"                 # = apps/sapkb
HUB_ROOT="$(cd "${REPO_ROOT}/../.." && pwd)"                # = ~/sap-hub
CONFIG_FILE="${HUB_ROOT}/configs/sapkb/acquisition_sources.yaml"
LOG_DIR="${REPO_ROOT}/logs"
LOG_FILE="${LOG_DIR}/harvest_$(date +%Y%m%d).log"
# 定时启用的真实可达源白名单（RSSHub 类源需本机 RSSHub 起来后再加入）
SUPPORTED_SOURCES=("sap_community_blogs")
OVERALL_STATUS=0
mkdir -p "$LOG_DIR"

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*" >> "$LOG_FILE"; }

log "SAPKB harvest runner 开始执行（config=${CONFIG_FILE}）"
if [[ ! -f "$CONFIG_FILE" ]]; then
  log "配置文件不存在：$CONFIG_FILE"; exit 1
fi

# 只跑“在 yaml 中存在为 - id 且在白名单内”的源（while-read 兼容 macOS bash 3.2）
TARGET_SOURCES=()
while IFS= read -r line; do
  [[ -n "$line" ]] && TARGET_SOURCES+=("$line")
done < <(
  /usr/bin/python3 - "$CONFIG_FILE" "${SUPPORTED_SOURCES[@]}" <<'PY'
import re, sys
config_file = sys.argv[1]
supported = set(sys.argv[2:])
for raw in open(config_file, encoding="utf-8"):
    m = re.match(r'^\s*-\s*id:\s*(.+)$', raw)
    if m:
        sid = m.group(1).strip().strip('"').strip("'")
        if sid in supported:
            print(sid)
PY
)

if ((${#TARGET_SOURCES[@]} == 0)); then
  log "未找到白名单内的真实可达源，已跳过"; exit 0
fi

cd "$REPO_ROOT"
for source_id in "${TARGET_SOURCES[@]}"; do
  log "开始执行源: ${source_id}"
  if /usr/bin/python3 cli.py harvest --source "$source_id" >> "$LOG_FILE" 2>&1; then
    log "完成源: ${source_id}"
  else
    status=$?; OVERALL_STATUS=$status
    log "源 ${source_id} 执行失败，退出码 ${status}"
  fi
done

log "SAPKB harvest runner 执行结束（status=${OVERALL_STATUS}）"
exit "$OVERALL_STATUS"
