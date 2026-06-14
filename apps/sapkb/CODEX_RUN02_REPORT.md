# SAPKB Run02 执行报告（Codex 机械子任务）

## 产出文件
1. `apps/sapkb/scripts/harvest_runner.sh`
2. `apps/sapkb/launchd/com.ryan.sapkb.harvest-at-0630.plist`
3. `apps/sapkb/logs/.gitkeep`
4. `apps/sapkb/scripts/README.md`
5. `apps/sapkb/CODEX_RUN02_REPORT.md`（本报告）

## 用法
- runner：
  - 执行 `/usr/bin/bash apps/sapkb/scripts/harvest_runner.sh`
  - 会读取 `apps/sapkb/_design/configs/acquisition_sources.yaml`
  - 只处理 `fixture_csdn` 和 `sap_community_blogs`，并要求条目为 `enabled: true` 且 `reachable: true`
  - 依次调用 `/usr/bin/python3 cli.py harvest --source <id>`，日志追加到 `apps/sapkb/logs/harvest_<date>.log`
- launchd：
  - 定时设置为 06:30
  - Label 为 `com.ryan.sapkb.harvest-at-0630`
  - `StandardOutPath` 为 `apps/sapkb/logs/launchd.out`
  - `StandardErrPath` 为 `apps/sapkb/logs/launchd.err`

## 未 load 说明
按要求本次仅创建脚手架，不执行 `launchctl load`。

- 记录手动加载命令（仅注释）：
  - `launchctl load /Users/openclawxiaoer/sap-hub/apps/sapkb/launchd/com.ryan.sapkb.harvest-at-0630.plist`
- 手动卸载命令（仅注释）：
  - `launchctl unload /Users/openclawxiaoer/sap-hub/apps/sapkb/launchd/com.ryan.sapkb.harvest-at-0630.plist`

## 风险与说明
1. 该脚本不做状态落盘，重复执行可重复跑；重复去重依赖 pipeline 层。
2. 只写草稿级任务调度脚手架，不包含 `pipeline.py`、`dedup*.py`、`harvest.py`。
3. 当前仓库的采集源文件暂未显式包含 `enabled/reachable` 字段时，脚本默认按可运行处理；实际可用性依赖 Lead 后续在 YAML 中补齐字段。
