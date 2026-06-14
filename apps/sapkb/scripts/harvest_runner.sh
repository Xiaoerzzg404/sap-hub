#!/usr/bin/env bash
# 用途：SAPKB 每日流水线（draft-only）。采集真实可达公开源元数据 → 重算热度 → 产选题简报。绝不发布。
# 幂等：去重/热度/简报均幂等，重复/补跑安全。
# 修订（Lead, Run14）：源选择改为【自动取 yaml 中 type∈{csdn_api,rss} 的真实可达源】，
#   不再用易漂移的手写白名单（rsshub 类需本机 RSSHub 故排除；manual/wewe_rss 占位排除）。
#   采集后接 recompute-popularity + export-brief，每天产新选题简报。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"                 # = apps/sapkb
HUB_ROOT="$(cd "${REPO_ROOT}/../.." && pwd)"                # = ~/sap-hub
CONFIG_FILE="${HUB_ROOT}/configs/sapkb/acquisition_sources.yaml"
LOG_DIR="${REPO_ROOT}/logs"
LOG_FILE="${LOG_DIR}/harvest_$(date +%Y%m%d).log"
OVERALL_STATUS=0
mkdir -p "$LOG_DIR"
log() { printf '[%s] %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*" >> "$LOG_FILE"; }

log "SAPKB daily runner 开始（config=${CONFIG_FILE}）"
if [[ ! -f "$CONFIG_FILE" ]]; then log "配置文件不存在：$CONFIG_FILE"; exit 1; fi

# 自动取 yaml 中真实可达类型的源（csdn_api / rss）
TARGET_SOURCES=()
while IFS= read -r line; do
  [[ -n "$line" ]] && TARGET_SOURCES+=("$line")
done < <(
  /usr/bin/python3 - "$CONFIG_FILE" <<'PY'
import re, sys
cur_id = None
for raw in open(sys.argv[1], encoding="utf-8"):
    m = re.match(r'^\s*-\s*id:\s*(.+)$', raw)
    if m:
        cur_id = m.group(1).strip().strip('"').strip("'"); continue
    mt = re.match(r'^\s*type:\s*(.+)$', raw)
    if mt and cur_id and mt.group(1).split('#')[0].strip() in ("csdn_api", "rss"):  # 剥行尾注释(FinalReview)
        print(cur_id); cur_id = None
PY
)

if ((${#TARGET_SOURCES[@]} == 0)); then
  log "未找到真实可达源（csdn_api/rss），已跳过采集"
else
  cd "$REPO_ROOT"
  for source_id in "${TARGET_SOURCES[@]}"; do
    log "采集源: ${source_id}"
    if /usr/bin/python3 cli.py harvest --source "$source_id" >> "$LOG_FILE" 2>&1; then
      log "完成: ${source_id}"
    else
      status=$?; OVERALL_STATUS=$status; log "源 ${source_id} 失败，退出码 ${status}"
    fi
  done
fi

# 采集后：重算热度 + 产选题简报（幂等，draft-only，不发布）
cd "$REPO_ROOT"
log "重算热度 popularity"
/usr/bin/python3 cli.py recompute-popularity >> "$LOG_FILE" 2>&1 || log "recompute-popularity 失败(忽略)"
log "导出选题简报"
/usr/bin/python3 cli.py export-brief >> "$LOG_FILE" 2>&1 || log "export-brief 失败(忽略)"

log "SAPKB daily runner 结束（status=${OVERALL_STATUS}）"
exit "$OVERALL_STATUS"
